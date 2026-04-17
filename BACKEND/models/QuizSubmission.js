const mongoose = require("mongoose");

const quizSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  quiz: [
    {
      questionText: String,
      options: [
        {
          type: String,
        },
      ],
      tickOption: String,
      correctOption: String,
      isCorrect: Boolean,
      explaination: String,
    },
  ],
  correct: String,
  totalQuestions: String,
  score: String,
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

quizSubmissionSchema.index({ studentId: 1, submittedAt: -1 });
quizSubmissionSchema.index({ studentId: 1, courseId: 1, submittedAt: -1 });
quizSubmissionSchema.index({ courseId: 1, chapterId: 1, topicId: 1 });

const QuizSubmission = mongoose.model("QuizSubmission", quizSubmissionSchema);

module.exports = QuizSubmission;
