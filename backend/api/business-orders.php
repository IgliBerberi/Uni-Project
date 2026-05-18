<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/db_connect.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    jsonResponse(false, null, 'Method not allowed.', 405);
}

$business = requireBusinessAuth($pdo);
$businessId = (int) $business['id'];

$stmt = $pdo->prepare(
    'SELECT o.id, o.order_number, o.payment_method, o.status, o.created_at,
            o.shipping_full_name, o.shipping_email, o.shipping_phone,
            o.shipping_address, o.shipping_city, o.shipping_postal_code,
            o.card_last_four, o.card_brand, o.cardholder_name,
            o.user_id,
            u.email AS account_email, u.full_name AS account_name,
            oi.id AS item_id, oi.product_id, oi.product_name, oi.product_description,
            oi.unit_price, oi.quantity, oi.line_total, oi.image_url
     FROM orders o
     INNER JOIN order_items oi ON oi.order_id = o.id
     INNER JOIN products p ON p.id = oi.product_id AND p.business_id = :business_id
     LEFT JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC, oi.id ASC'
);
$stmt->execute([':business_id' => $businessId]);

$ordersById = [];

while ($row = $stmt->fetch()) {
    $orderId = (int) $row['id'];

    if (!isset($ordersById[$orderId])) {
        $userId = $row['user_id'] !== null ? (int) $row['user_id'] : null;
        $ordersById[$orderId] = [
            'id' => $orderId,
            'order_number' => $row['order_number'],
            'payment_method' => $row['payment_method'],
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'customer' => [
                'full_name' => $row['shipping_full_name'],
                'email' => $row['shipping_email'],
                'phone' => $row['shipping_phone'],
                'address' => $row['shipping_address'],
                'city' => $row['shipping_city'],
                'postal_code' => $row['shipping_postal_code'],
                'is_registered' => $userId !== null,
                'user_id' => $userId,
                'account_name' => $row['account_name'],
                'account_email' => $row['account_email'],
            ],
            'payment' => [
                'method' => $row['payment_method'],
                'card_brand' => $row['card_brand'],
                'card_last_four' => $row['card_last_four'],
                'cardholder_name' => $row['cardholder_name'],
            ],
            'business_subtotal' => 0,
            'items' => [],
        ];
    }

    $lineTotal = (float) $row['line_total'];
    $ordersById[$orderId]['business_subtotal'] += $lineTotal;
    $ordersById[$orderId]['items'][] = [
        'id' => (int) $row['item_id'],
        'product_id' => (int) $row['product_id'],
        'product_name' => $row['product_name'],
        'product_description' => $row['product_description'],
        'unit_price' => (float) $row['unit_price'],
        'quantity' => (int) $row['quantity'],
        'line_total' => $lineTotal,
        'image_url' => $row['image_url'],
    ];
}

foreach ($ordersById as &$order) {
    $order['business_subtotal'] = round($order['business_subtotal'], 2);
}
unset($order);

jsonResponse(true, array_values($ordersById));
