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

router.get('/stream', streamMemories);
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
