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
} = require("../middleware");

// ── Create course (with input + file validation) ──
router.post(
  "/courses/create_course",
  verify,
  verifyTeacher,
  upload.any(),
  validate(schemas.createCourse),
  validateFiles(fileConfigs.createCourse),
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
  teacherController.updateCourse,
);

// ── Teacher's own courses ──
router.get(
  "/courses",
  verify,
  verifyTeacher,
  teacherController.getTeacherCourses,
);

// ── Teacher qualification verification ──
router.post(
  "/verification/upload",
  verify,
  verifyTeacher,
  upload.single("qualification"),
  validateFiles(fileConfigs.qualificationUpload),
  teacherController.uploadQualification,
);

router.get(
  "/verification/status",
  verify,
  verifyTeacher,
  teacherController.getQualificationStatus,
);

// ── Public routes (with param sanitization) ──
router.get("/courses/get_courses", teacherController.getCourses);
router.get(
  "/courses/get_course_by_id/:courseId",
  paramSanitizer,
  teacherController.getcourseById,
);

//teacher
router.get("/", teacherController.getTeachers);

// ── Dashboard routes (with verifyTeacher) ──
router.get(
  "/metrics",
  verify,
  verifyTeacher,
  teacherController.getTeacherMetrics,
);
router.get(
  "/students",
  verify,
  verifyTeacher,
  teacherController.getEnrolledStudents,
);
router.get(
  "/dashboard",
  verify,
  verifyTeacher,
  teacherController.getTeacherDashboard,
);

module.exports = router;
