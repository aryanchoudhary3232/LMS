const mongoose = require("mongoose");
require("dotenv").config();

const Course = require("../models/Course");

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
}

function getTargetBaseUrl() {
  const fromArg = normalizeBaseUrl(process.argv[2]);
  const fromEnv = normalizeBaseUrl(
    process.env.API_BASE_URL || process.env.PUBLIC_ASSET_URL,
  );

  return fromArg || fromEnv;
}

function toProductionImageUrl(imageUrl, targetBaseUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return imageUrl;

  if (/^https?:\/\/localhost(?::\d+)?\/public\//i.test(imageUrl)) {
    return imageUrl.replace(/^https?:\/\/localhost(?::\d+)?/i, targetBaseUrl);
  }

  if (imageUrl.startsWith("/public/")) {
    return `${targetBaseUrl}${imageUrl}`;
  }

  if (imageUrl.startsWith("public/")) {
    return `${targetBaseUrl}/${imageUrl}`;
  }

  return imageUrl;
}

async function run() {
  const mongoUrl = process.env.MONGO_URL_ATLAS || process.env.MONGO_URL;
  const targetBaseUrl = getTargetBaseUrl();

  if (!mongoUrl) {
    console.error(
      "Missing Mongo connection string in MONGO_URL_ATLAS or MONGO_URL.",
    );
    process.exit(1);
  }

  if (!targetBaseUrl) {
    console.error(
      "Missing target base URL. Provide API_BASE_URL env var or run: node scripts/replaceLocalhostCourseImages.js https://your-domain",
    );
    process.exit(1);
  }

  await mongoose.connect(mongoUrl);

  try {
    const courses = await Course.find(
      {
        image: {
          $type: "string",
          $regex: "^(https?://localhost(:[0-9]+)?/public/|/?public/)",
          $options: "i",
        },
      },
      { _id: 1, image: 1, title: 1 },
    ).lean();

    if (courses.length === 0) {
      console.log("No localhost/public image URLs found. Nothing to update.");
      return;
    }

    const ops = [];

    for (const course of courses) {
      const updatedImage = toProductionImageUrl(course.image, targetBaseUrl);
      if (updatedImage && updatedImage !== course.image) {
        ops.push({
          updateOne: {
            filter: { _id: course._id },
            update: { $set: { image: updatedImage } },
          },
        });
      }
    }

    if (ops.length === 0) {
      console.log(
        "Matched courses found, but no image value needed transformation.",
      );
      return;
    }

    const result = await Course.bulkWrite(ops, { ordered: false });

    console.log(`Updated course images: ${result.modifiedCount}`);
    console.log(`Target base URL: ${targetBaseUrl}`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error("Failed to replace course image URLs:", error.message || error);
  process.exit(1);
});
