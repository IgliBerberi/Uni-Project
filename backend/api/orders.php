<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/db_connect.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    jsonResponse(false, null, 'Method not allowed.', 405);
}

$user = requireUserAuth($pdo);

$stmt = $pdo->prepare(
    'SELECT o.id, o.order_number, o.payment_method, o.subtotal, o.shipping_fee, o.total,
            o.status, o.created_at, o.shipping_full_name, o.shipping_city,
            oi.id AS item_id, oi.product_id, oi.product_name, oi.unit_price,
            oi.quantity, oi.line_total, oi.image_url
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = :user_id
        OR (o.user_id IS NULL AND LOWER(o.shipping_email) = LOWER(:email))
     ORDER BY o.created_at DESC, oi.id ASC'
);
$stmt->execute([
    ':user_id' => $user['id'],
    ':email' => $user['email'],
]);

$ordersById = [];

while ($row = $stmt->fetch()) {
    $orderId = (int) $row['id'];

    if (!isset($ordersById[$orderId])) {
        $ordersById[$orderId] = [
            'id' => $orderId,
            'order_number' => $row['order_number'],
            'payment_method' => $row['payment_method'],
            'subtotal' => (float) $row['subtotal'],
            'shipping_fee' => (float) $row['shipping_fee'],
            'total' => (float) $row['total'],
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'shipping_full_name' => $row['shipping_full_name'],
            'shipping_city' => $row['shipping_city'],
            'items' => [],
        ];
    }

    if ($row['item_id'] !== null) {
        $ordersById[$orderId]['items'][] = [
            'id' => (int) $row['item_id'],
            'product_id' => (int) $row['product_id'],
            'product_name' => $row['product_name'],
            'unit_price' => (float) $row['unit_price'],
            'quantity' => (int) $row['quantity'],
            'line_total' => (float) $row['line_total'],
            'image_url' => $row['image_url'],
        ];
    }
}

jsonResponse(true, array_values($ordersById));
