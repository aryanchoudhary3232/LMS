const express = require("express");
const router = express.Router();
const { verify, upload, validateFiles, fileConfigs } = require("../middleware");

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
  createAssignment
);
router.get("/teacher/list", getTeacherAssignments);
router.get("/teacher/:assignmentId/submissions", getAssignmentSubmissions);
router.post("/teacher/grade/:submissionId", gradeSubmission);
router.put("/teacher/update/:assignmentId", updateAssignment);
router.delete("/teacher/delete/:assignmentId", deleteAssignment);

// ============= STUDENT ROUTES =============
router.get("/student/list", getStudentAssignments);
router.post(
  "/student/submit/:assignmentId",
  upload.array("attachments", 3),
  validateFiles(fileConfigs.studentSubmitAssignment),
  submitAssignment
);
router.get("/student/submission/:assignmentId", getStudentSubmission);

module.exports = router;
