const User = require('../models/Student'); // Adjust path to your User model
const Course = require('../models/Course'); // Adjust path to your Course model

exports.getPublicStats = async (req, res) => {
  try {
    // 1. Count Students (users with role 'student')
    const students = await User.countDocuments({ role: 'student' });

    // 2. Count Instructors (users with role 'instructor' or 'teacher')
    const instructors = await User.countDocuments({ role: 'instructor' });

    // 3. Count Materials (Total number of courses)
    const materials = await Course.countDocuments({});

    // 4. Count Videos (Sum of 'lessons' or 'videos' field in all courses)
    // We use MongoDB aggregation to sum up a field across all documents
    const videoData = await Course.aggregate([
      {
        $group: {
          _id: null,
          totalVideos: { $sum: "$lessons" } // Change "$lessons" to whatever your field name is (e.g. "$videoCount")
        }
      }
    ]);
    const videos = videoData.length > 0 ? videoData[0].totalVideos : 0;

    res.status(200).json({
      success: true,
      stats: {
        students,
        instructors,
        videos,
        materials
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};