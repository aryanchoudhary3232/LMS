const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Admin = require("../models/Admin");
const Course = require("../models/Course");
const Order = require("../models/Order");

// ============================================
// 💰 REVENUE ANALYTICS
// ============================================

/**
 * Get Platform Revenue Statistics
 * Returns total revenue, revenue by status, recent orders
 */
const getRevenueAnalytics = async (req, res) => {
  try {
    // Total revenue from completed orders (100%)
    const totalRevenue = await Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalAmount = totalRevenue[0]?.total || 0;
    const platformRevenue = totalAmount * 0.30; // 30% for platform
    const teacherRevenue = totalAmount * 0.70; // 70% for teachers

    // Revenue by course category (platform's 30%)
    const revenueByCategory = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course"
        }
      },
      { $unwind: "$course" },
      {
        $group: {
          _id: "$course.category",
          totalRevenue: { $sum: "$amount" },
          platformRevenue: { $sum: { $multiply: ["$amount", 0.30] } },
          teacherRevenue: { $sum: { $multiply: ["$amount", 0.70] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Revenue over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueOverTime = await Order.aggregate([
      { $match: { status: "completed", createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    // Top selling courses
    const topSellingCourses = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$courseId",
          totalRevenue: { $sum: "$amount" },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course"
        }
      },
      { $unwind: "$course" }
    ]);

    res.status(200).json({
      success: true,
      message: "Revenue analytics fetched successfully",
      data: {
        totalRevenue: totalAmount,
        platformRevenue,
        teacherRevenue,
        revenueByCategory,
        revenueOverTime,
        ordersByStatus,
        topSellingCourses
      }
    });
  } catch (error) {
    console.error("Revenue Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching revenue analytics",
      error: error.message
    });
  }
};

// ============================================
// 📚 COURSE ANALYTICS
// ============================================

/**
 * Get Courses by Category
 * Returns all courses grouped by category
 */
const getCoursesByCategory = async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    
    const filter = includeDeleted === 'true' ? {} : { isDeleted: { $ne: true } };
    
    const coursesByCategory = await Course.aggregate([
      { $match: filter },
      // Lookup teacher info BEFORE grouping
      {
        $lookup: {
          from: "teachers",
          localField: "teacher",
          foreignField: "_id",
          as: "teacherInfo"
        }
      },
      {
        $unwind: {
          path: "$teacherInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      // Now group with populated teacher data
      {
        $group: {
          _id: "$category",
          courses: {
            $push: {
              id: "$_id",
              title: "$title",
              price: "$price",
              level: "$level",
              teacher: {
                _id: "$teacherInfo._id",
                name: "$teacherInfo.name",
                email: "$teacherInfo.email"
              },
              studentCount: { $size: "$students" },
              isDeleted: "$isDeleted",
              deletedAt: "$deletedAt"
            }
          },
          totalCourses: { $sum: 1 },
          totalStudents: { $sum: { $size: "$students" } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: "Courses by category fetched successfully",
      data: coursesByCategory
    });
  } catch (error) {
    console.error("Courses by Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching courses by category",
      error: error.message
    });
  }
};

/**
 * Get Deleted Courses
 * Returns all soft-deleted courses
 */
const getDeletedCourses = async (req, res) => {
  try {
    const deletedCourses = await Course.find({ isDeleted: true })
      .populate("teacher", "name email")
      .sort({ deletedAt: -1 });

    res.status(200).json({
      success: true,
      message: "Deleted courses fetched successfully",
      data: {
        count: deletedCourses.length,
        courses: deletedCourses
      }
    });
  } catch (error) {
    console.error("Deleted Courses Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching deleted courses",
      error: error.message
    });
  }
};

/**
 * Restore Deleted Course
 */
const restoreCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByIdAndUpdate(
      courseId,
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Course restored successfully",
      data: course
    });
  } catch (error) {
    console.error("Restore Course Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while restoring course",
      error: error.message
    });
  }
};

// ============================================
// 👥 USER MANAGEMENT
// ============================================

/**
 * Get All Users in Platform
 * Returns students, teachers, and admins
 */
