const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: __dirname + '/.env' });

const { db, dbQuery } = require('./config/db');

// Import v2 routes
const jobRoutes = require('./routes/jobRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const donationRoutes = require('./routes/donationRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const academicRoutes = require('./routes/academicRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const resumeReviewRoutes = require('./routes/resumeReviewRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files statically
const uploadsRoot = path.join(__dirname, 'uploads');
const resumesDir = path.join(uploadsRoot, 'resumes');
const memoriesDir = path.join(uploadsRoot, 'memories');
const messagesDir = path.join(uploadsRoot, 'messages');
try {
  if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot);
  if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir);
  if (!fs.existsSync(memoriesDir)) fs.mkdirSync(memoriesDir);
  if (!fs.existsSync(messagesDir)) fs.mkdirSync(messagesDir);
} catch { }
app.use('/uploads', express.static(uploadsRoot));

const { uploadResume, uploadEventImage } = require('./services/cloudinaryService');
const { memoryImageUpload, eventImageUpload } = require('./middlewares/uploadMiddleware');

app.use('/api/v2/jobs', jobRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/v2/applications', jobRoutes);
app.use('/api/applications', jobRoutes);
app.use('/api/v2/events', eventRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/v2/users', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/v2/donations', donationRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/v2/memories', memoryRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/v2/roadmaps', roadmapRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/v2/mentorship', mentorshipRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/v2/mentors', mentorshipRoutes);
app.use('/api/mentors', mentorshipRoutes);
app.use('/api/v2/academic', academicRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/v2/connections', connectionRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/v2/messages', messageRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/v2/resume-reviews', resumeReviewRoutes);
app.use('/api/resume-reviews', resumeReviewRoutes);
app.use('/api/v2/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v2/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

// Resume upload endpoint
app.post('/api/upload/job-resume', memoryImageUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await uploadResume(req.file.buffer, req.file.originalname);
    const url = typeof result === 'string' ? result : (result?.secure_url || result?.url || '');
    return res.json({ url });
  } catch (err) {
    console.error('Resume upload error:', err);
    return res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// Event image upload endpoint
app.post(['/api/upload/event-image', '/api/uploads/event-image', '/api/v2/upload/event-image', '/api/v2/uploads/event-image', '/uploads/event-image'], eventImageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });
    let url = '';
    try {
      const result = await uploadEventImage(req.file.buffer, req.file.originalname);
      url = typeof result === 'string' ? result : (result?.secure_url || result?.url || '');
    } catch (cErr) {
      console.warn('Cloudinary event image fallback:', cErr.message);
    }
    if (!url) {
      const eventsDir = path.join(uploadsRoot, 'events');
      if (!fs.existsSync(eventsDir)) fs.mkdirSync(eventsDir, { recursive: true });
      const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      fs.writeFileSync(path.join(eventsDir, filename), req.file.buffer);
      url = `/uploads/events/${filename}`;
    }
    return res.json({ url });
  } catch (err) {
    console.error('Event image upload error:', err);
    return res.status(500).json({ error: 'Failed to upload event image' });
  }
});

// Memory image upload endpoint
app.post(['/api/upload/memory-image', '/api/uploads/memory-image', '/api/v2/upload/memory-image', '/api/v2/uploads/memory-image', '/uploads/memory-image'], memoryImageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });
    let url = '';
    try {
      const result = await uploadMemoryImage(req.file.buffer, req.file.originalname);
      url = typeof result === 'string' ? result : (result?.secure_url || result?.url || '');
    } catch (cErr) {
      console.warn('Cloudinary memory image fallback:', cErr.message);
    }
    if (!url) {
      const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      fs.writeFileSync(path.join(memoriesDir, filename), req.file.buffer);
      url = `/uploads/memories/${filename}`;
    }
    return res.json({ url });
  } catch (err) {
    console.error('Memory image upload error:', err);
    return res.status(500).json({ error: 'Failed to upload memory image' });
  }
});

// Health check endpoint
let lastDbStatus = 'unknown';
let lastDbError = null;
function checkDb(callback) {
  db.query('SELECT 1')
    .then(() => { lastDbStatus = 'connected'; lastDbError = null; callback && callback(true); })
    .catch((err) => { lastDbStatus = 'disconnected'; lastDbError = err.message; callback && callback(false); });
}

app.get('/api/health', (req, res) => {
  checkDb(() => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: lastDbStatus,
      lastDbError,
      auth0: {
        domain: process.env.AUTH0_DOMAIN ? 'configured' : 'not configured',
        audience: process.env.AUTH0_AUDIENCE ? 'configured' : 'not configured'
      }
    });
  });
});

// Initial DB check
checkDb((ok) => {
  if (ok) {
    console.log('Connected to Postgres database');
  } else {
    console.warn('Postgres not connected at startup. Will continue and serve limited features.');
    console.log('Please check your Postgres configuration in .env file');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});
