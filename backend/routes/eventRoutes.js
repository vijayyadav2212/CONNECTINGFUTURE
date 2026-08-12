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
const { checkJwtFlexible } = require('../middlewares/authMiddleware');

const optionalJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return checkJwtFlexible(req, res, next);
};

router.get('/', getEvents);
router.post('/', optionalJwt, createEvent);
router.patch('/:id', optionalJwt, updateEvent);
router.delete('/clear-all/confirm', optionalJwt, clearAllEvents);
router.delete('/:id', optionalJwt, deleteEvent);
router.post('/:id/register', registerEvent);

module.exports = router;
