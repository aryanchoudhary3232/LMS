const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  cards: [
    {
      type: {
        type: String,
        enum: ['qa', 'cloze'],
        default: 'qa'
      },
      question: {
        type: String,
        required: true
      },
      answer: {
        type: String,
        required: true
      },
      clozeText: String, // for cloze type: "The capital of France is ___"
      hints: [String],
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      },
      tags: [String],
      lectureTimestamp: String // e.g., "12:34" for video lectures
    }
  ],
  isPublished: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['private', 'course', 'public'],
    default: 'private'
  },
  stats: {
    totalReviews: {
      type: Number,
      default: 0
    },
    avgRating: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Flashcard', flashcardSchema);