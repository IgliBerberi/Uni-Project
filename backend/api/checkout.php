<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/db_connect.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/card_crypto.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    jsonResponse(false, null, 'Method not allowed.', 405);
}

$user = getUserSession();
$input = readJsonBody();

$shipping = $input['shipping'] ?? [];
$items = $input['items'] ?? [];
$paymentMethod = $input['payment_method'] ?? 'card';
$saveCard = !empty($input['save_card']);
$savedCardId = isset($input['saved_card_id']) ? (int) $input['saved_card_id'] : 0;
$cardInput = $input['card'] ?? [];

if (empty($items) || !is_array($items)) {
    jsonResponse(false, null, 'Cart is empty.', 422);
}

$requiredShipping = ['full_name', 'email', 'phone', 'address', 'city', 'postal_code'];
foreach ($requiredShipping as $field) {
    if (empty(trim((string) ($shipping[$field] ?? '')))) {
        jsonResponse(false, null, 'Complete shipping information is required.', 422);
    }
}

if (!in_array($paymentMethod, ['card', 'cash'], true)) {
    jsonResponse(false, null, 'Invalid payment method.', 422);
}

if ($saveCard && !$user) {
    jsonResponse(false, null, 'Log in to save your card for next time.', 401);
}

$cardLastFour = null;
$cardBrand = null;
$cardholderName = null;
$orderSavedCardId = null;
$encryptedForSave = null;
$expiryMonth = null;
$expiryYear = null;

if ($paymentMethod === 'card') {
    if ($savedCardId > 0) {
        if (!$user) {
            jsonResponse(false, null, 'Log in to use a saved card.', 401);
        }
        $stmt = $pdo->prepare(
            'SELECT * FROM user_saved_cards WHERE id = :id AND user_id = :user_id'
        );
        $stmt->execute([':id' => $savedCardId, ':user_id' => $user['id']]);
        $saved = $stmt->fetch();
        if (!$saved) {
            jsonResponse(false, null, 'Saved card not found.', 404);
        }
        if (empty($cardInput['cvv']) || strlen(digitsOnly($cardInput['cvv'])) < 3) {
            jsonResponse(false, null, 'CVV is required for saved cards.', 422);
        }
        $cardLastFour = $saved['last_four'];
        $cardBrand = $saved['card_brand'];
        $cardholderName = $saved['cardholder_name'];
        $orderSavedCardId = $savedCardId;
        $expiryMonth = $saved['expiry_month'];
        $expiryYear = $saved['expiry_year'];
    } else {
        $number = digitsOnly($cardInput['number'] ?? '');
        $expiry = parseExpiry($cardInput['expiry'] ?? '');
        $cvv = digitsOnly($cardInput['cvv'] ?? '');
        $cardholderName = trim($cardInput['name'] ?? '');

        if (strlen($number) < 13 || strlen($number) > 19) {
            jsonResponse(false, null, 'Invalid card number.', 422);
        }
        if (!$expiry) {
            jsonResponse(false, null, 'Invalid expiry date.', 422);
        }
        if (strlen($cvv) < 3 || strlen($cvv) > 4) {
            jsonResponse(false, null, 'Invalid CVV.', 422);
        }
        if ($cardholderName === '') {
            jsonResponse(false, null, 'Cardholder name is required.', 422);
        }

        $cardLastFour = lastFourDigits($number);
        $cardBrand = detectCardBrand($number);
        $expiryMonth = $expiry['month'];
        $expiryYear = $expiry['year'];

        if ($saveCard && $user) {
            $encryptedForSave = encryptCardNumber($number);
        }
    }
}

$shippingFee = (float) ($input['shipping_fee'] ?? 0);
$subtotal = 0;

