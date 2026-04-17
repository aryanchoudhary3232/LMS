const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  paymentGateway: {
    type: String,
    enum: ["manual", "razorpay"],
    default: "manual",
  },
  razorpayOrderId: {
    type: String,
    default: null,
  },
  razorpayPaymentId: {
    type: String,
    default: null,
  },
  razorpaySignature: {
    type: String,
    default: null,
  },
  paymentVerifiedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ courseId: 1, status: 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 }, { sparse: true });
orderSchema.index({ razorpayPaymentId: 1 }, { sparse: true });

orderSchema.statics.getAllOrders = async function () {
  return await this.find().populate("courseId userId");
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
