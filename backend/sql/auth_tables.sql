-- Migration: run in phpMyAdmin if ecommerce_db already exists.
-- Skip any statement that errors because the object already exists.

USE ecommerce_db;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE IF NOT EXISTS businesses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_businesses_email (email)
);

ALTER TABLE products
  ADD COLUMN business_id INT UNSIGNED NULL AFTER id;

ALTER TABLE products
  ADD INDEX idx_products_business (business_id);

ALTER TABLE products
  ADD CONSTRAINT fk_products_business
  FOREIGN KEY (business_id) REFERENCES businesses(id)
  ON DELETE CASCADE;

-- No longer used (switched to PHP sessions). Safe to drop if you created it earlier:
-- DROP TABLE IF EXISTS auth_tokens;
