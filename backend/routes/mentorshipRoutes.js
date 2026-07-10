const express = require('express');
const router = express.Router();
const {
  getMentors,
  getMentorProfile,
  upsertMentorProfile,
  createMentorshipRequest,
  respondMentorshipRequest,
  getMentorshipRequests,
  getAdminMentorshipPayments
} = require('../controllers/mentorshipController');
const { checkJwt } = require('../middlewares/authMiddleware');

// Mentors profiles
router.get('/mentors', getMentors);
router.get('/mentors/profile', getMentorProfile);
router.post('/mentors/profile', upsertMentorProfile);

// Requests
router.post('/request', createMentorshipRequest);
router.post('/respond', respondMentorshipRequest);
router.get('/requests', getMentorshipRequests);

// Admin Payments (requires checkJwt)
router.get('/admin/payments', checkJwt, getAdminMentorshipPayments);

module.exports = router;
