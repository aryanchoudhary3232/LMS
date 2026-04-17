const express = require("express");
const router = express.Router();
const courseController = require("../controller/courseController");
const discussionController = require("../controller/discussionController");
const statsController = require("../controller/statsController");
const {
	verify,
	validateParams,
	cacheResponse,
	cacheTags,
	invalidateTagsOnSuccess,
} = require("../middleware");

router.get(
	"/",
	cacheResponse({
		ttlSeconds: 300,
		namespace: "courses-public",
		tags: [cacheTags.coursesPublic],
	}),
	courseController.getAllCourses,
);

router.get(
	"/search",
	cacheResponse({
		ttlSeconds: 180,
		namespace: "courses-search",
		tags: [cacheTags.coursesPublic],
	}),
	courseController.searchCourses,
);

// Rate a course (student must be logged in and enrolled)
router.post(
	"/:courseId/rate",
	verify,
	invalidateTagsOnSuccess((req) => [
		cacheTags.coursesPublic,
		cacheTags.statsPublic,
		cacheTags.course(req.params.courseId),
		cacheTags.student(req.user?._id),
	]),
	courseController.rateCourse,
);

router.get(
	"/:courseId/topics/:topicId/discussions",
	verify,
	validateParams("courseId", "topicId"),
	cacheResponse({
		ttlSeconds: 60,
		namespace: "course-discussions",
		varyByUser: true,
		tags: (req) => [cacheTags.course(req.params.courseId)],
	}),
	discussionController.getTopicDiscussions,
);

router.post(
	"/:courseId/topics/:topicId/discussions",
	verify,
	validateParams("courseId", "topicId"),
	invalidateTagsOnSuccess((req) => [cacheTags.course(req.params.courseId)]),
	discussionController.createDiscussion,
);

router.post(
	"/:courseId/topics/:topicId/discussions/:discussionId/replies",
	verify,
	validateParams("courseId", "topicId", "discussionId"),
	invalidateTagsOnSuccess((req) => [cacheTags.course(req.params.courseId)]),
	discussionController.createDiscussionReply,
);

router.patch(
	"/:courseId/topics/:topicId/discussions/:discussionId/status",
	verify,
	validateParams("courseId", "topicId", "discussionId"),
	invalidateTagsOnSuccess((req) => [cacheTags.course(req.params.courseId)]),
	discussionController.updateDiscussionResolution,
);

router.get(
	"/stats/public",
	cacheResponse({
		ttlSeconds: 600,
		namespace: "courses-stats-public",
		tags: [cacheTags.statsPublic, cacheTags.coursesPublic],
	}),
	statsController.getPublicStats,
);

module.exports = router;
