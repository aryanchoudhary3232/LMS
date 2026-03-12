const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    textContent: {
      type: String,
      default: "",
    },
    attachments: [
      {
        url: String,
        publicId: String,
        filename: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["submitted", "graded", "returned"],
      default: "submitted",
    },
    grade: {
      marks: {
        type: Number,
        default: null,
      },
      feedback: {
        type: String,
        default: "",
      },
      gradedAt: {
        type: Date,
        default: null,
      },
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);
