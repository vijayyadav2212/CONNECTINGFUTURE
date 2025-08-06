# Donation Management Backend API

A comprehensive MySQL-based backend system for managing donations, donor information, and analytics for the ConnectingFuture platform.

## 🚀 Features

### Core Functionality
- **Complete donation lifecycle management** (create, read, update, delete)
- **Real-time donation tracking** with status updates
- **Comprehensive donor history** and profile management
- **Advanced analytics and reporting** with trends and insights
- **Receipt generation and management**
- **Payment integration** with Razorpay support

### Database Features
- **Optimized MySQL schema** with proper indexing
- **Automated analytics updates** via database triggers
- **Data integrity** with foreign key constraints
- **Flexible donation categories** system
- **Audit trail** with created/updated timestamps

## 📁 API Endpoints

### Main Donations API (`/api/donations`)

#### GET - List Donations
```bash
GET /api/donations?page=1&limit=10&status=completed&donor_email=user@email.com&date_from=2024-01-01&date_to=2024-12-31
```

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Records per page (default: 10)
- `status` (string): Filter by transaction status
- `donor_email` (string): Filter by donor email
- `date_from` (string): Start date filter (YYYY-MM-DD)
- `date_to` (string): End date filter (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 50,
    "recordsPerPage": 10
  },
  "summary": {
    "total_donations": 150,
    "total_amount": 500000.00,
    "unique_donors": 75,
    "avg_amount": 3333.33
  }
}
```

#### POST - Create Donation
```bash
POST /api/donations
Content-Type: application/json

{
  "donor_name": "John Doe",
  "donor_email": "john@email.com",
  "donor_phone": "+91-9876543210",
  "amount": 5000.00,
  "currency": "INR",
  "payment_method": "razorpay",
  "payment_id": "pay_123456",
  "razorpay_order_id": "order_123",
  "transaction_status": "completed",
  "donation_type": "one-time",
  "cause_category": "Education",
  "anonymous": false,
  "message": "Happy to support!"
}
```

#### PUT - Update Donation Status
```bash
PUT /api/donations
Content-Type: application/json

{
  "id": 1,
  "transaction_status": "completed",
  "razorpay_payment_id": "pay_789",
  "razorpay_signature": "signature_hash"
}
```

### Individual Donation API (`/api/donations/[id]`)

#### GET - Get Donation Details
```bash
GET /api/donations/123
```

#### PUT - Update Specific Donation
```bash
PUT /api/donations/123
Content-Type: application/json

{
  "transaction_status": "completed",
  "receipt_sent": true,
  "cause_category": "Research"
}
```

#### DELETE - Delete Donation
```bash
DELETE /api/donations/123
```
*Note: Only pending or failed donations can be deleted*

### Analytics API (`/api/donations/analytics`)

#### GET - Donation Analytics
```bash
GET /api/donations/analytics?period=30&group_by=day
```

**Query Parameters:**
- `period` (int): Number of days to analyze (default: 30)
- `group_by` (string): Grouping period - day/week/month (default: day)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_donations": 150,
      "total_amount": 500000.00,
      "unique_donors": 75,
      "avg_donation": 3333.33,
      "successful_donations": 140,
      "failed_donations": 5,
      "pending_donations": 5
    },
    "trends": [...],
    "topDonors": [...],
    "categories": [...],
    "paymentMethods": [...],
    "largeDonations": [...]
  }
}
```

### Donor History API (`/api/donations/donor`)

#### GET - Donor-Specific History
```bash
GET /api/donations/donor?email=user@email.com&page=1&limit=10&status=completed
```

## 🗄️ Database Schema

### Main Tables

