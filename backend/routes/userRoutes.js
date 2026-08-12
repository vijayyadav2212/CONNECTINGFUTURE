const express = require('express');
const router = express.Router();
const { getUserProfile, getUserByEmail, updateUserProfile, listUsers, changePassword } = require('../controllers/userController');
const { checkJwt } = require('../middlewares/authMiddleware');

router.get('/profile', checkJwt, getUserProfile);
router.put('/profile', updateUserProfile);
router.get('/by-email', getUserByEmail);
router.post('/change-password', checkJwt, changePassword);
router.get('/', listUsers);

module.exports = router;
