-- Useful SQL queries for NovaShop
-- Logins use PHP sessions ($_SESSION), not database tokens.

-- ========== USERS ==========
INSERT INTO users (full_name, email, password_hash)
VALUES ('Jane Doe', 'jane@example.com', '$2y$10$example_hashed_password_from_php');

SELECT id, full_name, email, password_hash FROM users WHERE email = 'jane@example.com';

-- ========== BUSINESSES ==========
INSERT INTO businesses (business_name, email, password_hash)
VALUES ('Nova Electronics', 'shop@example.com', '$2y$10$example_hashed_password_from_php');

SELECT id, business_name, email, password_hash FROM businesses WHERE email = 'shop@example.com';

-- ========== STOREFRONT ==========
SELECT id, name, description, price, image_url, stock
FROM products
WHERE is_active = 1
ORDER BY created_at DESC;

-- ========== BUSINESS INVENTORY ==========
SELECT * FROM products WHERE business_id = 1 ORDER BY created_at DESC;
