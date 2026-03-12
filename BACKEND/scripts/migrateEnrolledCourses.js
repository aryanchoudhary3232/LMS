const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URL =
  process.env.MONGO_URL_ATLAS ||
  "mongodb+srv://aryan:aryan123@cluster0.qxutmim.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function migrateEnrolledCourses() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const studentsCollection = db.collection("students");

    // Find all students with old format enrolledCourses (just ObjectIds)
    const students = await studentsCollection.find({}).toArray();

    for (const student of students) {
      if (!student.enrolledCourses || student.enrolledCourses.length === 0) {
        continue;
      }

      // Check if already migrated (first item has 'course' property)
      const firstCourse = student.enrolledCourses[0];
      if (firstCourse && typeof firstCourse === "object" && firstCourse.course) {
        console.log(`Student ${student.email} already migrated, skipping...`);
        continue;
      }

      // Convert old format to new format
      const migratedCourses = student.enrolledCourses.map((courseId) => ({
        course: courseId,
        enrolledAt: new Date(),
        quizScores: [],
      }));

      await studentsCollection.updateOne(
        { _id: student._id },
        {
          $set: {
            enrolledCourses: migratedCourses,
            lastLogin: student.lastLogin || null,
            streak: student.streak || 0,
            bestStreak: student.bestStreak || 0,
          },
        }
      );

      console.log(`Migrated student: ${student.email}`);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

migrateEnrolledCourses();