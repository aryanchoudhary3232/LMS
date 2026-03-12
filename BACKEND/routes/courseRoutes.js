const express = require("express");
const router = express.Router();
const courseController = require('../controller/courseController')
const { verify } = require('../middleware')
const statsController = require('../controller/statsController');

router.get('/', courseController.getAllCourses)
router.get('/search', courseController.searchCourses);
// Rate a course (student must be logged in and enrolled)
router.post('/:courseId/rate', verify, courseController.rateCourse);
router.get('/stats/public', statsController.getPublicStats);
module.exports = router;
