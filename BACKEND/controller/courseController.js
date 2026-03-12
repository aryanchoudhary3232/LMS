const Course = require("../models/Course");
const Student = require("../models/Student");
const { Types } = require("mongoose");

const computeAvg = (ratings = []) => {
  if (!ratings || ratings.length === 0) return { avg: 0, count: 0 };
  const sum = ratings.reduce((s, r) => s + (r.rating || 0), 0);
  return { avg: Math.round((sum / ratings.length) * 10) / 10, count: ratings.length };
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("teacher", "name email");

    // attach rating summary
    const data = courses.map((c) => {
      const { avg, count } = computeAvg(c.ratings);
      return { ...c.toObject(), rating: { average: avg, count } };
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
    
    let searchQuery = {};
    
    // Build search query based on parameters
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (category) {
      searchQuery.category = category;
    }
    
    if (level) {
      searchQuery.level = level;
    }

    const courses = await Course.find(searchQuery)
      .populate("teacher", "name email");

    const data = courses.map((c) => {
      const { avg, count } = computeAvg(c.ratings);
      return { ...c.toObject(), rating: { average: avg, count } };
    });

    res.status(200).json({
      success: true,
      message: "Courses found successfully",
      count: courses.length,
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

    console.debug("rateCourse called: courseId=", courseId, "userId=", userId, "rating=", rating, "ratingNum=", ratingNum);

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    // Optional: ensure student is enrolled before rating
    const studentsArr = Array.isArray(course.students) ? course.students : [];
    const isEnrolled = studentsArr.some((s) => s && s.toString && s.toString() === userId.toString());
    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: "Only enrolled students can rate this course" });
    }

    // If user has rated before, update it
    const existingIndex = course.ratings.findIndex((r) => r.student && r.student.toString() === userId.toString());
    if (existingIndex !== -1) {
      course.ratings[existingIndex].rating = ratingNum;
      course.ratings[existingIndex].review = review || course.ratings[existingIndex].review;
      course.ratings[existingIndex].createdAt = new Date();
    } else {
      // Use `new Types.ObjectId(...)` to construct ObjectId instances (avoids "cannot be invoked without 'new'" errors)
      course.ratings.push({ student: new Types.ObjectId(userId), rating: ratingNum, review });
    }

    await course.save();

    const { avg, count } = computeAvg(course.ratings);

    console.debug("Rating saved for course", courseId, "avg:", avg, "count:", count);

    return res.json({ success: true, message: "Rating saved", data: { average: avg, count } });
  } catch (error) {
    console.error("rateCourse error:", error);
    return res.status(500).json({ success: false, message: "Could not save rating" });
  }
};

  module.exports = {
    getAllCourses,
    searchCourses,
    rateCourse,
  };