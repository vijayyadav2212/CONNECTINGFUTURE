const express = require('express');
const router = express.Router();
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  clearAllEvents,
  registerEvent
} = require('../controllers/eventController');
const { checkJwt } = require('../middlewares/authMiddleware');

router.get('/', getEvents);
router.post('/', checkJwt, createEvent);
router.patch('/:id', checkJwt, updateEvent);
router.delete('/clear-all/confirm', checkJwt, clearAllEvents);
router.delete('/:id', checkJwt, deleteEvent);
router.post('/:id/register', registerEvent);

module.exports = router;
