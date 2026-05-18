<?php

const UPLOAD_PRODUCTS_DIR = __DIR__ . '/../uploads/products';
const UPLOAD_PRODUCTS_URL_PREFIX = '/uploads/products/';
const UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function ensureProductsUploadDir(): void
{
    if (!is_dir(UPLOAD_PRODUCTS_DIR)) {
        mkdir(UPLOAD_PRODUCTS_DIR, 0755, true);
    }
}

function isValidStoredImagePath(?string $path): bool
{
    if ($path === null || $path === '') {
        return true;
    }
    if (filter_var($path, FILTER_VALIDATE_URL)) {
        return true;
    }
    return str_starts_with($path, UPLOAD_PRODUCTS_URL_PREFIX);
}

function deleteProductImage(?string $path): void
{
    if ($path === null || $path === '' || !str_starts_with($path, UPLOAD_PRODUCTS_URL_PREFIX)) {
        return;
    }
    $filename = basename($path);
    $file = UPLOAD_PRODUCTS_DIR . '/' . $filename;
    if (is_file($file)) {
        unlink($file);
    }
}

function saveProductImage(array $file): string
{
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Image upload failed.');
    }
    if ($file['size'] > UPLOAD_MAX_BYTES) {
        throw new RuntimeException('Image must be 5 MB or smaller.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    if (!isset($allowed[$mime])) {
        throw new RuntimeException('Image must be JPG, PNG, WebP, or GIF.');
    }

    ensureProductsUploadDir();
    $name = bin2hex(random_bytes(16)) . '.' . $allowed[$mime];
    $destination = UPLOAD_PRODUCTS_DIR . '/' . $name;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        throw new RuntimeException('Could not save image.');
    }

    return UPLOAD_PRODUCTS_URL_PREFIX . $name;
}

function readProductRequestInput(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($contentType, 'multipart/form-data')) {
        return [
            'name' => $_POST['name'] ?? '',
            'description' => $_POST['description'] ?? '',
            'price' => $_POST['price'] ?? '',
            'stock' => $_POST['stock'] ?? '',
            'is_active' => $_POST['is_active'] ?? '1',
            'remove_image' => $_POST['remove_image'] ?? '0',
            '_method' => $_POST['_method'] ?? null,
        ];
    }
    return readJsonBody();
}

function getUploadedProductImage(): ?array
{
    if (!isset($_FILES['image']) || $_FILES['image']['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    return $_FILES['image'];
}

function resolveRequestMethod(): string
{
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'POST') {
        $override = $_POST['_method'] ?? null;
        if ($override === 'PUT') {
            return 'PUT';
        }
    }
    return $method;
}
