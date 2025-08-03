const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

dotenv.config();

// Test database connection before importing helpers
let dbHelpers;
try {
  const dbModule = require('./database');
  dbHelpers = dbModule.dbHelpers;
  console.log('Database helpers loaded successfully');
} catch (error) {
  console.error('Warning: Database connection failed:', error.message);
  console.log('Server will continue without database functionality...');
}

const app = express();
app.use(cors());
app.use(express.json());

// Auth0 JWT middleware
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
});

// Public routes (no authentication required)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Alumni Portal API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      public: ['/api/health'],
      protected: ['/api/protected', '/api/users', '/api/users/profile', '/api/data/:table']
    }
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = dbHelpers ? 'connected' : 'disconnected';
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    auth0: {
      domain: process.env.AUTH0_DOMAIN ? 'configured' : 'not configured',
      audience: process.env.AUTH0_AUDIENCE ? 'configured' : 'not configured'
    }
  });
});

// Protected route example
app.get('/api/protected', checkJwt, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.auth });
});

// Store user info after login (example endpoint)
app.post('/api/users', checkJwt, async (req, res) => {
  if (!dbHelpers) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    const { sub, email, name, picture } = req.body;
    if (!sub || !email) {
      return res.status(400).json({ error: 'Missing required user info (sub, email)' });
    }
    
    const userData = {
      auth0_id: sub,
      email,
      name: name || null,
      picture: picture || null
    };
    
    const user = await dbHelpers.user.createOrUpdate(userData);
    res.json({ 
      message: 'User stored/updated successfully', 
      user: user
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// Get user profile
app.get('/api/users/profile', checkJwt, async (req, res) => {
  if (!dbHelpers) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    const auth0Id = req.auth.sub;
    const user = await dbHelpers.user.findByAuth0Id(auth0Id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// Update user profile
app.put('/api/users/profile', checkJwt, async (req, res) => {
  if (!dbHelpers) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    const auth0Id = req.auth.sub;
    const { name, bio, graduation_year, major, current_job, company, linkedin_url, github_url, website_url, location } = req.body;
    
    const updateData = {
      name,
      bio,
      graduation_year,
      major,
      current_job,
      company,
      linkedin_url,
      github_url,
      website_url,
      location
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const result = await dbHelpers.update('users', updateData, { auth0_id: auth0Id });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// Generic endpoint for storing various user inputs
app.post('/api/data/:tableName', checkJwt, async (req, res) => {
  if (!dbHelpers) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    const { tableName } = req.params;
    const auth0Id = req.auth.sub;
    const data = req.body;
    
    // Validate table name (security measure)
    const allowedTables = ['posts', 'events', 'donations', 'messages', 'job_postings', 'career_timeline'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    
    // Add user_id and timestamps to data
    data.user_auth0_id = auth0Id;
    data.created_at = new Date();
    data.updated_at = new Date();
    
    const result = await dbHelpers.insert(tableName, data);
    res.json({ 
      message: `Data stored in ${tableName} successfully`, 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
      details: err.message 
    });
  }
  
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/protected',
      'POST /api/users',
      'GET /api/users/profile',
      'PUT /api/users/profile',
      'POST /api/data/:tableName'
    ]
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
}); 