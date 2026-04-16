const express = require("express");
const router = express.Router();
const studentController = require("../controller/studentController");
const {
  verify,
  validateEnrollment,
  validateResourceOwnership,
  verifyStudent,
  paramSanitizer,
  validate,
  schemas,
  cacheResponse,
  cacheTags,
  invalidateTagsOnSuccess,
} = require("../middleware");

// Test route
router.get("/test", (req, res) => {
  res.json({
    message: "Student routes working!",
    timestamp: new Date().toISOString(),
  });
});

// Student profile (uses validateResourceOwnership to ensure students access their own data)
router.get("/", studentController.getStudents);
router.get(
  "/profile",
  verify,
  verifyStudent,
  cacheResponse({
    ttlSeconds: 120,
    namespace: "student-profile",
    varyByUser: true,
    tags: (req) => [cacheTags.student(req.user?._id)],
  }),
  studentController.studentProfile,
);

router.get(
  "/dashboard",
  verify,
  verifyStudent,
  cacheResponse({
    ttlSeconds: 90,
    namespace: "student-dashboard",
    varyByUser: true,
    tags: (req) => [cacheTags.student(req.user?._id)],
  }),
  studentController.getStudentDashboard,
);

router.get(
  "/my-courses",
  verify,
  verifyStudent,
  cacheResponse({
    ttlSeconds: 180,
    namespace: "student-my-courses",
    varyByUser: true,
    tags: (req) => [cacheTags.student(req.user?._id)],
  }),
  studentController.getStudentMyCourses,
);

// Update enrolled courses — validate body schema
router.put(
  "/update-enrollCourses",
  verify,
  verifyStudent,
  validate(schemas.updateEnrollCourses),
  invalidateTagsOnSuccess((req) => [
    cacheTags.student(req.user?._id),
    cacheTags.coursesPublic,
    cacheTags.statsPublic,
    cacheTags.adminCourses,
    cacheTags.superadminAnalytics,
  ]),
  studentController.updateEnrollCourses,
);

// Quiz submission — validate body schema + enrollment
router.post(
  "/quiz_submit",
  verify,
  verifyStudent,
  validate(schemas.quizSubmit),
  validateEnrollment,
  invalidateTagsOnSuccess((req) => [cacheTags.student(req.user?._id)]),
  studentController.quizSubmission,
);

router.get(
  "/courses",
  verify,
  verifyStudent,
  cacheResponse({
    ttlSeconds: 180,
    namespace: "student-courses",
    varyByUser: true,
    tags: (req) => [cacheTags.student(req.user?._id)],
  }),
  studentController.getCoursesByStudentId,
);

// Get student's quiz submissions (aggregated)
router.get(
  "/quiz-submissions",
  verify,
  verifyStudent,
  cacheResponse({
    ttlSeconds: 120,
    namespace: "student-quiz-submissions",
    varyByUser: true,
    tags: (req) => [cacheTags.student(req.user?._id)],
  }),
  studentController.getQuizSubmissions,
);

// Streak / activity analytics
router.get(
  "/streak",
  verify,
  verifyStudent,
  cacheResponse({
    ttlSeconds: 60,
    namespace: "student-streak",
    varyByUser: true,
    tags: (req) => [cacheTags.student(req.user?._id)],
  }),
  studentController.getStreakStats,
);

// Course-related routes for students (public browsing — with param sanitization)
router.get(
  "/all-courses",
  cacheResponse({
    ttlSeconds: 300,
    namespace: "student-all-courses",
    tags: [cacheTags.coursesPublic],
  }),
  studentController.getAllCourses,
);

router.get(
  "/courses/:courseId",
  paramSanitizer,
  cacheResponse({
    ttlSeconds: 180,
    namespace: "student-course-detail",
    tags: (req) => [
      cacheTags.coursesPublic,
      cacheTags.course(req.params.courseId),
    ],
  }),
  studentController.getCourseById,
);

// Enrollment routes — param sanitized
router.post(
  "/courses/:courseId/enroll",
  verify,
  verifyStudent,
  paramSanitizer,
  invalidateTagsOnSuccess((req) => [
    cacheTags.student(req.user?._id),
    cacheTags.coursesPublic,
    cacheTags.course(req.params.courseId),
    cacheTags.statsPublic,
    cacheTags.superadminAnalytics,
  ]),
  studentController.enrollInCourse,
);

router.get(
  "/enrolled-courses",
  verify,
  verifyStudent,
  cacheResponse({
    ttlSeconds: 180,
    namespace: "student-enrolled-courses",
    varyByUser: true,
    tags: (req) => [cacheTags.student(req.user?._id)],
  }),
  studentController.getEnrolledCourses,
);

// Student progress — validate body schema + ownership
router.post(
  "/progress",
  verify,
  verifyStudent,
  validate(schemas.studentProgress),
  validateResourceOwnership,
  invalidateTagsOnSuccess((req) => [cacheTags.student(req.user?._id)]),
  studentController.studentProgress,
);

router.get(
  "/get-progress",
  verify,
  verifyStudent,
  cacheResponse({
    ttlSeconds: 120,
    namespace: "student-progress",
    varyByUser: true,
    tags: (req) => [cacheTags.student(req.user?._id)],
  }),
  studentController.getStudentProgress,
);

// Topic completion — validate body schema + enrollment
router.post(
  "/mark-topic-complete",
  verify,
  verifyStudent,
  validate(schemas.markTopicComplete),
  validateEnrollment,
  invalidateTagsOnSuccess((req) => [cacheTags.student(req.user?._id)]),
  studentController.markTopicComplete,
);

router.get(
  "/topic-completion",
  verify,
  verifyStudent,
  cacheResponse({
    ttlSeconds: 90,
    namespace: "student-topic-completion",
    varyByUser: true,
    tags: (req) => [cacheTags.student(req.user?._id)],
  }),
  studentController.getTopicCompletionStatus,
);

module.exports = router;
