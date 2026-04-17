const mongoose = require("mongoose");
require("dotenv").config();

const Course = require("../models/Course");
const {
  initializeElasticsearch,
  isElasticsearchReady,
  upsertCourseInSearchIndex,
} = require("../utils/courseSearchIndex");

const MONGO_URL = process.env.MONGO_URL_ATLAS || process.env.MONGO_URL;

async function run() {
  if (!MONGO_URL) {
    throw new Error("Missing Mongo URL in environment");
  }

  await mongoose.connect(MONGO_URL);

  const elasticReady = await initializeElasticsearch();
  if (!elasticReady || !isElasticsearchReady()) {
    throw new Error("Elasticsearch is not configured or unavailable");
  }

  const courses = await Course.find({}).lean();
  let indexed = 0;

  for (const course of courses) {
    const ok = await upsertCourseInSearchIndex(course);
    if (ok) indexed += 1;
  }

  console.log(
    `Course reindex completed. Indexed ${indexed}/${courses.length} courses.`,
  );
}

run()
  .catch((error) => {
    console.error("Course reindex failed:", error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      // ignore close errors
    }
  });
