const express = require("express");
const router = express.Router();
const courseController = require('../controller/courseController')
const discussionController = require("../controller/discussionController");
const { verify, validateParams } = require('../middleware')
const statsController = require('../controller/statsController');

router.get('/', courseController.getAllCourses)
router.get('/search', courseController.searchCourses);
// Rate a course (student must be logged in and enrolled)
router.post('/:courseId/rate', verify, courseController.rateCourse);
router.get(
	"/:courseId/topics/:topicId/discussions",
	verify,
	validateParams("courseId", "topicId"),
	discussionController.getTopicDiscussions,
);
router.post(
	"/:courseId/topics/:topicId/discussions",
	verify,
	validateParams("courseId", "topicId"),
	discussionController.createDiscussion,
);
router.post(
	"/:courseId/topics/:topicId/discussions/:discussionId/replies",
	verify,
	validateParams("courseId", "topicId", "discussionId"),
	discussionController.createDiscussionReply,
);
router.patch(
	"/:courseId/topics/:topicId/discussions/:discussionId/status",
	verify,
	validateParams("courseId", "topicId", "discussionId"),
	discussionController.updateDiscussionResolution,
);
router.get('/stats/public', statsController.getPublicStats);
module.exports = router;
