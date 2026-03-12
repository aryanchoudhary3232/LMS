const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  items: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    }
  }],
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update the updatedAt timestamp on save
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;