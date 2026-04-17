const mongoose = require("mongoose");
const {
  upsertCourseInSearchIndex,
  removeCourseFromSearchIndex,
} = require("../utils/courseSearchIndex");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    category: { type: String },
    level: { type: String, enum: ["Beginner", "Intermediate", "Advance"] },
    duration: { type: Number },
    price: { type: Number },
    image: { type: String },
    video: { type: String },
    notes: { type: String },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    // Ratings array: students can rate courses they purchased/enrolled
    ratings: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        rating: { type: Number },
        review: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    chapters: [
      {
        title: {
          type: String,
        },
        topics: [
          {
            title: String,
            video: String,
            quiz: [
              {
                question: {
                  type: String,
                },
                options: [
                  {
                    type: String,
                  },
                ],
                correctOption: {
                  type: String,
                },
                explaination: {
                  type: String,
                },
              },
            ],
          },
        ],
      },
    ],

    // Soft delete fields
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

courseSchema.index({ teacher: 1, isDeleted: 1 });
courseSchema.index({ isDeleted: 1, deletedAt: -1 });
courseSchema.index({ category: 1, isDeleted: 1 });
courseSchema.index({ students: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ title: "text", description: "text" });

courseSchema.post("save", function syncCourseSearchOnSave(doc) {
  void upsertCourseInSearchIndex(doc);
});

courseSchema.post("findOneAndUpdate", function syncCourseSearchOnUpdate(doc) {
  if (!doc) return;
  void upsertCourseInSearchIndex(doc);
});

courseSchema.post("findOneAndDelete", function syncCourseSearchOnDelete(doc) {
  if (!doc?._id) return;
  void removeCourseFromSearchIndex(doc._id);
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
