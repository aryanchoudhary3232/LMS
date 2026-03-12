const Course = require("../models/Course");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Order = require("../models/Order");
const path = require("path");
const { notFound } = require("../utils/respond");
const mongoose = require("mongoose");

async function getTeachers(req, res) {
  const teachers = await Teacher.find().select("_id name");

  res.json({
    message: "Teachers retrieved successfully",
    data: teachers,
    success: true,
    error: false,
  });
}

async function createCourse(req, res) {
  const { title, description, category, level, duration, price } = req.body;
  const teacher = req.user._id;

  let chapters = JSON.parse(req.body.chapters);

  const imageFile = req.files.find((f) => f.fieldname === "image");
  const videoFile = req.files.find((f) => f.fieldname === "video");
  const notesFile = req.files.find((f) => f.fieldname === "notes");

  const imagePath = imageFile.path;
  const videoPath = videoFile.path;
  const notesPath = notesFile ? notesFile.path : undefined;

  const newChapters = chapters.map((chapter, chapterIdx) => {
    return {
      title: chapter.title,
      topics: chapter.topics.map((topic, topicIdx) => {
        const fileKey = `chapters[${chapterIdx}][topics][${topicIdx}][video]`;

        const topicVideoFile = req.files.find((f) => f.fieldname === fileKey);
        const topicVideoPath = topicVideoFile.path;

        return {
          title: topic.title,
          video: topicVideoPath,
          quiz: topic.quiz,
        };
      }),
    };
  });

  const course = new Course({
    title,
    description,
    category,
    level,
    duration,
    price,
    image: imagePath,
    video: videoPath,
    notes: notesPath,
    teacher,
    chapters: newChapters,
  });

  const response = await course.save();

  await Teacher.findByIdAndUpdate(teacher, {
    $push: {
      courses: response._id,
    },
  });

  res.json({
    message: "Course created succesfully",
    data: response,
    success: true,
    error: false,
  });
}

async function updateCourse(req, res) {
  try {
    const { courseId } = req.params;
    const teacherId = req.user._id;

    // Check if course exists and belongs to this teacher
    const existingCourse = await Course.findById(courseId);
    if (!existingCourse) {
      return res.status(404).json({
        message: "Course not found",
        success: false,
        error: true,
      });
    }

    if (existingCourse.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to edit this course",
        success: false,
        error: true,
      });
    }

    const { title, description, category, level, duration, price } = req.body;

    // Prepare update object
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (level) updateData.level = level;
    if (duration) updateData.duration = duration;
    if (price) updateData.price = price;

    // Handle file uploads if present
    if (req.files && req.files.length > 0) {
      const imageFile = req.files.find((f) => f.fieldname === "image");
      const videoFile = req.files.find((f) => f.fieldname === "video");
      const notesFile = req.files.find((f) => f.fieldname === "notes");

      if (imageFile) updateData.image = imageFile.path;
      if (videoFile) updateData.video = videoFile.path;
      if (notesFile) updateData.notes = notesFile.path;
    }

    // Handle chapters if provided
    if (req.body.chapters) {
      let chapters = JSON.parse(req.body.chapters);

      const newChapters = chapters.map((chapter, chapterIdx) => {
        return {
          _id: chapter._id, // Keep existing ID if updating
          title: chapter.title,
          topics: chapter.topics.map((topic, topicIdx) => {
            // Check if there's a new video file for this topic
            const fileKey = `chapters[${chapterIdx}][topics][${topicIdx}][video]`;
            const topicVideoFile = req.files?.find(
              (f) => f.fieldname === fileKey
            );

            return {
              _id: topic._id, // Keep existing ID if updating
              title: topic.title,
              video: topicVideoFile ? topicVideoFile.path : topic.video,
              quiz: topic.quiz,
            };
          }),
        };
      });

      updateData.chapters = newChapters;
    }

    const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, {
      new: true,
    });

    res.json({
      message: "Course updated successfully",
      data: updatedCourse,
      success: true,
      error: false,
    });
  } catch (error) {
    console.log("Error updating course:", error);
    res.status(500).json({
      message: error.message || "Failed to update course",
      success: false,
      error: true,
    });
  }
}

async function getTeacherCourses(req, res) {
  try {
    const teacherCourses = await Teacher.findById(req.user._id)
      .populate({
        path: "courses",
      })
      .select("courses");

    res.json({
      message: "Teacher courses retrieved successfully",
      data: teacherCourses,
      success: true,
      error: false,
    });
  } catch (error) {
    console.log("err occurred...", error);
    res.json({
      message: error.message || "Teacher courses failed",
      success: false,
      error: true,
    });
  }
}

async function getCourses(req, res) {
  const courses = await Course.find();

  res.json({
    message: "Courses retrieved ",
    data: courses,
    success: true,
    error: false,
  });
}

async function getTeacherCourses(req, res) {
  const teacherId = req.user._id;
  const courses = await Course.find({ teacher: teacherId });

  res.json({
    message: "Teacher courses retrieved",
    data: courses,
    success: true,
    error: false,
  });
}

