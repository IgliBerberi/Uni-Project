<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/db_connect.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/uploads.php';

$method = resolveRequestMethod();

function validateProduct(array $input, bool $partial = false): array
{
    $errors = [];
    $fields = [
        'name' => fn($v) => is_string($v) && trim($v) !== '',
        'description' => fn($v) => is_string($v),
        'price' => fn($v) => is_numeric($v) && (float) $v >= 0,
        'image_url' => fn($v) => isValidStoredImagePath($v === '' ? null : $v),
        'stock' => fn($v) => filter_var($v, FILTER_VALIDATE_INT) !== false && (int) $v >= 0,
        'is_active' => fn($v) => in_array((int) $v, [0, 1], true) || in_array($v, [true, false, 0, 1, '0', '1'], true),
    ];

    foreach ($fields as $key => $validator) {
        if ($partial && !array_key_exists($key, $input)) {
            continue;
        }
        if (!$partial && !array_key_exists($key, $input) && !in_array($key, ['image_url', 'description'], true)) {
            if (in_array($key, ['name', 'price', 'stock'], true)) {
                $errors[] = "{$key} is required.";
            }
            continue;
        }
        if (array_key_exists($key, $input) && !$validator($input[$key])) {
            $errors[] = "Invalid {$key}.";
        }
    }

    return $errors;
}

function productBelongsToBusiness(PDO $pdo, int $productId, int $businessId): bool
{
    $stmt = $pdo->prepare('SELECT id FROM products WHERE id = :id AND business_id = :business_id');
    $stmt->execute([':id' => $productId, ':business_id' => $businessId]);
    return (bool) $stmt->fetch();
}

function getExistingProduct(PDO $pdo, int $id, int $businessId): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id AND business_id = :business_id');
    $stmt->execute([':id' => $id, ':business_id' => $businessId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function applyImageToInput(array $input, ?array $existing = null): array
{
    $upload = getUploadedProductImage();
    $removeImage = !empty($input['remove_image']) && (int) $input['remove_image'] === 1;

    if ($upload) {
        try {
            $newPath = saveProductImage($upload);
            if ($existing && !empty($existing['image_url'])) {
                deleteProductImage($existing['image_url']);
            }
            $input['image_url'] = $newPath;
        } catch (RuntimeException $e) {
            jsonResponse(false, null, $e->getMessage(), 422);
        }
    } elseif ($removeImage) {
        if ($existing && !empty($existing['image_url'])) {
            deleteProductImage($existing['image_url']);
        }
        $input['image_url'] = null;
    } elseif ($existing) {
        $input['image_url'] = $existing['image_url'];
    }

    return $input;
}

switch ($method) {
    case 'GET':
        $productId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if ($productId > 0) {
            $stmt = $pdo->prepare(
                'SELECT id, business_id, name, description, price, image_url, stock, is_active, created_at, updated_at
                 FROM products WHERE id = :id AND is_active = 1'
            );
            $stmt->execute([':id' => $productId]);
            $product = $stmt->fetch();
            if (!$product) {
                jsonResponse(false, null, 'Product not found.', 404);
            }
            jsonResponse(true, $product);
        }

        $activeOnly = !isset($_GET['all']) || $_GET['all'] !== '1';
        $sql = 'SELECT id, business_id, name, description, price, image_url, stock, is_active, created_at, updated_at FROM products';
        $params = [];

        if ($activeOnly) {
            $sql .= ' WHERE is_active = 1';
        } else {
            $business = requireBusinessAuth($pdo);
            $sql .= ' WHERE business_id = :business_id';
            $params[':business_id'] = $business['id'];
        }

        $sql .= ' ORDER BY created_at DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        jsonResponse(true, $stmt->fetchAll());
        break;

    case 'POST':
        $business = requireBusinessAuth($pdo);
        $input = readProductRequestInput();
        $errors = validateProduct($input);
        if ($errors) {
            jsonResponse(false, null, implode(' ', $errors), 422);
        }

        $input = applyImageToInput($input);

        $stmt = $pdo->prepare(
            'INSERT INTO products (business_id, name, description, price, image_url, stock, is_active)
             VALUES (:business_id, :name, :description, :price, :image_url, :stock, :is_active)'
        );
        $stmt->execute([
            ':business_id' => $business['id'],
            ':name' => trim($input['name']),
            ':description' => trim($input['description'] ?? ''),
            ':price' => number_format((float) $input['price'], 2, '.', ''),
            ':image_url' => !empty($input['image_url']) ? $input['image_url'] : null,
            ':stock' => (int) ($input['stock'] ?? 0),
            ':is_active' => isset($input['is_active']) ? (int) (bool) $input['is_active'] : 1,
        ]);

        $id = (int) $pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id');
        $stmt->execute([':id' => $id]);
        jsonResponse(true, $stmt->fetch(), 'Product created.', 201);
        break;

    case 'PUT':
        $business = requireBusinessAuth($pdo);
        $input = readProductRequestInput();
        $id = isset($_GET['id']) ? (int) $_GET['id'] : (int) ($input['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse(false, null, 'Product id is required.', 400);
        }

        $existing = getExistingProduct($pdo, $id, $business['id']);
        if (!$existing) {
            jsonResponse(false, null, 'Product not found.', 404);
        }

        $errors = validateProduct($input, true);
        if ($errors) {
            jsonResponse(false, null, implode(' ', $errors), 422);
        }

        $input = applyImageToInput($input, $existing);

        $fields = [];
        $params = [':id' => $id, ':business_id' => $business['id']];
        $map = [
            'name' => 'name',
            'description' => 'description',
            'price' => 'price',
            'image_url' => 'image_url',
            'stock' => 'stock',
            'is_active' => 'is_active',
        ];

        foreach ($map as $key => $column) {
            if (!array_key_exists($key, $input)) {
                continue;
            }
            $value = $input[$key];
            if ($key === 'name') {
                $value = trim($value);
            }
            if ($key === 'price') {
                $value = number_format((float) $value, 2, '.', '');
            }
            if ($key === 'stock') {
                $value = (int) $value;
            }
            if ($key === 'is_active') {
                $value = (int) (bool) $value;
            }
            if ($key === 'image_url') {
                $value = !empty($value) ? $value : null;
            }
            $fields[] = "{$column} = :{$column}";
            $params[":{$column}"] = $value;
        }

        if (empty($fields)) {
            jsonResponse(false, null, 'No fields to update.', 400);
        }

        $sql = 'UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = :id AND business_id = :business_id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id');
        $stmt->execute([':id' => $id]);
        jsonResponse(true, $stmt->fetch(), 'Product updated.');
        break;

    case 'DELETE':
        $business = requireBusinessAuth($pdo);
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if ($id <= 0) {
            jsonResponse(false, null, 'Product id is required.', 400);
        }

        $existing = getExistingProduct($pdo, $id, $business['id']);
        if (!$existing) {
            jsonResponse(false, null, 'Product not found.', 404);
        }

        deleteProductImage($existing['image_url'] ?? null);

        $stmt = $pdo->prepare('DELETE FROM products WHERE id = :id AND business_id = :business_id');
        $stmt->execute([':id' => $id, ':business_id' => $business['id']]);
        jsonResponse(true, null, 'Product deleted.');
        break;

    default:
        jsonResponse(false, null, 'Method not allowed.', 405);
}
