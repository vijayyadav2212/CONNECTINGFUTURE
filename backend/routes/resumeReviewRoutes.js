const express = require('express');
const router = express.Router();
const {
  getMentorsForReview,
  requestResumeReview,
  getStudentReviews,
  getAlumniReviews,
  acceptReviewRequest,
  rejectReviewRequest,
  submitReviewFeedback,
  getResumeReviewsDebug
} = require('../controllers/resumeReviewController');

router.get('/mentors', getMentorsForReview);
router.post('/request', requestResumeReview);
router.get('/student/:email', getStudentReviews);
router.get('/alumni/:email', getAlumniReviews);
router.post('/:id/accept', acceptReviewRequest);
router.post('/:id/reject', rejectReviewRequest);
router.post('/:id/submit-feedback', submitReviewFeedback);
router.get('/debug', getResumeReviewsDebug);

module.exports = router;
