const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Course = require("../models/Course");
const { cacheResponse, cacheTags } = require("../middleware");

// GET /stats - Returns aggregated stats for the platform
router.get(
  "/",
  cacheResponse({
    ttlSeconds: 900,
    namespace: "stats-global",
    tags: [cacheTags.statsPublic],
  }),
  async (req, res) => {
    try {
      // Count total students
      const studentsCount = await Student.countDocuments();

      // Count total teachers
      const instructorsCount = await Teacher.countDocuments();

      // Count total courses
      const coursesCount = await Course.countDocuments();

      // Count total videos (each topic in each chapter has a video)
      const coursesWithChapters = await Course.find({}, { chapters: 1 });
      let videosCount = 0;
      coursesWithChapters.forEach((course) => {
        if (Array.isArray(course.chapters)) {
          course.chapters.forEach((chapter) => {
            if (Array.isArray(chapter.topics)) {
              videosCount += chapter.topics.length; // Each topic has a video
            }
          });
        }
      });

      // For materials, count courses that include notes
      const materialsCount = await Course.countDocuments({
        notes: { $exists: true, $ne: "" },
      });

      return res.json({
        success: true,
        data: {
          students: studentsCount,
          instructors: instructorsCount,
          videos: videosCount,
          materials: materialsCount,
          courses: coursesCount,
        },
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching stats",
        error: err.message,
      });
    }
  },
);

module.exports = router;
