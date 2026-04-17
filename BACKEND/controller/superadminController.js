const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Admin = require("../models/Admin");
const Course = require("../models/Course");
const Order = require("../models/Order");

const buildRecentUserCountPipeline = (daysAgo) => [
  {
    $addFields: {
      registeredAt: {
        $ifNull: ["$createdAt", { $toDate: "$_id" }],
      },
    },
  },
  { $match: { registeredAt: { $gte: daysAgo }, isDeleted: { $ne: true } } },
  { $count: "count" },
];

const buildUserGrowthPipeline = (daysAgo) => [
  {
    $addFields: {
      registeredAt: {
        $ifNull: ["$createdAt", { $toDate: "$_id" }],
      },
    },
  },
  { $match: { registeredAt: { $gte: daysAgo }, isDeleted: { $ne: true } } },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$registeredAt" } },
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
];

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
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalAmount = totalRevenue[0]?.total || 0;
    const platformRevenue = totalAmount * 0.3; // 30% for platform
    const teacherRevenue = totalAmount * 0.7; // 70% for teachers

    // Revenue by course category (platform's 30%)
    const revenueByCategory = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $group: {
          _id: "$course.category",
          totalRevenue: { $sum: "$amount" },
          platformRevenue: { $sum: { $multiply: ["$amount", 0.3] } },
          teacherRevenue: { $sum: { $multiply: ["$amount", 0.7] } },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
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
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    // Top selling courses
    const topSellingCourses = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$courseId",
          totalRevenue: { $sum: "$amount" },
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
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
        topSellingCourses,
      },
    });
  } catch (error) {
    console.error("Revenue Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching revenue analytics",
      error: error.message,
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

    const filter =
      includeDeleted === "true" ? {} : { isDeleted: { $ne: true } };

    const coursesByCategory = await Course.aggregate([
      { $match: filter },
      // Lookup teacher info BEFORE grouping
      {
        $lookup: {
          from: "teachers",
          localField: "teacher",
          foreignField: "_id",
          as: "teacherInfo",
        },
      },
      {
        $unwind: {
          path: "$teacherInfo",
          preserveNullAndEmptyArrays: true,
        },
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
                email: "$teacherInfo.email",
              },
              studentCount: { $size: "$students" },
              isDeleted: "$isDeleted",
              deletedAt: "$deletedAt",
            },
          },
          totalCourses: { $sum: 1 },
          totalStudents: { $sum: { $size: "$students" } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      message: "Courses by category fetched successfully",
      data: coursesByCategory,
    });
  } catch (error) {
    console.error("Courses by Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching courses by category",
      error: error.message,
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
        courses: deletedCourses,
      },
    });
  } catch (error) {
    console.error("Deleted Courses Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching deleted courses",
      error: error.message,
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
      { new: true },
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course restored successfully",
      data: course,
    });
  } catch (error) {
    console.error("Restore Course Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while restoring course",
      error: error.message,
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

    const filter =
      includeDeleted === "true" ? {} : { isDeleted: { $ne: true } };

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
      deletedAdmins: await Admin.countDocuments({ isDeleted: true }),
    };

    res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      data: {
        stats,
        students,
        teachers,
        admins,
      },
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
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
        totalDeleted:
          deletedStudents.length +
          deletedTeachers.length +
          deletedAdmins.length,
      },
    });
  } catch (error) {
    console.error("Deleted Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching deleted users",
      error: error.message,
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
          message: "Invalid user type. Must be Student, Teacher, or Admin",
        });
    }

    // Find the user first to check if they exist
    const existingUser = await Model.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `${userType} not found`,
      });
    }

    // Update the user to restore
    user = await Model.findByIdAndUpdate(
      userId,
      { isDeleted: false, deletedAt: null },
      { new: true },
    ).select("-password");

    res.status(200).json({
      success: true,
      message: `${userType} restored successfully`,
      data: user,
    });
  } catch (error) {
    console.error("Restore User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while restoring user",
      error: error.message,
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
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalStudents,
      totalTeachers,
      totalAdmins,
      deletedStudents,
      deletedTeachers,
      deletedAdmins,
      totalCourses,
      deletedCourses,
      totalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      failedOrders,
      recentStudentAggregation,
      recentCourses,
      recentOrders,
    ] = await Promise.all([
      Student.countDocuments({ isDeleted: { $ne: true } }),
      Teacher.countDocuments({ isDeleted: { $ne: true } }),
      Admin.countDocuments({ isDeleted: { $ne: true } }),
      Student.countDocuments({ isDeleted: true }),
      Teacher.countDocuments({ isDeleted: true }),
      Admin.countDocuments({ isDeleted: true }),
      Course.countDocuments({ isDeleted: { $ne: true } }),
      Course.countDocuments({ isDeleted: true }),
      Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ status: "completed" }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "failed" }),
      Student.aggregate(buildRecentUserCountPipeline(sevenDaysAgo)),
      Course.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        isDeleted: { $ne: true },
      }),
      Order.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      }),
    ]);

    const deletedUsers = deletedStudents + deletedTeachers + deletedAdmins;
    const totalAmount = totalRevenue[0]?.total || 0;
    const platformRevenue = totalAmount * 0.3; // 30% for platform
    const teacherRevenue = totalAmount * 0.7; // 70% for teachers
    const recentStudents = recentStudentAggregation[0]?.count || 0;

    res.status(200).json({
      success: true,
      message: "Platform overview fetched successfully",
      data: {
        users: {
          total: totalStudents + totalTeachers + totalAdmins,
          students: totalStudents,
          teachers: totalTeachers,
          admins: totalAdmins,
          deleted: deletedUsers,
        },
        courses: {
          total: totalCourses,
          deleted: deletedCourses,
        },
        revenue: {
          total: totalAmount,
          platformRevenue,
          teacherRevenue,
          totalOrders,
          completedOrders,
          pendingOrders,
          failedOrders,
        },
        recentActivity: {
          newStudents: recentStudents,
          newCourses: recentCourses,
          newOrders: recentOrders,
        },
      },
    });
  } catch (error) {
    console.error("Platform Overview Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching platform overview",
      error: error.message,
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
    const { period = "30" } = req.query; // days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const studentGrowth = await Student.aggregate(
      buildUserGrowthPipeline(daysAgo),
    );

    const teacherGrowth = await Teacher.aggregate(
      buildUserGrowthPipeline(daysAgo),
    );

    // Total users by type
    const totalStudents = await Student.countDocuments({
      isDeleted: { $ne: true },
    });
    const totalTeachers = await Teacher.countDocuments({
      isDeleted: { $ne: true },
    });

    res.status(200).json({
      success: true,
      message: "User growth analytics fetched successfully",
      data: {
        studentGrowth,
        teacherGrowth,
        totals: {
          students: totalStudents,
          teachers: totalTeachers,
        },
      },
    });
  } catch (error) {
    console.error("User Growth Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user growth analytics",
      error: error.message,
    });
  }
};

