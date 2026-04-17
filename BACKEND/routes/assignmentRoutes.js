const express = require("express");
const router = express.Router();
const {
  verify,
  upload,
  validateFiles,
  fileConfigs,
  cacheResponse,
  cacheTags,
  invalidateTagsOnSuccess,
} = require("../middleware");

const {
  createAssignment,
  getTeacherAssignments,
  getAssignmentSubmissions,
  gradeSubmission,
  updateAssignment,
  deleteAssignment,
  getStudentAssignments,
  submitAssignment,
  getStudentSubmission,
} = require("../controller/assignmentController");

// ===== ROUTER-BASED MIDDLEWARE =====
// All assignment routes require authentication
router.use(verify);

// ============= TEACHER ROUTES =============
router.post(
  "/teacher/create",
  upload.array("attachments", 5),
  validateFiles(fileConfigs.teacherCreateAssignment),
  invalidateTagsOnSuccess((req) => [cacheTags.teacher(req.user?._id)]),
  createAssignment
);
router.get(
  "/teacher/list",
  cacheResponse({
    ttlSeconds: 180,
    namespace: "assignment-teacher-list",
    varyByUser: true,
    tags: (req) => [cacheTags.teacher(req.user?._id)],
  }),
  getTeacherAssignments,
);
router.get(
  "/teacher/:assignmentId/submissions",
  cacheResponse({
    ttlSeconds: 120,
    namespace: "assignment-teacher-submissions",
    varyByUser: true,
    tags: (req) => [cacheTags.teacher(req.user?._id)],
  }),
  getAssignmentSubmissions,
);
router.post(
  "/teacher/grade/:submissionId",
  invalidateTagsOnSuccess((req) => [cacheTags.teacher(req.user?._id)]),
  gradeSubmission,
);
router.put(
  "/teacher/update/:assignmentId",
  invalidateTagsOnSuccess((req) => [cacheTags.teacher(req.user?._id)]),
  updateAssignment,
);
router.delete(
  "/teacher/delete/:assignmentId",
  invalidateTagsOnSuccess((req) => [cacheTags.teacher(req.user?._id)]),
  deleteAssignment,
);

// ============= STUDENT ROUTES =============
router.get(
  "/student/list",
  cacheResponse({
    ttlSeconds: 180,
    namespace: "assignment-student-list",
    varyByUser: true,
    tags: (req) => [cacheTags.student(req.user?._id)],
  }),
  getStudentAssignments,
);
router.post(
  "/student/submit/:assignmentId",
  upload.array("attachments", 3),
  validateFiles(fileConfigs.studentSubmitAssignment),
  invalidateTagsOnSuccess((req) => [cacheTags.student(req.user?._id)]),
  submitAssignment
);
router.get(
  "/student/submission/:assignmentId",
  cacheResponse({
    ttlSeconds: 120,
    namespace: "assignment-student-submission",
    varyByUser: true,
    tags: (req) => [cacheTags.student(req.user?._id)],
  }),
  getStudentSubmission,
);

module.exports = router;
