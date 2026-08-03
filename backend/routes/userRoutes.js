const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, listUsers, changePassword } = require('../controllers/userController');
const { checkJwt } = require('../middlewares/authMiddleware');

router.get('/profile', checkJwt, getUserProfile);
router.put('/profile', checkJwt, updateUserProfile);
router.post('/change-password', checkJwt, changePassword);
router.get('/', checkJwt, listUsers);

module.exports = router;