/**
 * Get Teacher Performance Analytics
 * Returns teacher statistics including courses, students, revenue
 */
const getTeacherPerformance = async (req, res) => {
  try {
    const [teachers, courseStats, revenueStats] = await Promise.all([
      Teacher.find({ isDeleted: { $ne: true } })
        .select("name email verificationStatus")
        .lean(),
      Course.aggregate([
        {
          $match: {
            isDeleted: { $ne: true },
            teacher: { $ne: null },
          },
        },
        {
          $project: {
            teacher: 1,
            studentsCount: { $size: { $ifNull: ["$students", []] } },
          },
        },
        {
          $group: {
            _id: "$teacher",
            totalCourses: { $sum: 1 },
            totalStudents: { $sum: "$studentsCount" },
          },
        },
      ]),
      Order.aggregate([
        { $match: { status: "completed" } },
        {
          $lookup: {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "course",
          },
        },
        { $unwind: "$course" },
        { $match: { "course.isDeleted": { $ne: true } } },
        {
          $group: {
            _id: "$course.teacher",
            totalRevenue: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const courseStatsMap = new Map(
      courseStats.map((item) => [
        item._id?.toString(),
        {
          totalCourses: item.totalCourses || 0,
          totalStudents: item.totalStudents || 0,
        },
      ]),
    );

    const revenueMap = new Map(
      revenueStats.map((item) => [
        item._id?.toString(),
        item.totalRevenue || 0,
      ]),
    );

    const performanceData = teachers.map((teacher) => {
      const stats = courseStatsMap.get(teacher._id.toString()) || {
        totalCourses: 0,
        totalStudents: 0,
      };
      const grossRevenue = revenueMap.get(teacher._id.toString()) || 0;
      const teacherRevenue = grossRevenue * 0.7; // 70% for teacher

      return {
        teacherId: teacher._id,
        name: teacher.name,
        email: teacher.email,
        verificationStatus: teacher.verificationStatus,
        totalCourses: stats.totalCourses,
        totalStudents: stats.totalStudents,
        totalRevenue: teacherRevenue,
        averageRevenuePerCourse:
          stats.totalCourses > 0 ? teacherRevenue / stats.totalCourses : 0,
      };
    });

    // Sort by revenue
    performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.status(200).json({
      success: true,
      message: "Teacher performance analytics fetched successfully",
      data: performanceData,
    });
  } catch (error) {
    console.error("Teacher Performance Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching teacher performance",
      error: error.message,
    });
  }
};

/**
 * Get Course Performance Analytics
 * Returns detailed course statistics
 */
const getCoursePerformance = async (req, res) => {
  try {
    const performanceData = await Course.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: "teachers",
          localField: "teacher",
          foreignField: "_id",
          as: "teacher",
        },
      },
      {
        $unwind: {
          path: "$teacher",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "orders",
          let: { courseId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$courseId", "$$courseId"] },
                    { $eq: ["$status", "completed"] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: "$amount" },
              },
            },
          ],
          as: "orderStats",
        },
      },
      {
        $addFields: {
          orderStats: {
            $ifNull: [
              { $arrayElemAt: ["$orderStats", 0] },
              { totalSales: 0, totalRevenue: 0 },
            ],
          },
          enrolledStudents: { $size: { $ifNull: ["$students", []] } },
          rating: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$ratings", []] } }, 0] },
              { $avg: "$ratings.rating" },
              0,
            ],
          },
          reviewCount: { $size: { $ifNull: ["$ratings", []] } },
        },
      },
      {
        $project: {
          courseId: "$_id",
          title: 1,
          category: 1,
          level: 1,
          price: 1,
          teacher: {
            _id: "$teacher._id",
            name: "$teacher.name",
            email: "$teacher.email",
          },
          enrolledStudents: 1,
          totalSales: "$orderStats.totalSales",
          totalRevenue: "$orderStats.totalRevenue",
          rating: 1,
          reviewCount: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: "Course performance analytics fetched successfully",
      data: performanceData,
    });
  } catch (error) {
    console.error("Course Performance Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching course performance",
      error: error.message,
    });
  }
};

/**
 * Get Enrollment Trends
 * Returns enrollment statistics over time
 */
const getEnrollmentTrends = async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const enrollmentTrends = await Order.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: daysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          enrollments: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Category-wise enrollments
    const categoryEnrollments = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $group: {
          _id: "$course.category",
          enrollments: { $sum: 1 },
        },
      },
      { $sort: { enrollments: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: "Enrollment trends fetched successfully",
      data: {
        dailyTrends: enrollmentTrends,
        categoryEnrollments,
      },
    });
  } catch (error) {
    console.error("Enrollment Trends Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching enrollment trends",
      error: error.message,
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
  getEnrollmentTrends,
};
