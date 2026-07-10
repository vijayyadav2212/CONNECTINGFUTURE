const express = require('express');
const router = express.Router();
const {
  getRoadmaps,
  createRoadmap,
  getRoadmapById,
  updateRoadmap,
  deleteRoadmap,
  generateRoadmap,
  saveGeneratedRoadmap,
  publishRoadmap,
  getRoadmapProgress,
  completeMilestone,
  generateMilestoneQuiz,
  submitMilestoneQuiz,
  followRoadmap,
  getFollowStatus
} = require('../controllers/roadmapController');
const { checkJwt, checkJwtFlexible, injectIdentity } = require('../middlewares/authMiddleware');

// CRUD
router.get('/', getRoadmaps);
router.post('/', createRoadmap);
router.get('/:id', getRoadmapById);
router.put('/:id', updateRoadmap);
router.delete('/:id', deleteRoadmap);

// Admin AI Roadmap generator
router.post('/admin/generate', checkJwt, generateRoadmap);
router.post('/admin/save', checkJwt, saveGeneratedRoadmap);
router.put('/admin/:id/publish', checkJwt, publishRoadmap);

// Student Progress & Follows (uses checkJwtFlexible + injectIdentity)
router.get('/:id/progress', checkJwtFlexible, injectIdentity, getRoadmapProgress);
router.post('/:id/milestones/:milestoneOrder/complete', checkJwtFlexible, injectIdentity, completeMilestone);
router.post('/:id/milestones/:milestoneOrder/quiz/generate', checkJwtFlexible, injectIdentity, generateMilestoneQuiz);
router.post('/:id/milestones/:milestoneOrder/quiz/submit', checkJwtFlexible, injectIdentity, submitMilestoneQuiz);
router.post('/:id/follow', checkJwtFlexible, injectIdentity, followRoadmap);
router.get('/:id/follow-status', checkJwtFlexible, injectIdentity, getFollowStatus);

module.exports = router;
