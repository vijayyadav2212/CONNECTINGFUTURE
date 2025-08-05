# Backend Setup Guide

## Prerequisites
1. **MySQL Server** - Install MySQL Server on your system
2. **Node.js** - Make sure Node.js is installed

## Step-by-Step Setup

### 1. Configure MySQL
```bash
# Option A: If MySQL is not installed, download and install from:
# https://dev.mysql.com/downloads/mysql/

# Option B: Install via package manager (if not already installed)
# Windows: Download from MySQL website
# Linux: sudo apt-get install mysql-server
# macOS: brew install mysql
```

### 2. Start MySQL Service
```bash
# Windows (if installed as service)
net start mysql

# Linux/macOS
sudo systemctl start mysql
# OR
sudo service mysql start
```

### 3. Set MySQL Root Password (if not set)
```bash
# Connect to MySQL
mysql -u root

# Set password for root user
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_password_here';
FLUSH PRIVILEGES;
exit;
```

### 4. Create Database and Tables
```bash
# Connect to MySQL with password
mysql -u root -p

# Run the setup script
source C:/Users/Vijay/CONNECTINGFUTURE/backend/database/simple_setup.sql

# OR copy and paste the SQL commands from simple_setup.sql
```

### 5. Configure Environment Variables
Update the `.env` file in the backend folder:
```env
# Update this line with your actual MySQL password
DB_PASSWORD=your_mysql_password_here

# Other settings (update as needed)
DB_HOST=localhost
DB_USER=root
DB_NAME=connectingfuture
DB_PORT=3306
```

### 6. Install Backend Dependencies
```bash
cd C:/Users/Vijay/CONNECTINGFUTURE/backend
npm install
```

### 7. Start the Backend Server
```bash
npm start
```

## Testing the Setup

### Check if server is running:
Open browser and go to: `http://localhost:4000`

### Test API endpoints:
- `GET http://localhost:4000/api/donations` - Get all donations
- `GET http://localhost:4000/api/donations/analytics/summary` - Get donation analytics

### Sample API calls using curl:
```bash
# Get all donations
curl http://localhost:4000/api/donations

# Get analytics
curl http://localhost:4000/api/donations/analytics/summary

# Create a new donation
curl -X POST http://localhost:4000/api/donations \
  -H "Content-Type: application/json" \
  -d '{
    "donor_name": "Test User",
    "donor_email": "test@example.com", 
    "amount": 100,
    "payment_method": "razorpay",
    "transaction_status": "completed"
  }'
```

## Troubleshooting

### MySQL Connection Issues:
1. **"Access denied for user 'root'@'localhost'"**
   - Make sure you've set the correct password in `.env`
   - Try resetting MySQL root password

2. **"Can't connect to MySQL server"**
   - Make sure MySQL service is running
   - Check if MySQL is listening on port 3306

3. **Database doesn't exist**
   - Run the `simple_setup.sql` script to create the database

### Server Issues:
1. **Port 4000 already in use**
   - Change PORT in `.env` file or kill the process using port 4000

2. **Missing dependencies**
   - Run `npm install` in the backend directory

## API Documentation

### Donation Endpoints:
- `GET /api/donations` - List all donations (with pagination)
- `POST /api/donations` - Create new donation
- `GET /api/donations/:id` - Get specific donation
- `PUT /api/donations/:id` - Update donation
- `DELETE /api/donations/:id` - Delete donation
- `GET /api/donations/analytics/summary` - Get donation analytics

### Query Parameters for GET /api/donations:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by transaction status
- `donor_email` - Filter by donor email

Example: `GET /api/donations?page=1&limit=5&status=completed`
