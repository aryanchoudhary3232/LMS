const express = require("express");
const router = express.Router();
const {
  verify,
  verifyAdmin,
  adminAuditLogger,
  paramSanitizer,
  validate,
  schemas,
  cacheResponse,
  cacheTags,
  invalidateTagsOnSuccess,
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
router.get(
  "/dashboard",
  cacheResponse({
    ttlSeconds: 600,
    namespace: "admin-dashboard",
    tags: [cacheTags.adminDashboard],
  }),
  getDashboardData,
);

//  Get All Users (Students + Teachers)
router.get(
  "/users",
  cacheResponse({
    ttlSeconds: 600,
    namespace: "admin-users",
    tags: [cacheTags.adminUsers],
  }),
  getAllUsers,
);

//  Get Deleted Members (Students + Teachers)
router.get(
  "/deleted-members",
  cacheResponse({
    ttlSeconds: 600,
    namespace: "admin-deleted-members",
    tags: [cacheTags.adminDeletedUsers],
  }),
  getDeletedMembers,
);

//  Get Teacher Details by ID
router.get(
  "/teachers/:teacherId",
  cacheResponse({
    ttlSeconds: 300,
    namespace: "admin-teacher-detail",
    tags: [cacheTags.adminUsers],
  }),
  getTeacherById,
);

//  Approve Teacher Verification (validate optional notes)
router.put(
  "/teachers/:teacherId/approve",
  validate(schemas.approveRejectTeacher),
  invalidateTagsOnSuccess([
    cacheTags.adminUsers,
    cacheTags.adminDashboard,
    cacheTags.superadminUsers,
    cacheTags.superadminOverview,
    cacheTags.superadminAnalytics,
  ]),
  approveTeacher,
);

//  Reject Teacher Verification (validate optional notes)
router.put(
  "/teachers/:teacherId/reject",
  validate(schemas.approveRejectTeacher),
  invalidateTagsOnSuccess([
    cacheTags.adminUsers,
    cacheTags.adminDashboard,
    cacheTags.superadminUsers,
    cacheTags.superadminOverview,
    cacheTags.superadminAnalytics,
  ]),
  rejectTeacher,
);

//  Delete Teacher
router.delete(
  "/teachers/:teacherId",
  invalidateTagsOnSuccess([
    cacheTags.adminUsers,
    cacheTags.adminDeletedUsers,
    cacheTags.adminDashboard,
    cacheTags.adminCourses,
    cacheTags.coursesPublic,
    cacheTags.statsPublic,
    cacheTags.superadminUsers,
    cacheTags.superadminCourses,
    cacheTags.superadminOverview,
    cacheTags.superadminAnalytics,
  ]),
  deleteTeacher,
);

//  Delete Student
router.delete(
  "/students/:studentId",
  invalidateTagsOnSuccess([
    cacheTags.adminUsers,
    cacheTags.adminDeletedUsers,
    cacheTags.adminDashboard,
    cacheTags.superadminUsers,
    cacheTags.superadminOverview,
    cacheTags.superadminAnalytics,
  ]),
  deleteStudent,
);

//  Get All Courses
router.get(
  "/courses",
  cacheResponse({
    ttlSeconds: 600,
    namespace: "admin-courses",
    tags: [cacheTags.adminCourses],
  }),
  getAllCourses,
);

//  Get Course by ID for Admin
router.get(
  "/courses/:courseId",
  cacheResponse({
    ttlSeconds: 300,
    namespace: "admin-course-detail",
    tags: (req) => [
      cacheTags.adminCourses,
      cacheTags.course(req.params.courseId),
    ],
  }),
  getCourseById,
);

//  Delete a Course
router.delete(
  "/courses/:id",
  invalidateTagsOnSuccess((req) => [
    cacheTags.adminCourses,
    cacheTags.adminDashboard,
    cacheTags.coursesPublic,
    cacheTags.statsPublic,
    cacheTags.course(req.params.id),
    cacheTags.superadminCourses,
    cacheTags.superadminOverview,
    cacheTags.superadminAnalytics,
  ]),
  deleteCourse,
);

module.exports = router;
