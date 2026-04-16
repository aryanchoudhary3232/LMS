const express = require("express");
const router = express.Router();
const teacherController = require("../controller/teacherController");
const {
  verify,
  verifyTeacher,
  upload,
  paramSanitizer,
  validate,
  schemas,
  validateFiles,
  fileConfigs,
  cacheResponse,
  cacheTags,
  invalidateTagsOnSuccess,
} = require("../middleware");

// ── Create course (with input + file validation) ──
router.post(
  "/courses/create_course",
  verify,
  verifyTeacher,
  upload.any(),
  validate(schemas.createCourse),
  validateFiles(fileConfigs.createCourse),
  invalidateTagsOnSuccess((req) => [
    cacheTags.coursesPublic,
    cacheTags.statsPublic,
    cacheTags.teachersPublic,
    cacheTags.teacher(req.user?._id),
    cacheTags.adminCourses,
    cacheTags.superadminCourses,
    cacheTags.superadminAnalytics,
  ]),
  teacherController.createCourse,
);

// ── Update course (with param + input + file validation) ──
router.put(
  "/courses/:courseId",
  verify,
  verifyTeacher,
  paramSanitizer,
  upload.any(),
  validate(schemas.updateCourse),
  validateFiles(fileConfigs.updateCourse),
  invalidateTagsOnSuccess((req) => [
    cacheTags.coursesPublic,
    cacheTags.statsPublic,
    cacheTags.teacher(req.user?._id),
    cacheTags.course(req.params.courseId),
    cacheTags.adminCourses,
    cacheTags.superadminCourses,
    cacheTags.superadminAnalytics,
  ]),
  teacherController.updateCourse,
);

// ── Teacher's own courses ──
router.get(
  "/courses",
  verify,
  verifyTeacher,
  cacheResponse({
    ttlSeconds: 180,
    namespace: "teacher-courses",
    varyByUser: true,
    tags: (req) => [cacheTags.teacher(req.user?._id)],
  }),
  teacherController.getTeacherCourses,
);

// ── Teacher qualification verification ──
router.post(
  "/verification/upload",
  verify,
  verifyTeacher,
  upload.single("qualification"),
  validate(schemas.teacherVerification),
  validateFiles(fileConfigs.qualificationUpload),
  invalidateTagsOnSuccess((req) => [
    cacheTags.teacher(req.user?._id),
    cacheTags.adminUsers,
    cacheTags.adminDashboard,
    cacheTags.superadminUsers,
    cacheTags.superadminOverview,
  ]),
  teacherController.uploadQualification,
);

router.get(
  "/verification/status",
  verify,
  verifyTeacher,
  cacheResponse({
    ttlSeconds: 90,
    namespace: "teacher-verification-status",
    varyByUser: true,
    tags: (req) => [cacheTags.teacher(req.user?._id)],
  }),
  teacherController.getQualificationStatus,
);

// ── Public routes (with param sanitization) ──
router.get(
  "/courses/get_courses",
  cacheResponse({
    ttlSeconds: 300,
    namespace: "teacher-public-courses",
    tags: [cacheTags.coursesPublic],
  }),
  teacherController.getCourses,
);

router.get(
  "/courses/get_course_by_id/:courseId",
  paramSanitizer,
  cacheResponse({
    ttlSeconds: 180,
    namespace: "teacher-public-course-detail",
    tags: (req) => [
      cacheTags.coursesPublic,
      cacheTags.course(req.params.courseId),
    ],
  }),
  teacherController.getcourseById,
);

//teacher
router.get(
  "/",
  cacheResponse({
    ttlSeconds: 600,
    namespace: "teachers-list",
    tags: [cacheTags.teachersPublic],
  }),
  teacherController.getTeachers,
);

// ── Dashboard routes (with verifyTeacher) ──
router.get(
  "/metrics",
  verify,
  verifyTeacher,
  cacheResponse({
    ttlSeconds: 120,
    namespace: "teacher-metrics",
    varyByUser: true,
    tags: (req) => [cacheTags.teacher(req.user?._id)],
  }),
  teacherController.getTeacherMetrics,
);
router.get(
  "/students",
  verify,
  verifyTeacher,
  cacheResponse({
    ttlSeconds: 120,
    namespace: "teacher-students",
    varyByUser: true,
    tags: (req) => [cacheTags.teacher(req.user?._id)],
  }),
  teacherController.getEnrolledStudents,
);
router.get(
  "/dashboard",
  verify,
  verifyTeacher,
  cacheResponse({
    ttlSeconds: 120,
    namespace: "teacher-dashboard",
    varyByUser: true,
    tags: (req) => [cacheTags.teacher(req.user?._id)],
  }),
  teacherController.getTeacherDashboard,
);

module.exports = router;
