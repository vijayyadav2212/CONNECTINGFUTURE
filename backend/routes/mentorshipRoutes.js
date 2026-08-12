const express = require('express');
const router = express.Router();
const {
  getMentors,
  getMentorProfile,
  upsertMentorProfile,
  createMentorshipRequest,
  respondMentorshipRequest,
  getMentorshipRequests,
  getAdminMentorshipPayments,
  getDailySessions,
  createDailySession,
  deactivateDailySession,
  getMentorshipSessions,
  scheduleMentorshipSession,
  purchaseMentorshipSession,
  getMentorshipSubscriptions,
  purchaseMentorshipSubscription,
  createMentorshipRating,
} = require('../controllers/mentorshipController');
const { checkJwt } = require('../middlewares/authMiddleware');

// Mentors profiles
router.get('/', getMentors);
router.get('/mentors', getMentors);
router.get('/profile', getMentorProfile);
router.post('/profile', upsertMentorProfile);
router.get('/mentors/profile', getMentorProfile);
router.post('/mentors/profile', upsertMentorProfile);

// Requests
router.post('/request', createMentorshipRequest);
router.post('/respond', respondMentorshipRequest);
router.get('/requests', getMentorshipRequests);

// Daily Sessions
router.get('/daily-sessions', getDailySessions);
router.post('/daily-sessions', createDailySession);
router.delete('/daily-sessions/:id', deactivateDailySession);

// Sessions & Booking
router.get('/sessions', getMentorshipSessions);
router.post('/sessions/schedule', scheduleMentorshipSession);
router.post('/sessions/purchase', purchaseMentorshipSession);

// Subscriptions
router.get('/subscriptions', getMentorshipSubscriptions);
router.post('/subscriptions/purchase', purchaseMentorshipSubscription);

// Ratings
router.post('/ratings', createMentorshipRating);

// Admin Payments (requires checkJwt)
router.get('/admin/payments', checkJwt, getAdminMentorshipPayments);

module.exports = router;
