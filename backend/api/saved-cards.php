<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/db_connect.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/card_crypto.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireUserAuth($pdo);

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare(
            'SELECT id, cardholder_name, last_four, expiry_month, expiry_year, card_brand, is_default
             FROM user_saved_cards
             WHERE user_id = :user_id
             ORDER BY is_default DESC, created_at DESC'
        );
        $stmt->execute([':user_id' => $user['id']]);
        $cards = array_map('publicSavedCard', $stmt->fetchAll());
        jsonResponse(true, $cards);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if ($id <= 0) {
            jsonResponse(false, null, 'Card id is required.', 400);
        }
        $stmt = $pdo->prepare('DELETE FROM user_saved_cards WHERE id = :id AND user_id = :user_id');
        $stmt->execute([':id' => $id, ':user_id' => $user['id']]);
        if ($stmt->rowCount() === 0) {
            jsonResponse(false, null, 'Card not found.', 404);
        }
        jsonResponse(true, null, 'Card removed.');
        break;

    default:
        jsonResponse(false, null, 'Method not allowed.', 405);
}
