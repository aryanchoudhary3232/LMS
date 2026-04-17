const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Student"],
      required: true,
    },
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        quizScores: [
          {
            chapterId: {
              type: mongoose.Schema.Types.ObjectId,
            },
            topicId: {
              type: mongoose.Schema.Types.ObjectId,
            },
            score: {
              type: Number,
            },
            totalQuestions: {
              type: Number,
            },
            submittedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        completedTopics: [
          {
            chapterId: {
              type: mongoose.Schema.Types.ObjectId,
            },
            topicId: {
              type: mongoose.Schema.Types.ObjectId,
            },
            completedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
    // 1) Track streak - added lastLogin field
    lastLogin: {
      type: Date,
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastActiveDateStreak: {
      type: Date,
    },
    bestStreak: {
      type: Number,
      default: 0,
    },

    studentProgress: [
      {
        date: {
          type: Date,
          required: true,
        },
        minutes: {
          type: Number,
          default: 0,
        },
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

studentSchema.index({ email: 1 });
studentSchema.index({ isDeleted: 1, deletedAt: -1 });
studentSchema.index({ "enrolledCourses.course": 1 });
studentSchema.index({ createdAt: -1 });

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
