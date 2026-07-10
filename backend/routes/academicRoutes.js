const express = require('express');
const router = express.Router();
const {
  getSemesters,
  getCourses,
  createSemester,
  createCourse
} = require('../controllers/academicController');

router.get('/semesters', getSemesters);
router.get('/courses', getCourses);
router.post('/semesters', createSemester);
router.post('/courses', createCourse);

module.exports = router;
