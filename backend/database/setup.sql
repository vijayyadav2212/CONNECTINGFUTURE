-- ConnectingFuture Database Setup Script
-- Run this script to set up the database and tables for donation management

-- Create database
CREATE DATABASE IF NOT EXISTS connectingfuture;
USE connectingfuture;

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
  
  -- Indexes for better performance
  INDEX idx_donor_email (donor_email),
  INDEX idx_payment_id (payment_id),
  INDEX idx_transaction_status (transaction_status),
  INDEX idx_created_at (created_at),
  INDEX idx_cause_category (cause_category),
  INDEX idx_donation_type (donation_type)
);

-- Create donation analytics table
CREATE TABLE IF NOT EXISTS donation_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  total_donations INT DEFAULT 0,
  unique_donors INT DEFAULT 0,
  avg_donation_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_date (date),
  INDEX idx_date (date)
);

-- Create donor profiles table (optional - for enhanced donor management)
CREATE TABLE IF NOT EXISTS donor_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  postal_code VARCHAR(20),
  date_of_birth DATE,
  occupation VARCHAR(100),
  company VARCHAR(255),
  preferred_contact_method ENUM('email', 'phone', 'sms') DEFAULT 'email',
  newsletter_subscribed BOOLEAN DEFAULT TRUE,
  tax_exemption_number VARCHAR(50),
  total_lifetime_donations DECIMAL(12, 2) DEFAULT 0,
  last_donation_date TIMESTAMP NULL,
  donor_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_name (name),
  INDEX idx_city (city),
  INDEX idx_donor_since (donor_since)
);

-- Create donation categories table (for better organization)
CREATE TABLE IF NOT EXISTS donation_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  target_amount DECIMAL(12, 2),
  current_amount DECIMAL(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_is_active (is_active),
  INDEX idx_display_order (display_order)
);

-- Insert default donation categories
INSERT INTO donation_categories (name, description, target_amount, display_order) VALUES
('Education', 'Support educational initiatives and student scholarships', 1000000.00, 1),
('Infrastructure', 'Campus development and infrastructure improvements', 2000000.00, 2),
('Research', 'Research projects and academic publications', 500000.00, 3),
('Student Activities', 'Student clubs, events, and extracurricular activities', 300000.00, 4),
('Alumni Network', 'Alumni events and networking initiatives', 200000.00, 5),
('Emergency Fund', 'Emergency support for students and staff', 100000.00, 6),
('General', 'General donations for institutional needs', 0.00, 7)
ON DUPLICATE KEY UPDATE 
  description = VALUES(description),
  target_amount = VALUES(target_amount),
  display_order = VALUES(display_order);

-- Create donation receipts table (for receipt management)
CREATE TABLE IF NOT EXISTS donation_receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donation_id INT NOT NULL,
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  receipt_url VARCHAR(500),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  email_sent_to VARCHAR(255),
  
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  INDEX idx_donation_id (donation_id),
  INDEX idx_receipt_number (receipt_number),
  INDEX idx_generated_at (generated_at)
);

-- Create a view for donation reporting
CREATE OR REPLACE VIEW donation_summary AS
SELECT 
  d.id,
  d.donor_name,
  d.donor_email,
  d.amount,
  d.currency,
  d.payment_method,
  d.transaction_status,
  d.donation_type,
  dc.name as category_name,
  dc.description as category_description,
  d.created_at,
  dr.receipt_number,
  dr.sent_at as receipt_sent_at
FROM donations d
LEFT JOIN donation_categories dc ON d.cause_category = dc.name
LEFT JOIN donation_receipts dr ON d.id = dr.donation_id;

-- Create triggers to automatically update analytics
DELIMITER //

CREATE TRIGGER update_analytics_after_donation_insert
AFTER INSERT ON donations
FOR EACH ROW
BEGIN
  IF NEW.transaction_status = 'completed' THEN
    INSERT INTO donation_analytics (date, total_amount, total_donations, unique_donors, avg_donation_amount)
    VALUES (DATE(NEW.created_at), NEW.amount, 1, 1, NEW.amount)
    ON DUPLICATE KEY UPDATE
      total_amount = total_amount + NEW.amount,
      total_donations = total_donations + 1,
      avg_donation_amount = total_amount / total_donations;
  END IF;
END//

CREATE TRIGGER update_analytics_after_donation_update
AFTER UPDATE ON donations
FOR EACH ROW
BEGIN
  -- If status changed from non-completed to completed
  IF OLD.transaction_status != 'completed' AND NEW.transaction_status = 'completed' THEN
    INSERT INTO donation_analytics (date, total_amount, total_donations, unique_donors, avg_donation_amount)
    VALUES (DATE(NEW.created_at), NEW.amount, 1, 1, NEW.amount)
    ON DUPLICATE KEY UPDATE
      total_amount = total_amount + NEW.amount,
      total_donations = total_donations + 1,
      avg_donation_amount = total_amount / total_donations;
  
  -- If status changed from completed to non-completed
  ELSEIF OLD.transaction_status = 'completed' AND NEW.transaction_status != 'completed' THEN
    UPDATE donation_analytics 
    SET 
      total_amount = total_amount - OLD.amount,
      total_donations = total_donations - 1,
      avg_donation_amount = CASE 
        WHEN total_donations - 1 > 0 THEN (total_amount - OLD.amount) / (total_donations - 1)
        ELSE 0 
      END
    WHERE date = DATE(OLD.created_at);
  END IF;
END//

DELIMITER ;

-- Sample data for testing (optional)
-- INSERT INTO donations (
--   donor_name, donor_email, donor_phone, amount, payment_method, 
--   payment_id, transaction_status, cause_category, message
-- ) VALUES 
-- ('John Doe', 'john.doe@email.com', '+91-9876543210', 5000.00, 'razorpay', 
--  'pay_test123', 'completed', 'Education', 'Happy to support education'),
-- ('Jane Smith', 'jane.smith@email.com', '+91-9876543211', 10000.00, 'razorpay', 
--  'pay_test124', 'completed', 'Infrastructure', 'For campus development'),
-- ('Anonymous Donor', 'anon@email.com', NULL, 2500.00, 'razorpay', 
--  'pay_test125', 'completed', 'Research', NULL);

-- Show tables and their structure
SHOW TABLES;
DESCRIBE donations;
DESCRIBE donation_analytics;
DESCRIBE donation_categories;

-- Display current data
SELECT 'Sample donation categories:' as Info;
SELECT * FROM donation_categories;

SELECT 'Database setup completed successfully!' as Status;
