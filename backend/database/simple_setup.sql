-- Simple MySQL Database Setup for ConnectingFuture
-- Run this script to set up the basic database structure

-- Create database if it doesn't exist (using existing mockapp_db)
CREATE DATABASE IF NOT EXISTS mockapp_db;
USE mockapp_db;

-- Create users table (for Auth0 integration)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auth0_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255) NOT NULL,
  donor_phone VARCHAR(20),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50) NOT NULL,
  payment_id VARCHAR(255) UNIQUE,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  transaction_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  donation_type ENUM('one-time', 'monthly', 'yearly') DEFAULT 'one-time',
  cause_category VARCHAR(100),
  anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  receipt_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_donor_email (donor_email),
  INDEX idx_payment_id (payment_id),
  INDEX idx_transaction_status (transaction_status),
  INDEX idx_created_at (created_at)
);

-- Insert some sample data for testing
INSERT INTO donations (
  donor_name, donor_email, amount, payment_method, transaction_status, 
  cause_category, message, payment_id
) VALUES 
  ('John Doe', 'john@example.com', 1000.00, 'razorpay', 'completed', 'Education', 'Happy to support education!', 'pay_test_001'),
  ('Jane Smith', 'jane@example.com', 500.00, 'razorpay', 'completed', 'Healthcare', 'For a good cause', 'pay_test_002'),
  ('Anonymous Donor', 'donor@example.com', 2000.00, 'razorpay', 'completed', 'General', NULL, 'pay_test_003');

-- Show the created tables
SHOW TABLES;

-- Display sample data
SELECT 'Sample donations:' as Info;
SELECT id, donor_name, donor_email, amount, transaction_status, created_at FROM donations LIMIT 5;
