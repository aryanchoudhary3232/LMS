const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "authorModel",
    },
    authorModel: {
      type: String,
      required: true,
      enum: ["Student", "Teacher"],
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    isAcceptedAnswer: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

replySchema.index({ discussion: 1, createdAt: 1 });
replySchema.index({ discussion: 1, isAcceptedAnswer: -1, createdAt: 1 });

const Reply = mongoose.model("Reply", replySchema);

module.exports = Reply;