try {
    $pdo->beginTransaction();

    $orderNumber = 'NS-' . strtoupper(base_convert((string) time(), 10, 36));

    $stmt = $pdo->prepare(
        'INSERT INTO orders (
            user_id, order_number, payment_method,
            shipping_full_name, shipping_email, shipping_phone,
            shipping_address, shipping_city, shipping_postal_code,
            card_last_four, card_brand, cardholder_name, saved_card_id,
            subtotal, shipping_fee, total, status
        ) VALUES (
            :user_id, :order_number, :payment_method,
            :shipping_full_name, :shipping_email, :shipping_phone,
            :shipping_address, :shipping_city, :shipping_postal_code,
            :card_last_four, :card_brand, :cardholder_name, :saved_card_id,
            :subtotal, :shipping_fee, :total, :status
        )'
    );

    $stmt->execute([
        ':user_id' => $user['id'] ?? null,
        ':order_number' => $orderNumber,
        ':payment_method' => $paymentMethod,
        ':shipping_full_name' => trim($shipping['full_name']),
        ':shipping_email' => strtolower(trim($shipping['email'])),
        ':shipping_phone' => trim($shipping['phone']),
        ':shipping_address' => trim($shipping['address']),
        ':shipping_city' => trim($shipping['city']),
        ':shipping_postal_code' => trim($shipping['postal_code']),
        ':card_last_four' => $cardLastFour,
        ':card_brand' => $cardBrand,
        ':cardholder_name' => $cardholderName,
        ':saved_card_id' => $orderSavedCardId,
        ':subtotal' => 0,
        ':shipping_fee' => number_format($shippingFee, 2, '.', ''),
        ':total' => 0,
        ':status' => 'placed',
    ]);

    $orderId = (int) $pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        'INSERT INTO order_items (
            order_id, product_id, product_name, product_description,
            unit_price, quantity, line_total, image_url
        ) VALUES (
            :order_id, :product_id, :product_name, :product_description,
            :unit_price, :quantity, :line_total, :image_url
        )'
    );

    $stockStmt = $pdo->prepare(
        'UPDATE products SET stock = stock - :qty_remove
         WHERE id = :id AND stock >= :qty_needed AND is_active = 1'
    );

    $productCheckStmt = $pdo->prepare(
        'SELECT id, name, stock, is_active FROM products WHERE id = :id'
    );

    foreach ($items as $item) {
        $productId = (int) ($item['product_id'] ?? 0);
        $qty = (int) ($item['quantity'] ?? 0);
        $price = (float) ($item['price'] ?? 0);
        $itemName = $item['name'] ?? 'Product';

        if ($productId <= 0 || $qty <= 0) {
            throw new RuntimeException('Invalid cart item.');
        }

        $productCheckStmt->execute([':id' => $productId]);
        $productRow = $productCheckStmt->fetch();
        if (!$productRow || !(int) $productRow['is_active']) {
            throw new RuntimeException("\"{$itemName}\" is no longer available.");
        }
        if ((int) $productRow['stock'] < $qty) {
            throw new RuntimeException(
                "Not enough stock for \"{$itemName}\" (only {$productRow['stock']} left)."
            );
        }

        $stockStmt->execute([
            ':qty_remove' => $qty,
            ':qty_needed' => $qty,
            ':id' => $productId,
        ]);
        if ($stockStmt->rowCount() === 0) {
            throw new RuntimeException("Could not reserve stock for \"{$itemName}\".");
        }

        $lineTotal = round($price * $qty, 2);
        $subtotal += $lineTotal;

        $itemStmt->execute([
            ':order_id' => $orderId,
            ':product_id' => $productId,
            ':product_name' => $item['name'] ?? 'Product',
            ':product_description' => $item['description'] ?? '',
            ':unit_price' => number_format($price, 2, '.', ''),
            ':quantity' => $qty,
            ':line_total' => number_format($lineTotal, 2, '.', ''),
            ':image_url' => $item['image_url'] ?? null,
        ]);
    }

    $total = round($subtotal + $shippingFee, 2);

    $pdo->prepare('UPDATE orders SET subtotal = :subtotal, total = :total WHERE id = :id')
        ->execute([
            ':subtotal' => number_format($subtotal, 2, '.', ''),
            ':total' => number_format($total, 2, '.', ''),
            ':id' => $orderId,
        ]);

    if ($saveCard && $user && $encryptedForSave && $paymentMethod === 'card') {
        $pdo->prepare('UPDATE user_saved_cards SET is_default = 0 WHERE user_id = :user_id')
            ->execute([':user_id' => $user['id']]);

        $pdo->prepare(
            'INSERT INTO user_saved_cards (
                user_id, cardholder_name, last_four, expiry_month, expiry_year,
                card_brand, encrypted_card_number, is_default
            ) VALUES (
                :user_id, :cardholder_name, :last_four, :expiry_month, :expiry_year,
                :card_brand, :encrypted_card_number, 1
            )'
        )->execute([
            ':user_id' => $user['id'],
            ':cardholder_name' => $cardholderName,
            ':last_four' => $cardLastFour,
            ':expiry_month' => $expiryMonth,
            ':expiry_year' => $expiryYear,
            ':card_brand' => $cardBrand,
            ':encrypted_card_number' => $encryptedForSave,
        ]);
    }

    $pdo->commit();

    jsonResponse(true, [
        'order_id' => $orderId,
        'order_number' => $orderNumber,
        'total' => $total,
        'payment_method' => $paymentMethod,
        'card_saved' => $saveCard && $user && $encryptedForSave,
    ], 'Order placed.', 201);
} catch (RuntimeException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, $e->getMessage(), 422);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $msg = $e->getMessage();
    if (str_contains($msg, 'orders') || str_contains($msg, "doesn't exist")) {
        jsonResponse(false, null, 'Checkout tables missing. Run backend/sql/checkout_tables.sql in phpMyAdmin.', 500);
    }
    jsonResponse(false, null, 'Database error while placing order.', 500);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, 'Could not place order. Please try again.', 500);
}
