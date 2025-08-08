# PowerShell script to set up the donations table in MySQL
# This will create the donations table with all required columns

$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

# Check if MySQL is in common paths
if (Test-Path $mysqlPath) {
    Write-Host "Found MySQL at: $mysqlPath"
} else {
    # Try to find MySQL in PATH
    $mysqlCommand = Get-Command mysql -ErrorAction SilentlyContinue
    if ($mysqlCommand) {
        $mysqlPath = "mysql"
        Write-Host "Found MySQL in PATH"
    } else {
        Write-Host "MySQL not found. Please install MySQL or add it to PATH"
        Write-Host "Download from: https://dev.mysql.com/downloads/mysql/"
        exit 1
    }
}

# SQL commands to create the donations table
$sqlCommands = @"
USE mockapp_db;

DROP TABLE IF EXISTS donations;

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

INSERT INTO donations (
  donor_name, donor_email, amount, payment_method, transaction_status, 
  cause_category, message, payment_id
) VALUES 
  ('John Doe', 'john@example.com', 1000.00, 'razorpay', 'completed', 'Education', 'Happy to support education!', 'pay_test_001'),
  ('Jane Smith', 'jane@example.com', 500.00, 'razorpay', 'completed', 'Healthcare', 'For a good cause', 'pay_test_002'),
  ('Anonymous Donor', 'donor@example.com', 2000.00, 'razorpay', 'completed', 'General', NULL, 'pay_test_003');

SELECT 'Donations table created successfully!' as Status;
SELECT COUNT(*) as 'Total Donations' FROM donations;
"@

# Save SQL to temp file
$tempSqlFile = [System.IO.Path]::GetTempFileName() + ".sql"
$sqlCommands | Out-File -FilePath $tempSqlFile -Encoding UTF8

Write-Host "Setting up donations table..."
Write-Host "Temp SQL file: $tempSqlFile"

try {
    # Execute the SQL script
    if ($mysqlPath -eq "mysql") {
        & mysql -u root -p"Vijay@123" -e "source $tempSqlFile"
    } else {
        & "$mysqlPath" -u root -p"Vijay@123" -e "source $tempSqlFile"
    }
    
    Write-Host "Database setup completed successfully!"
    Write-Host "You can now test the donations API"
} catch {
    Write-Host "Error setting up database: $_"
    Write-Host "Please run the SQL commands manually in MySQL"
} finally {
    # Clean up temp file
    if (Test-Path $tempSqlFile) {
        Remove-Item $tempSqlFile
    }
}