#### donations
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- donor_name (VARCHAR(255), NOT NULL)
- donor_email (VARCHAR(255), NOT NULL)
- donor_phone (VARCHAR(20))
- amount (DECIMAL(10,2), NOT NULL)
- currency (VARCHAR(3), DEFAULT 'INR')
- payment_method (VARCHAR(50), NOT NULL)
- payment_id (VARCHAR(255), UNIQUE)
- razorpay_order_id (VARCHAR(255))
- razorpay_payment_id (VARCHAR(255))
- razorpay_signature (VARCHAR(255))
- transaction_status (ENUM: pending/completed/failed/refunded)
- donation_type (ENUM: one-time/monthly/yearly)
- cause_category (VARCHAR(100))
- anonymous (BOOLEAN, DEFAULT FALSE)
- message (TEXT)
- receipt_sent (BOOLEAN, DEFAULT FALSE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### donation_analytics
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- date (DATE, NOT NULL, UNIQUE)
- total_amount (DECIMAL(12,2))
- total_donations (INT)
- unique_donors (INT)
- avg_donation_amount (DECIMAL(10,2))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### donation_categories
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR(100), UNIQUE, NOT NULL)
- description (TEXT)
- target_amount (DECIMAL(12,2))
- current_amount (DECIMAL(12,2))
- is_active (BOOLEAN)
- display_order (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## ⚙️ Setup Instructions

### 1. Database Setup
```bash
# Login to MySQL
mysql -u root -p

# Run the setup script
source database/setup.sql
```

### 2. Environment Configuration
Copy `.env.local.example` to `.env.local` and configure:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=connectingfuture
DB_PORT=3306

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Install Dependencies
```bash
npm install mysql2
```

### 4. Test the API
```bash
# Start the development server
npm run dev

# Test the endpoints
curl http://localhost:3000/api/donations
```

## 🔧 Advanced Features

### Automated Analytics
- Database triggers automatically update analytics when donations are created/updated
- Real-time statistics calculation
- Monthly, weekly, and daily trend analysis

### Data Validation
- Email format validation
- Amount validation (positive numbers only)
- Required field validation
- Duplicate payment ID prevention

### Error Handling
- Comprehensive error messages
- HTTP status codes
- Database connection error handling
- Transaction rollback on failures

### Performance Optimization
- Strategic database indexing
- Pagination for large datasets
- Efficient query optimization
- Connection pooling ready

## 📊 Usage Examples

### Create a New Donation
```javascript
const response = await fetch('/api/donations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    donor_name: 'Alice Johnson',
    donor_email: 'alice@email.com',
    amount: 10000.00,
    payment_method: 'razorpay',
    payment_id: 'pay_unique123',
    transaction_status: 'completed',
    cause_category: 'Infrastructure'
  })
});

const result = await response.json();
```

### Get Donor History
```javascript
const response = await fetch('/api/donations/donor?email=alice@email.com');
const donorData = await response.json();

console.log('Total donated:', donorData.data.donorProfile.total_donated);
console.log('Donations:', donorData.data.donations);
```

### Get Analytics Dashboard Data
```javascript
const response = await fetch('/api/donations/analytics?period=90&group_by=week');
const analytics = await response.json();

console.log('Overview:', analytics.data.overview);
console.log('Trends:', analytics.data.trends);
```

## 🛡️ Security Features

- **SQL Injection Prevention**: Parameterized queries
- **Input Validation**: Comprehensive data validation
- **Error Sanitization**: Safe error messages without sensitive data
- **Connection Security**: Secure database connections

## 🚀 Deployment Notes

### Production Considerations
1. **Database**: Use connection pooling for production
2. **Environment**: Set proper environment variables
3. **Monitoring**: Implement logging and monitoring
4. **Backup**: Regular database backups
5. **SSL**: Enable SSL for database connections

### Scaling Options
- Read replicas for analytics queries
- Database partitioning for large datasets
- Caching layer for frequently accessed data
- API rate limiting

## 📝 API Response Formats

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message",
  "code": "ERROR_CODE" // (optional)
}
```

This backend system provides a robust foundation for donation management with comprehensive features for tracking, analytics, and reporting.
