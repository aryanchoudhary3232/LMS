const express = require("express");
const router = express.Router();
const { verify, verifySuperAdmin } = require("../middleware");
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
router.get("/overview", getPlatformOverview);

// ============================================
// 💰 REVENUE ANALYTICS
// ============================================

/**
 * @route   GET /superadmin/revenue
 * @desc    Get detailed revenue analytics
 * @access  SuperAdmin only
 */
router.get("/revenue", getRevenueAnalytics);

// ============================================
// 📚 COURSE MANAGEMENT
// ============================================

/**
 * @route   GET /superadmin/courses/by-category
 * @desc    Get courses grouped by category
 * @query   ?includeDeleted=true to include deleted courses
 * @access  SuperAdmin only
 */
router.get("/courses/by-category", getCoursesByCategory);

/**
 * @route   GET /superadmin/courses/deleted
 * @desc    Get all deleted courses
 * @access  SuperAdmin only
 */
router.get("/courses/deleted", getDeletedCourses);

/**
 * @route   PUT /superadmin/courses/:courseId/restore
 * @desc    Restore a deleted course
 * @access  SuperAdmin only
 */
router.put("/courses/:courseId/restore", restoreCourse);

// ============================================
// 👥 USER MANAGEMENT
// ============================================

/**
 * @route   GET /superadmin/users
 * @desc    Get all users (students, teachers, admins)
 * @query   ?includeDeleted=true to include deleted users
 * @access  SuperAdmin only
 */
router.get("/users", getAllUsers);

/**
 * @route   GET /superadmin/users/deleted
 * @desc    Get all deleted users
 * @access  SuperAdmin only
 */
router.get("/users/deleted", getDeletedUsers);

/**
 * @route   PUT /superadmin/users/:userId/restore
 * @desc    Restore a deleted user
 * @body    { userType: 'Student' | 'Teacher' | 'Admin' }
 * @access  SuperAdmin only
 */
router.put("/users/:userId/restore", restoreUser);

// ============================================
// 📈 ADVANCED ANALYTICS
// ============================================

/**
 * @route   GET /superadmin/analytics/user-growth
 * @desc    Get user registration trends
 * @query   ?period=30 (days)
 * @access  SuperAdmin only
 */
router.get("/analytics/user-growth", getUserGrowthAnalytics);

/**
 * @route   GET /superadmin/analytics/teacher-performance
 * @desc    Get teacher performance metrics
 * @access  SuperAdmin only
 */
router.get("/analytics/teacher-performance", getTeacherPerformance);

/**
 * @route   GET /superadmin/analytics/course-performance
 * @desc    Get course performance metrics
 * @access  SuperAdmin only
 */
router.get("/analytics/course-performance", getCoursePerformance);

/**
 * @route   GET /superadmin/analytics/enrollment-trends
 * @desc    Get enrollment trends over time
 * @query   ?period=30 (days)
 * @access  SuperAdmin only
 */
router.get("/analytics/enrollment-trends", getEnrollmentTrends);

module.exports = router;