const getAllUsers = async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    
    const filter = includeDeleted === 'true' ? {} : { isDeleted: { $ne: true } };

    const students = await Student.find(filter).select("-password");
    const teachers = await Teacher.find(filter).select("-password");
    const admins = await Admin.find(filter).select("-password");

    const stats = {
      totalUsers: students.length + teachers.length + admins.length,
      students: students.length,
      teachers: teachers.length,
      admins: admins.length,
      deletedStudents: await Student.countDocuments({ isDeleted: true }),
      deletedTeachers: await Teacher.countDocuments({ isDeleted: true }),
      deletedAdmins: await Admin.countDocuments({ isDeleted: true })
    };

    res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      data: {
        stats,
        students,
        teachers,
        admins
      }
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message
    });
  }
};

/**
 * Get Deleted Users
 * Returns all soft-deleted users (students, teachers, admins)
 */
const getDeletedUsers = async (req, res) => {
  try {
    const deletedStudents = await Student.find({ isDeleted: true })
      .select("-password")
      .sort({ deletedAt: -1 });
    
    const deletedTeachers = await Teacher.find({ isDeleted: true })
      .select("-password")
      .sort({ deletedAt: -1 });
    
    const deletedAdmins = await Admin.find({ isDeleted: true })
      .select("-password")
      .sort({ deletedAt: -1 });

    res.status(200).json({
      success: true,
      message: "Deleted users fetched successfully",
      data: {
        students: deletedStudents,
        teachers: deletedTeachers,
        admins: deletedAdmins,
        totalDeleted: deletedStudents.length + deletedTeachers.length + deletedAdmins.length
      }
    });
  } catch (error) {
    console.error("Deleted Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching deleted users",
      error: error.message
    });
  }
};

/**
 * Restore Deleted User
 */
const restoreUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType } = req.body; // 'Student', 'Teacher', or 'Admin'

    let user;
    let Model;

    switch (userType) {
      case "Student":
        Model = Student;
        break;
      case "Teacher":
        Model = Teacher;
        break;
      case "Admin":
        Model = Admin;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid user type. Must be Student, Teacher, or Admin"
        });
    }

    // Find the user first to check if they exist
    const existingUser = await Model.findById(userId);
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `${userType} not found`
      });
    }

    // Update the user to restore
    user = await Model.findByIdAndUpdate(
      userId,
      { isDeleted: false, deletedAt: null },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: `${userType} restored successfully`,
      data: user
    });
  } catch (error) {
    console.error("Restore User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while restoring user",
      error: error.message
    });
  }
};

// ============================================
// 📊 PLATFORM STATISTICS
// ============================================

/**
 * Get Platform Overview Dashboard
 * Returns comprehensive platform statistics
 */
const getPlatformOverview = async (req, res) => {
  try {
    // User counts
    const totalStudents = await Student.countDocuments({ isDeleted: { $ne: true } });
    const totalTeachers = await Teacher.countDocuments({ isDeleted: { $ne: true } });
    const totalAdmins = await Admin.countDocuments({ isDeleted: { $ne: true } });
    const deletedUsers = await Student.countDocuments({ isDeleted: true }) +
                         await Teacher.countDocuments({ isDeleted: true }) +
                         await Admin.countDocuments({ isDeleted: true });

    // Course counts
    const totalCourses = await Course.countDocuments({ isDeleted: { $ne: true } });
    const deletedCourses = await Course.countDocuments({ isDeleted: true });

    // Revenue stats
    const totalRevenue = await Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalAmount = totalRevenue[0]?.total || 0;
    const platformRevenue = totalAmount * 0.30; // 30% for platform
    const teacherRevenue = totalAmount * 0.70; // 70% for teachers

    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: "completed" });
    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const failedOrders = await Order.countDocuments({ status: "failed" });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentStudents = await Student.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo },
      isDeleted: { $ne: true }
    });

    const recentCourses = await Course.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo },
      isDeleted: { $ne: true }
    });

    const recentOrders = await Order.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo } 
    });

    res.status(200).json({
      success: true,
      message: "Platform overview fetched successfully",
      data: {
        users: {
          total: totalStudents + totalTeachers + totalAdmins,
          students: totalStudents,
          teachers: totalTeachers,
          admins: totalAdmins,
          deleted: deletedUsers
        },
        courses: {
          total: totalCourses,
          deleted: deletedCourses
        },
        revenue: {
          total: totalAmount,
          platformRevenue,
          teacherRevenue,
          totalOrders,
          completedOrders,
          pendingOrders,
          failedOrders
        },
        recentActivity: {
          newStudents: recentStudents,
          newCourses: recentCourses,
          newOrders: recentOrders
        }
      }
    });
  } catch (error) {
    console.error("Platform Overview Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching platform overview",
      error: error.message
    });
  }
};