async function getcourseById(req, res) {
  const course = await Course.findById(req.params.courseId, {
    "chapters.topics.quiz.correctOption": 0,
    "chapters.topics.quiz.explaination": 0,
  });

  res.json({
    message: "Courses retrieved ",
    data: course,
    success: true,
    error: false,
  });
}
//code for teacher dashboard
function percentChange(current, previous) {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
}

async function getTeacherMetrics(req, res) {
  try {
    const userId = req.user.userId; // From JWT verify middleware
    const periodDays = Number.parseInt(req.query.days, 10) || 30;

    // Get teacher's courses
    const teachersCourses = await Course.find({ teacher: userId });
    const courseIds = teachersCourses.map((c) => c._id);

    // Get all orders
    const allOrders = await Order.getAllOrders();

    const completed = allOrders.filter(
      (o) =>
        o?.status === "completed" &&
        o?.courseId &&
        courseIds.some((id) => id.toString() === o.courseId._id.toString())
    );

    const totalRevenue = completed.reduce((sum, o) => sum + (o.amount || 0), 0);

    const totalCustomers = new Set(
      completed.filter((o) => o.userId).map((o) => o.userId._id.toString())
    ).size;

    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - periodDays);
    const prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - periodDays);

    const inPeriod = completed.filter(
      (o) => o.createdAt && o.createdAt >= periodStart && o.createdAt <= now
    );
    const prevPeriod = completed.filter(
      (o) =>
        o.createdAt &&
        o.createdAt >= prevPeriodStart &&
        o.createdAt < periodStart
    );

    const revenueCurrent = inPeriod.reduce(
      (sum, o) => sum + (o.amount || 0),
      0
    );
    const revenuePrevious = prevPeriod.reduce(
      (sum, o) => sum + (o.amount || 0),
      0
    );
    const revenueGrowthRate = percentChange(revenueCurrent, revenuePrevious);

    const customersCurrent = new Set(
      inPeriod.filter((o) => o.userId).map((o) => o.userId._id.toString())
    ).size;
    const customersPrevious = new Set(
      prevPeriod.filter((o) => o.userId).map((o) => o.userId._id.toString())
    ).size;
    const customerGrowthRate = percentChange(
      customersCurrent,
      customersPrevious
    );

    const byUser = new Map();
    completed
      .filter((o) => o.userId && o.createdAt)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .forEach((o) => {
        const uid = o.userId._id.toString();
        if (!byUser.has(uid)) byUser.set(uid, new Date(o.createdAt));
      });

    let newCustomers = 0;
    for (const firstDate of byUser.values()) {
      if (firstDate >= periodStart && firstDate <= now) newCustomers++;
    }

    // Get course stats for table
    const courseStats = teachersCourses.map((course) => {
      const courseOrders = completed.filter(
        (o) => o.courseId._id.toString() === course._id.toString()
      );
      const courseRevenue = courseOrders.reduce(
        (sum, o) => sum + (o.amount || 0),
        0
      );
      const enrollments = new Set(
        courseOrders.map((o) => o.userId._id.toString())
      ).size;

      return {
        id: course._id,
        title: course.title,
        category: course.category,
        price: course.price,
        enrollments,
        revenue: courseRevenue,
      };
    });

    return res.json({
      success: true,
      data: {
        metrics: {
          totalRevenue,
          totalCustomers,
          newCustomers,
          revenueGrowthRate: revenueGrowthRate.toFixed(2),
          customerGrowthRate: customerGrowthRate.toFixed(2),
          periodDays,
          totalCourses: courseIds.length,
          totalOrders: completed.length,
          period: { from: periodStart, to: now },
          previousPeriod: { from: prevPeriodStart, to: periodStart },
        },
        courseStats,
        revenueByDay: getRevenueByDay(inPeriod, periodDays),
      },
    });
  } catch (error) {
    console.error("getTeacherMetrics error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not compute teacher metrics.",
    });
  }
}

function getRevenueByDay(orders, days) {
  const dailyRevenue = new Map();
  const now = new Date();

  // Initialize all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    dailyRevenue.set(dateKey, 0);
  }

  // Add revenue for each order
  orders.forEach((order) => {
    const dateKey = new Date(order.createdAt).toISOString().split("T")[0];
    if (dailyRevenue.has(dateKey)) {
      dailyRevenue.set(dateKey, dailyRevenue.get(dateKey) + order.amount);
    }
  });

  return Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }));
}

async function uploadQualification(req, res) {
  try {
    // ensure file present (multer puts it on req.file when using single)
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "No qualification file uploaded",
      });
    }

    const { _id, role } = req.user;
    if (role !== "Teacher") {
      return res.status(403).json({
        success: false,
        error: true,
        message: "Only teachers can upload qualification",
      });
    }

    // Derive some metadata
    const {
      path: url,
      filename: publicId,
      mimetype,
      size,
      originalname,
    } = req.file;
    const resourceType = mimetype.startsWith("video")
      ? "video"
      : mimetype.startsWith("image")
      ? "image"
      : "raw";
    const format = (path.extname(originalname || "") || "").replace(".", "");

    const update = {
      qualificationDoc: {
        url,
        publicId,
        resourceType,
        format,
        bytes: size,
        uploadedAt: new Date(),
      },
      verificationStatus: "Pending",
      verificationNotes: "",
    };

    const teacher = await Teacher.findByIdAndUpdate(_id, update, {
      new: true,
      select: "-password",
    });

    if (!teacher) {
      return notFound(res, "Teacher");
    }

    return res.json({
      success: true,
      error: false,
      message: "Qualification uploaded. Awaiting admin verification.",
      data: {
        verificationStatus: teacher.verificationStatus,
        qualificationDoc: teacher.qualificationDoc,
      },
    });
  } catch (error) {
    console.error("uploadQualification error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Server error while uploading qualification",
    });
  }
}

