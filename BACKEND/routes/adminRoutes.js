const express = require("express");
const router = express.Router();
const {
  verify,
  verifyAdmin,
  adminAuditLogger,
  paramSanitizer,
  validate,
  schemas,
} = require("../middleware");
const {
  getDashboardData,
  getAllUsers,
  getAllCourses,
  deleteCourse,
  getCourseById,
  getTeacherById,
  deleteTeacher,
  deleteStudent,
  approveTeacher,
  rejectTeacher,
  getDeletedMembers,
} = require("../controller/adminController");

// ===== ROUTER-BASED MIDDLEWARE =====
// All admin routes require authentication + admin role
router.use(verify);
router.use(verifyAdmin);

// Sanitize all :id params across admin routes
router.use(paramSanitizer);

// Log every admin action for audit trail
router.use(adminAuditLogger);

//  Admin Dashboard Data
router.get("/dashboard", getDashboardData);

//  Get All Users (Students + Teachers)
router.get("/users", getAllUsers);

//  Get Deleted Members (Students + Teachers)
router.get("/deleted-members", getDeletedMembers);

//  Get Teacher Details by ID
router.get("/teachers/:teacherId", getTeacherById);

//  Approve Teacher Verification (validate optional notes)
router.put(
  "/teachers/:teacherId/approve",
  validate(schemas.approveRejectTeacher),
  approveTeacher,
);

//  Reject Teacher Verification (validate optional notes)
router.put(
  "/teachers/:teacherId/reject",
  validate(schemas.approveRejectTeacher),
  rejectTeacher,
);

//  Delete Teacher
router.delete("/teachers/:teacherId", deleteTeacher);

//  Delete Student
router.delete("/students/:studentId", deleteStudent);

//  Get All Courses
router.get("/courses", getAllCourses);

//  Get Course by ID for Admin
router.get("/courses/:courseId", getCourseById);

//  Delete a Course
router.delete("/courses/:id", deleteCourse);

module.exports = router;
