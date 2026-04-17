const express = require("express");
const router = express.Router();
const {
  verify,
  verifySuperAdmin,
  cacheResponse,
  cacheTags,
  invalidateTagsOnSuccess,
} = require("../middleware");
const {
  getRevenueAnalytics,
  getCoursesByCategory,
  getDeletedCourses,
  restoreCourse,
  getAllUsers,
  getDeletedUsers,
  restoreUser,
  getPlatformOverview,
  getUserGrowthAnalytics,
  getTeacherPerformance,
  getCoursePerformance,
  getEnrollmentTrends
} = require("../controller/superadminController");

// ===== ROUTER-BASED MIDDLEWARE =====
// All superadmin routes require authentication + superadmin role
router.use(verify);
router.use(verifySuperAdmin);

// ============================================
// 📊 PLATFORM OVERVIEW
// ============================================

/**
 * @route   GET /superadmin/overview
 * @desc    Get comprehensive platform statistics
 * @access  SuperAdmin only
 */
router.get(
  "/overview",
  cacheResponse({
    ttlSeconds: 900,
    namespace: "superadmin-overview",
    tags: [cacheTags.superadminOverview],
  }),
  getPlatformOverview,
);

// ============================================
// 💰 REVENUE ANALYTICS
// ============================================

/**
 * @route   GET /superadmin/revenue
 * @desc    Get detailed revenue analytics
 * @access  SuperAdmin only
 */
router.get(
  "/revenue",
  cacheResponse({
    ttlSeconds: 900,
    namespace: "superadmin-revenue",
    tags: [cacheTags.superadminRevenue, cacheTags.superadminAnalytics],
  }),
  getRevenueAnalytics,
);

// ============================================
// 📚 COURSE MANAGEMENT
// ============================================

/**
 * @route   GET /superadmin/courses/by-category
 * @desc    Get courses grouped by category
 * @query   ?includeDeleted=true to include deleted courses
 * @access  SuperAdmin only
 */
router.get(
  "/courses/by-category",
  cacheResponse({
    ttlSeconds: 900,
    namespace: "superadmin-courses-by-category",
    tags: [cacheTags.superadminCourses, cacheTags.superadminAnalytics],
  }),
  getCoursesByCategory,
);

/**
 * @route   GET /superadmin/courses/deleted
 * @desc    Get all deleted courses
 * @access  SuperAdmin only
 */
router.get(
  "/courses/deleted",
  cacheResponse({
    ttlSeconds: 900,
    namespace: "superadmin-courses-deleted",
    tags: [cacheTags.superadminCourses],
  }),
  getDeletedCourses,
);

/**
 * @route   PUT /superadmin/courses/:courseId/restore
 * @desc    Restore a deleted course
 * @access  SuperAdmin only
 */
router.put(
  "/courses/:courseId/restore",
  invalidateTagsOnSuccess((req) => [
    cacheTags.superadminCourses,
    cacheTags.superadminOverview,
    cacheTags.superadminAnalytics,
    cacheTags.adminCourses,
    cacheTags.coursesPublic,
    cacheTags.course(req.params.courseId),
  ]),
  restoreCourse,
);

// ============================================
// 👥 USER MANAGEMENT
// ============================================

/**
 * @route   GET /superadmin/users
 * @desc    Get all users (students, teachers, admins)
 * @query   ?includeDeleted=true to include deleted users
 * @access  SuperAdmin only
 */
router.get(
  "/users",
  cacheResponse({
    ttlSeconds: 900,
    namespace: "superadmin-users",
    tags: [cacheTags.superadminUsers],
  }),
  getAllUsers,
);

/**
 * @route   GET /superadmin/users/deleted
 * @desc    Get all deleted users
 * @access  SuperAdmin only
 */
router.get(
  "/users/deleted",
  cacheResponse({
    ttlSeconds: 900,
    namespace: "superadmin-users-deleted",
    tags: [cacheTags.superadminUsers],
  }),
  getDeletedUsers,
);

/**
 * @route   PUT /superadmin/users/:userId/restore
 * @desc    Restore a deleted user
 * @body    { userType: 'Student' | 'Teacher' | 'Admin' }
 * @access  SuperAdmin only
 */
router.put(
  "/users/:userId/restore",
  invalidateTagsOnSuccess([
    cacheTags.superadminUsers,
    cacheTags.superadminOverview,
    cacheTags.superadminAnalytics,
    cacheTags.adminUsers,
    cacheTags.adminDeletedUsers,
    cacheTags.adminDashboard,
  ]),
  restoreUser,
);

// ============================================
// 📈 ADVANCED ANALYTICS
// ============================================

/**
 * @route   GET /superadmin/analytics/user-growth
 * @desc    Get user registration trends
 * @query   ?period=30 (days)
 * @access  SuperAdmin only
 */
router.get(
  "/analytics/user-growth",
  cacheResponse({
    ttlSeconds: 1200,
    namespace: "superadmin-analytics-user-growth",
    tags: [cacheTags.superadminAnalytics],
  }),
  getUserGrowthAnalytics,
);

/**
 * @route   GET /superadmin/analytics/teacher-performance
 * @desc    Get teacher performance metrics
 * @access  SuperAdmin only
 */
router.get(
  "/analytics/teacher-performance",
  cacheResponse({
    ttlSeconds: 1200,
    namespace: "superadmin-analytics-teacher-performance",
    tags: [cacheTags.superadminAnalytics],
  }),
  getTeacherPerformance,
);

/**
 * @route   GET /superadmin/analytics/course-performance
 * @desc    Get course performance metrics
 * @access  SuperAdmin only
 */
router.get(
  "/analytics/course-performance",
  cacheResponse({
    ttlSeconds: 1200,
    namespace: "superadmin-analytics-course-performance",
    tags: [cacheTags.superadminAnalytics],
  }),
  getCoursePerformance,
);

/**
 * @route   GET /superadmin/analytics/enrollment-trends
 * @desc    Get enrollment trends over time
 * @query   ?period=30 (days)
 * @access  SuperAdmin only
 */
router.get(
  "/analytics/enrollment-trends",
  cacheResponse({
    ttlSeconds: 1200,
    namespace: "superadmin-analytics-enrollment-trends",
    tags: [cacheTags.superadminAnalytics],
  }),
  getEnrollmentTrends,
);

module.exports = router;
