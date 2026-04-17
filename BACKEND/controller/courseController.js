const Course = require("../models/Course");
const Student = require("../models/Student");
const { Types } = require("mongoose");
const { searchCoursesInElastic } = require("../utils/courseSearchIndex");

const computeAvg = (ratings = []) => {
  if (!ratings || ratings.length === 0) return { avg: 0, count: 0 };
  const sum = ratings.reduce((s, r) => s + (r.rating || 0), 0);
  return {
    avg: Math.round((sum / ratings.length) * 10) / 10,
    count: ratings.length,
  };
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isDeleted: { $ne: true } })
      .populate("teacher", "name email")
      .lean();

    // attach rating summary
    const data = courses.map((c) => {
      const { avg, count } = computeAvg(c.ratings);
      return { ...c, rating: { average: avg, count } };
    });

    res.status(200).json({
      success: true,
      message: "All courses retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Courses Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching courses",
    });
  }
};

const searchCourses = async (req, res) => {
  try {
    const { query, category, level } = req.query;
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 20;

    const safePage = page > 0 ? page : 1;
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    const elasticResult = await searchCoursesInElastic({
      query,
      category,
      level,
      page: safePage,
      limit: safeLimit,
    });

    if (elasticResult) {
      const ids = elasticResult.ids || [];
      let data = [];

      if (ids.length > 0) {
        const courses = await Course.find({
          _id: { $in: ids },
          isDeleted: { $ne: true },
        })
          .populate("teacher", "name email")
          .lean();

        const courseMap = new Map(
          courses.map((course) => [course._id.toString(), course]),
        );

        data = ids
          .map((id) => courseMap.get(id.toString()))
          .filter(Boolean)
          .map((course) => {
            const { avg, count } = computeAvg(course.ratings);
            return { ...course, rating: { average: avg, count } };
          });
      }

      return res.status(200).json({
        success: true,
        message: "Courses found successfully",
        count: elasticResult.total,
        page: safePage,
        limit: safeLimit,
        data,
      });
    }

    let searchQuery = { isDeleted: { $ne: true } };

    // Build search query based on parameters
    if (query) {
      const normalizedQuery = String(query).trim();
      const isShortQuery =
        normalizedQuery.length > 0 && normalizedQuery.length < 3;

      searchQuery.$or = isShortQuery
        ? [{ title: { $regex: normalizedQuery, $options: "i" } }]
        : [
            { title: { $regex: normalizedQuery, $options: "i" } },
            { description: { $regex: normalizedQuery, $options: "i" } },
          ];
    }

    if (category) {
      searchQuery.category = category;
    }

    if (level) {
      searchQuery.level = level;
    }

    const skip = (safePage - 1) * safeLimit;

    const [courses, total] = await Promise.all([
      Course.find(searchQuery)
        .populate("teacher", "name email")
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Course.countDocuments(searchQuery),
    ]);

    const data = courses.map((c) => {
      const { avg, count } = computeAvg(c.ratings);
      return { ...c, rating: { average: avg, count } };
    });

    res.status(200).json({
      success: true,
      message: "Courses found successfully",
      count: total,
      page: safePage,
      limit: safeLimit,
      data,
    });
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching courses",
    });
  }
};

// (module exports moved to bottom after rateCourse)

// Student rating endpoint: only logged-in users can rate. We optionally verify student enrollment.
const rateCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { rating, review } = req.body;
    // support both numeric and string rating from clients
    const ratingNum = rating !== undefined ? Number(rating) : NaN;
    const userId = (req.user && (req.user._id || req.user.id)) || null;

    console.debug(
      "rateCourse called: courseId=",
      courseId,
      "userId=",
      userId,
      "rating=",
      rating,
      "ratingNum=",
      ratingNum,
    );

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5",
      });
    }

    const course = await Course.findById(courseId);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    // Optional: ensure student is enrolled before rating
    const studentsArr = Array.isArray(course.students) ? course.students : [];
    const isEnrolled = studentsArr.some(
      (s) => s && s.toString && s.toString() === userId.toString(),
    );
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: "Only enrolled students can rate this course",
      });
    }

    // If user has rated before, update it
    const existingIndex = course.ratings.findIndex(
      (r) => r.student && r.student.toString() === userId.toString(),
    );
    if (existingIndex !== -1) {
      course.ratings[existingIndex].rating = ratingNum;
      course.ratings[existingIndex].review =
        review || course.ratings[existingIndex].review;
      course.ratings[existingIndex].createdAt = new Date();
    } else {
      // Use `new Types.ObjectId(...)` to construct ObjectId instances (avoids "cannot be invoked without 'new'" errors)
      course.ratings.push({
        student: new Types.ObjectId(userId),
        rating: ratingNum,
        review,
      });
    }

    await course.save();

    const { avg, count } = computeAvg(course.ratings);

    console.debug(
      "Rating saved for course",
      courseId,
      "avg:",
      avg,
      "count:",
      count,
    );

    return res.json({
      success: true,
      message: "Rating saved",
      data: { average: avg, count },
    });
  } catch (error) {
    console.error("rateCourse error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not save rating" });
  }
};

module.exports = {
  getAllCourses,
  searchCourses,
  rateCourse,
};