async function getQualificationStatus(req, res) {
  try {
    const { _id, role } = req.user;
    if (role !== "Teacher") {
      return res.status(403).json({
        success: false,
        error: true,
        message: "Only teachers can access this resource",
      });
    }

    const teacher = await Teacher.findById(_id).select(
      "verificationStatus verificationNotes qualificationDoc name email"
    );

    if (!teacher) {
      return notFound(res, "Teacher");
    }

    return res.json({
      success: true,
      error: false,
      message: "Verification status retrieved",
      data: teacher,
    });
  } catch (error) {
    console.error("getQualificationStatus error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Server error while fetching verification status",
    });
  }
}

async function getEnrolledStudents(req, res) {
  try {
    const teacherId = req.user._id;

    // 1️⃣ Find all courses of this teacher
    const courses = await Course.find({ teacher: teacherId });

    if (courses.length === 0) {
      return res.json({ students: [] });
    }

    // 2️⃣ Extract all students from all courses
    let allStudents = [];

    courses.forEach((course) => {
      allStudents.push(...course.students.map((id) => id.toString()));
    });

    // 3️⃣ Remove duplicates
    const uniqueStudentIds = [...new Set(allStudents)];

    // 4️⃣ Fetch student details
    const students = await Student.find({
      _id: { $in: uniqueStudentIds },
    }).select("name email enrolledCourses");

    // 5️⃣ For frontend: Also send course list with student count
    const formatted = students.map((student) => {
      const enrolled = courses
        .filter((course) => course.students.includes(student._id))
        .map((c) => c.title);

      return {
        id: student._id,
        name: student.name,
        email: student.email,
        totalCourses: enrolled.length,
        courses: enrolled,
      };
    });

    res.json({ students: formatted });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
}

async function getTeacherDashboard(req, res) {
  try {
    const teacherId = req.user._id;

    // Teacher ke courses
    const courses = await Course.find({ teacher: teacherId });

    const totalCourses = courses.length;

    // 💡 Unique students count
    let studentIds = [];
    courses.forEach((c) => {
      studentIds.push(...c.students.map((id) => id.toString()));
    });
    studentIds = [...new Set(studentIds)];

    const totalStudents = studentIds.length;

    // 💡 Average rating
    const allRatings = [];
    courses.forEach((c) => {
      if (c.ratings) allRatings.push(...c.ratings);
    });

    const avgRating =
      allRatings.length > 0
        ? (
            allRatings.reduce((a, b) => a + b.rating, 0) / allRatings.length
          ).toFixed(1)
        : 0;

    // 💡 Course enrollment chart
    const enrollmentData = courses.map((c) => ({
      courseName: c.title,
      students: c.students.length,
    }));

    // 💡 Recent Activity: last 5 course activities (based on enrollments and completed topics)
    const recentActivity = await Student.aggregate([
      // Unwind enrolled courses first
      { $unwind: "$enrolledCourses" },
      // Lookup course details
      {
        $lookup: {
          from: "courses",
          localField: "enrolledCourses.course",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: "$courseInfo" },
      // Match only teacher's courses
      {
        $match: {
          "courseInfo.teacher": new mongoose.Types.ObjectId(teacherId),
        },
      },
      // Unwind completedTopics to get individual activities
      {
        $unwind: {
          path: "$enrolledCourses.completedTopics",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Project the fields we need
      {
        $project: {
          name: 1,
          course: "$courseInfo.title",
          date: {
            $ifNull: [
              "$enrolledCourses.completedTopics.completedAt",
              "$enrolledCourses.enrolledAt",
            ],
          },
          activityType: {
            $cond: {
              if: { $ifNull: ["$enrolledCourses.completedTopics", false] },
              then: "Completed Topic",
              else: "Enrolled",
            },
          },
        },
      },
      { $sort: { date: -1 } },
      { $limit: 5 },
      // Add minutes as 0 since we don't track per-activity minutes
      {
        $project: {
          name: 1,
          course: 1,
          date: 1,
          minutes: { $literal: "-" },
        },
      },
    ]);

    res.json({
      totalCourses,
      totalStudents,
      avgRating,
      enrollmentData,
      recentActivity,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
}

module.exports = {
  getTeachers,
  createCourse,
  updateCourse,
  getTeacherCourses,
  getCourses,
  getTeacherCourses,
  getcourseById,
  uploadQualification,
  getQualificationStatus,
  getTeacherMetrics,
  getEnrolledStudents,
  getTeacherDashboard,
};
