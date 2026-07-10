const express = require('express');
const router = express.Router();
const { handleExternalJobsRequest } = require('../controllers/jobController');

// Define job routes
// We will mount this router at /api/jobs
// So /api/jobs/external maps to /external

router.get('/external', handleExternalJobsRequest);

// As we extract more job endpoints from server.js, we will add them here:
// router.get('/', getAllJobs);
// router.post('/', createJob);
// router.get('/:id', getJobById);

module.exports = router;
