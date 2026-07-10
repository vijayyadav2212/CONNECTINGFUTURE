const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, listUsers } = require('../controllers/userController');
const { checkJwt } = require('../middlewares/authMiddleware');

router.get('/profile', checkJwt, getUserProfile);
router.put('/profile', checkJwt, updateUserProfile);
router.get('/', checkJwt, listUsers);

module.exports = router;
