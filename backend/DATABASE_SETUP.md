# MySQL Database Setup Guide

This guide will help you set up the MySQL database for the Alumni Portal backend.

## Prerequisites

1. **MySQL Server** installed and running
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use MySQL Workbench: https://dev.mysql.com/downloads/workbench/

2. **Node.js** (v14 or higher)
3. **npm** or **yarn** package manager

## Step 1: Configure Environment Variables

The backend uses environment variables for database configuration. Update the `.env` file in the backend directory:

```bash
# backend/.env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=alumni_portal
DB_PORT=3306
```

### Default Credentials
- **Host**: localhost
- **User**: root
- **Password**: (leave empty for local development)
- **Database**: alumni_portal

## Step 2: Install Dependencies

```bash
cd backend
npm install
```

## Step 3: Initialize Database

### Option A: Automatic Setup (Recommended)
```bash
npm run init-db
```

This will:
- Create the database if it doesn't exist
- Create all required tables
- Set up proper indexes and relationships

### Option B: Manual Setup
1. **Create Database**:
```sql
CREATE DATABASE alumni_portal;
```

2. **Run Schema**:
```bash
mysql -u your_username -p alumni_portal < database_schema.sql
```

## Step 4: Verify Connection

Test the database connection:

```bash
node -e "const db = require('./database.js'); console.log('Database connected successfully!')"
```

## Database Schema Overview

### Core Tables
- **users**: Alumni and student profiles
- **posts**: Blog posts and articles
- **events**: Alumni events and meetups
- **job_postings**: Job opportunities
- **donations**: Donation records
- **messages**: Internal messaging system
- **mentorship**: Mentorship relationships
- **career_timeline**: Career history tracking

### Relationships
- Users can create posts, events, and job postings
- Users can attend events (event_attendees)
- Users can donate (donations)
- Users can message each other (messages)
- Users can mentor/be mentored (mentorship)

## Troubleshooting

### Common Issues

1. **"Access denied for user"**
   - Check MySQL username/password in .env
   - Ensure MySQL is running: `mysql.server start` (macOS) or `net start mysql` (Windows)

2. **"Unknown database"**
   - Run `npm run init-db` to create the database

3. **"Connection refused"**
   - Check MySQL is running on port 3306
   - Verify DB_HOST is set to 'localhost' or correct IP

4. **"mysql command not found"**
   - Add MySQL to PATH or use full path to mysql binary

### MySQL Configuration

If using MySQL 8.0+, you might need to update authentication:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

## Development Commands

```bash
# Start development server
npm run dev

# Initialize database
npm run init-db

# Start production server
npm start
```

## Testing Connection

Create a simple test file:

```javascript
// test-connection.js
const { db } = require('./database.js');

db.query('SELECT 1 + 1 AS solution', (error, results) => {
  if (error) throw error;
  console.log('Database connected! Result:', results[0].solution);
  process.exit();
});
```

Run with:
```bash
node test-connection.js
```

## Production Considerations

1. **Use environment-specific .env files**
2. **Set strong MySQL passwords**
3. **Use connection pooling**
4. **Enable SSL for remote connections**
5. **Regular database backups**

## Support

If you encounter issues:
1. Check MySQL error logs
2. Verify .env configuration
3. Ensure MySQL service is running
4. Check firewall settings for remote connections
