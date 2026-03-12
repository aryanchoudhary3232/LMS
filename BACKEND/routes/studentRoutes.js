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
router.get("/profile", verify, verifyStudent, studentController.studentProfile);
router.get(
  "/dashboard",
  verify,
  verifyStudent,
  studentController.getStudentDashboard,
);
router.get(
  "/my-courses",
  verify,
  verifyStudent,
  studentController.getStudentMyCourses,
);

// Update enrolled courses — validate body schema
router.put(
  "/update-enrollCourses",
  verify,
  verifyStudent,
  validate(schemas.updateEnrollCourses),
  studentController.updateEnrollCourses,
);

// Quiz submission — validate body schema + enrollment
router.post(
  "/quiz_submit",
  verify,
  verifyStudent,
  validate(schemas.quizSubmit),
  validateEnrollment,
  studentController.quizSubmission,
);

router.get(
  "/courses",
  verify,
  verifyStudent,
  studentController.getCoursesByStudentId,
);

// Get student's quiz submissions (aggregated)
router.get(
  "/quiz-submissions",
  verify,
  verifyStudent,
  studentController.getQuizSubmissions,
);

// Streak / activity analytics
router.get("/streak", verify, verifyStudent, studentController.getStreakStats);

// Course-related routes for students (public browsing — with param sanitization)
router.get("/all-courses", studentController.getAllCourses);
router.get(
  "/courses/:courseId",
  paramSanitizer,
  studentController.getCourseById,
);

// Enrollment routes — param sanitized
router.post(
  "/courses/:courseId/enroll",
  verify,
  verifyStudent,
  paramSanitizer,
  studentController.enrollInCourse,
);
router.get(
  "/enrolled-courses",
  verify,
  verifyStudent,
  studentController.getEnrolledCourses,
);

// Student progress — validate body schema + ownership
router.post(
  "/progress",
  verify,
  verifyStudent,
  validate(schemas.studentProgress),
  validateResourceOwnership,
  studentController.studentProgress,
);
router.get(
  "/get-progress",
  verify,
  verifyStudent,
  studentController.getStudentProgress,
);

// Topic completion — validate body schema + enrollment
router.post(
  "/mark-topic-complete",
  verify,
  verifyStudent,
  validate(schemas.markTopicComplete),
  validateEnrollment,
  studentController.markTopicComplete,
);
router.get(
  "/topic-completion",
  verify,
  verifyStudent,
  studentController.getTopicCompletionStatus,
);

module.exports = router;
