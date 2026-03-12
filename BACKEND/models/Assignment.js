const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    instructions: {
      type: String,
      default: "",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    chapter: {
      type: String,
      default: "",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 100,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    attachments: [
      {
        url: String,
        publicId: String,
        filename: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    allowLateSubmission: {
      type: Boolean,
      default: false,
    },
    submissionType: {
      type: String,
      enum: ["file", "text", "both"],
      default: "both",
    },
    status: {
      type: String,
      enum: ["active", "closed", "draft"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