// ============================================
// 📈 ADVANCED ANALYTICS
// ============================================

/**
 * Get User Growth Analytics
 * Returns user registration trends over time
 */
const getUserGrowthAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Student growth
    const studentGrowth = await Student.aggregate([
      { $match: { createdAt: { $gte: daysAgo }, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Teacher growth
    const teacherGrowth = await Teacher.aggregate([
      { $match: { createdAt: { $gte: daysAgo }, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Total users by type
    const totalStudents = await Student.countDocuments({ isDeleted: { $ne: true } });
    const totalTeachers = await Teacher.countDocuments({ isDeleted: { $ne: true } });

    res.status(200).json({
      success: true,
      message: "User growth analytics fetched successfully",
      data: {
        studentGrowth,
        teacherGrowth,
        totals: {
          students: totalStudents,
          teachers: totalTeachers
        }
      }
    });
  } catch (error) {
    console.error("User Growth Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user growth analytics",
      error: error.message
    });
  }
};

/**
 * Get Teacher Performance Analytics
 * Returns teacher statistics including courses, students, revenue
 */
const getTeacherPerformance = async (req, res) => {
  try {
    const teachers = await Teacher.find({ isDeleted: { $ne: true } })
      .select("name email verificationStatus")
      .lean();

    const performanceData = await Promise.all(
      teachers.map(async (teacher) => {
        const courses = await Course.find({ 
          teacher: teacher._id, 
          isDeleted: { $ne: true }
        });

        const totalStudents = courses.reduce(
          (sum, course) => sum + (course.students?.length || 0), 
          0
        );

        const revenue = await Order.aggregate([
          { 
            $match: { 
              courseId: { $in: courses.map(c => c._id) },
              status: "completed" 
            } 
          },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalRevenue = revenue[0]?.total || 0;
        const teacherRevenue = totalRevenue * 0.70; // 70% for teacher

        return {
          teacherId: teacher._id,
          name: teacher.name,
          email: teacher.email,
          verificationStatus: teacher.verificationStatus,
          totalCourses: courses.length,
          totalStudents,
          totalRevenue: teacherRevenue,
          averageRevenuePerCourse: courses.length > 0 
            ? teacherRevenue / courses.length 
            : 0
        };
      })
    );

    // Sort by revenue
    performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.status(200).json({
      success: true,
      message: "Teacher performance analytics fetched successfully",
      data: performanceData
    });
  } catch (error) {
    console.error("Teacher Performance Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching teacher performance",
      error: error.message
    });
  }
};

/**
 * Get Course Performance Analytics
 * Returns detailed course statistics
 */
const getCoursePerformance = async (req, res) => {
  try {
    const courses = await Course.find({ isDeleted: { $ne: true } })
      .populate("teacher", "name email")
      .lean();

    const performanceData = await Promise.all(
      courses.map(async (course) => {
        const orders = await Order.find({ 
          courseId: course._id,
          status: "completed"
        });

        const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);

        return {
          courseId: course._id,
          title: course.title,
          category: course.category,
          level: course.level,
          price: course.price,
          teacher: course.teacher,
          enrolledStudents: course.students?.length || 0,
          totalSales: orders.length,
          totalRevenue,
          rating: course.ratings?.length > 0
            ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
            : 0,
          reviewCount: course.ratings?.length || 0
        };
      })
    );

    // Sort by revenue
    performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.status(200).json({
      success: true,
      message: "Course performance analytics fetched successfully",
      data: performanceData
    });
  } catch (error) {
    console.error("Course Performance Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching course performance",
      error: error.message
    });
  }
};

/**
 * Get Enrollment Trends
 * Returns enrollment statistics over time
 */
const getEnrollmentTrends = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const enrollmentTrends = await Order.aggregate([
      { 
        $match: { 
          status: "completed",
          createdAt: { $gte: daysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          enrollments: { $sum: 1 },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Category-wise enrollments
    const categoryEnrollments = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course"
        }
      },
      { $unwind: "$course" },
      {
        $group: {
          _id: "$course.category",
          enrollments: { $sum: 1 }
        }
      },
      { $sort: { enrollments: -1 } }
    ]);

    res.status(200).json({
      success: true,
      message: "Enrollment trends fetched successfully",
      data: {
        dailyTrends: enrollmentTrends,
        categoryEnrollments
      }
    });
  } catch (error) {
    console.error("Enrollment Trends Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching enrollment trends",
      error: error.message
    });
  }
};

module.exports = {
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
};
