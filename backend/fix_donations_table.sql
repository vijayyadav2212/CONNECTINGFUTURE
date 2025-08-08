-- SQL Script to fix donations table in mockapp_db
-- Copy and paste this into your MySQL command line or MySQL Workbench

USE mockapp_db;

-- Drop existing donations table if it exists (to recreate with correct structure)
DROP TABLE IF EXISTS donations;

-- Create donations table with correct structure
CREATE TABLE donations (
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

-- Insert sample data for testing
INSERT INTO donations (
  donor_name, donor_email, amount, payment_method, transaction_status, 
  cause_category, message, payment_id
) VALUES 
  ('John Doe', 'john@example.com', 1000.00, 'razorpay', 'completed', 'Education', 'Happy to support education!', 'pay_test_001'),
  ('Jane Smith', 'jane@example.com', 500.00, 'razorpay', 'completed', 'Healthcare', 'For a good cause', 'pay_test_002'),
  ('Anonymous Donor', 'donor@example.com', 2000.00, 'razorpay', 'completed', 'General', NULL, 'pay_test_003'),
  ('Test Alumni', 'alumni@connectingfuture.com', 750.00, 'razorpay', 'completed', 'Scholarship', 'Supporting future students', 'pay_test_004'),
  ('Corporate Sponsor', 'sponsor@company.com', 5000.00, 'bank_transfer', 'completed', 'Infrastructure', 'For campus development', 'pay_test_005');

-- Verify the table was created correctly
DESCRIBE donations;

-- Show sample data
SELECT 'Sample donations created:' as Info;
SELECT id, donor_name, donor_email, amount, transaction_status, cause_category, created_at 
FROM donations 
ORDER BY created_at DESC;

-- Show analytics
SELECT 
    COUNT(*) as total_donations,
    SUM(amount) as total_amount,
    AVG(amount) as average_donation,
    COUNT(DISTINCT donor_email) as unique_donors
FROM donations 
WHERE transaction_status = 'completed';
