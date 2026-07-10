const express = require('express');
const router = express.Router();
const {
  createMessage,
  getMessages,
  getMessageThreads,
  createConnectedMessage,
  editMessage,
  deleteMessage
} = require('../controllers/messageController');

router.post('/', createMessage);
router.get('/', getMessages);
router.get('/threads', getMessageThreads);
router.post('/connected', createConnectedMessage);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);

module.exports = router;
