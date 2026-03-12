const mongoose = require("mongoose");
require("dotenv").config();

const Course = require("../models/Course");

const MONGO_URL =
  process.env.MONGO_URL_ATLAS ||
  "mongodb+srv://aryan:aryan123@cluster0.qxutmim.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function checkDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("Connected successfully");

    console.log("Checking courses collection...");
    const courseCount = await Course.countDocuments();
    console.log("Total courses in database:", courseCount);

    if (courseCount > 0) {
      const courses = await Course.find().limit(5);
      console.log("Sample courses:");
      courses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.title} - ${course.description}`);
      });
    } else {
      console.log("No courses found in database");
    }

    mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    mongoose.disconnect();
  }
}

checkDatabase();
