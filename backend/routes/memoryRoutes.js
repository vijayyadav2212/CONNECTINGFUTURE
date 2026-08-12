const express = require('express');
const router = express.Router();
const {
  streamMemories,
  createMemory,
  listMemories,
  getMemoryById,
  getTagNotifications,
  markNotificationAsRead,
  incrementViewCount,
  likeMemory,
  incrementShareCount,
  getComments,
  addComment
} = require('../controllers/memoryController');

const { memoryImageUpload } = require('../middlewares/uploadMiddleware');
const { uploadMemoryImage } = require('../services/cloudinaryService');
const path = require('path');
const fs = require('fs');

router.get('/stream', streamMemories);
router.post(['/upload-image', '/uploads/memory-image'], memoryImageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });
    let url = '';
    try {
      const result = await uploadMemoryImage(req.file.buffer, req.file.originalname);
      url = typeof result === 'string' ? result : (result?.secure_url || result?.url || '');
    } catch (cErr) {
      console.warn('Cloudinary memory image upload fallback:', cErr.message);
    }
    if (!url) {
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'memories');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
      url = `/uploads/memories/${filename}`;
    }
    return res.json({ url });
  } catch (err) {
    console.error('Memory image upload error:', err);
    return res.status(500).json({ error: 'Failed to upload memory image' });
  }
});

router.post('/', createMemory);
router.get('/', listMemories);
router.get('/tag-notifications', getTagNotifications);
router.post('/tag-notifications/:id/read', markNotificationAsRead);
router.post('/:id/view', incrementViewCount);
router.post('/:id/like', likeMemory);
router.post('/:id/share', incrementShareCount);
router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);
router.get('/:id', getMemoryById);

module.exports = router;
