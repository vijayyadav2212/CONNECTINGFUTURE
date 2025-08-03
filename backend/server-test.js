const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Test routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Alumni Portal API - Test Version',
    status: 'running',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'test',
    auth0: {
      domain: process.env.AUTH0_DOMAIN ? 'configured' : 'not configured',
      audience: process.env.AUTH0_AUDIENCE ? 'configured' : 'not configured'
    }
  });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});
