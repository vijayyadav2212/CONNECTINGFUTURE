# Database Setup and Usage Guide

## Quick Setup Steps

### 1. Install MySQL
Download and install MySQL from https://dev.mysql.com/downloads/mysql/

### 2. Create Database
1. Open MySQL Command Line or MySQL Workbench
2. Run the SQL commands in `database_schema.sql`:
```bash
mysql -u root -p < database_schema.sql
```

### 3. Configure Environment Variables
1. Copy `.env.example` to `.env`
2. Update the values with your actual configuration:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=alumni_portal
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-api-audience
PORT=4000
```

### 4. Install Dependencies and Start Server
```bash
cd backend
npm install
node server.js
```

## Available API Endpoints

### User Management
- `POST /api/users` - Create/update user after login
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile

### Generic Data Storage
- `POST /api/data/:table` - Store data in any allowed table
  - Allowed tables: posts, events, donations, messages, job_postings, career_timeline

### Example Usage from Frontend

#### 1. Store User Profile Data
```javascript
const updateProfile = async (profileData) => {
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'John Doe',
      bio: 'Software Engineer with 5 years experience',
      graduation_year: 2018,
      major: 'Computer Science',
      current_job: 'Senior Developer',
      company: 'Tech Corp',
      linkedin_url: 'https://linkedin.com/in/johndoe'
    })
  });
  return response.json();
};
```

#### 2. Create a Blog Post
```javascript
const createPost = async (postData) => {
  const response = await fetch('/api/data/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'My Career Journey',
      content: 'This is my story...',
      category: 'career',
      tags: JSON.stringify(['career', 'advice', 'journey'])
    })
  });
  return response.json();
};
```

#### 3. Create an Event
```javascript
const createEvent = async (eventData) => {
  const response = await fetch('/api/data/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Alumni Networking Event',
      description: 'Join us for networking...',
      event_date: '2025-09-15 18:00:00',
      location: 'University Campus',
      event_type: 'networking',
      max_attendees: 50,
      is_virtual: false
    })
  });
  return response.json();
};
```

#### 4. Post a Job
```javascript
const postJob = async (jobData) => {
  const response = await fetch('/api/data/job_postings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Frontend Developer',
      company: 'My Company',
      description: 'We are looking for...',
      requirements: 'React, TypeScript, 3+ years experience',
      location: 'Remote',
      job_type: 'full-time',
      salary_range: '$80,000 - $120,000',
      application_url: 'https://company.com/apply'
    })
  });
  return response.json();
};
```

## Database Helper Functions Usage

You can use the database helpers directly in your code:

```javascript
const { dbHelpers } = require('./database');

// Find a user
const user = await dbHelpers.user.findByAuth0Id('auth0|123456');

// Get all posts by category
const posts = await dbHelpers.findMany('posts', { category: 'career' }, 'created_at DESC', 10);

// Insert a new record
const result = await dbHelpers.insert('events', {
  user_auth0_id: 'auth0|123456',
  title: 'New Event',
  event_date: new Date('2025-12-01'),
  created_at: new Date()
});

// Update a record
await dbHelpers.update('posts', 
  { title: 'Updated Title' }, 
  { id: 1 }
);
```

## Security Features

1. **JWT Authentication**: All endpoints (except public ones) require valid JWT tokens
2. **Table Validation**: Only allowed tables can be accessed via generic endpoints
3. **User Isolation**: Each user can only access their own data (enforced by user_auth0_id)
4. **SQL Injection Prevention**: All queries use parameterized statements

## Next Steps

1. Add validation middleware for input data
2. Implement rate limiting
3. Add logging and monitoring
4. Create more specific endpoints for complex operations
5. Add file upload support for profile pictures and attachments
