const express = require('express');
const router = express.Router();
const { 
  handleExternalJobsRequest,
  getAllJobs,
  createJob,
  updateJob,
  deleteJob,
  applyToJob,
  getApplications,
  getApplicationsByJob,
  getExternalJobAnalytics
} = require('../controllers/jobController');

router.get('/external/analytics/summary', getExternalJobAnalytics);
router.get('/external', handleExternalJobsRequest);
router.get('/applications/by-job', getApplicationsByJob);
router.get('/applications', getApplications);
router.get('/', getAllJobs);
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);
router.post('/:id/apply', applyToJob);

module.exports = router;
