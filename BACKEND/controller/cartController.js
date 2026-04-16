const crypto = require("crypto");
const Razorpay = require("razorpay");
const Cart = require("../models/Cart");
const Course = require("../models/Course");
const Student = require("../models/Student");
const Order = require("../models/Order");
const { sendCoursePurchaseConfirmationEmail } = require("../utils/sendEmail");

const RAZORPAY_CURRENCY = "INR";

let razorpayClient = null;

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getUniqueCourseIds(courseIds = []) {
  if (!Array.isArray(courseIds)) return [];
  return [...new Set(courseIds.map((id) => id?.toString()))].filter(Boolean);
}

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayClient;
}

function isValidRazorpaySignature({ orderId, paymentId, signature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(String(signature || ""));

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

async function buildCheckoutContext(studentId, courseIds) {
  const uniqueCourseIds = getUniqueCourseIds(courseIds);

  if (uniqueCourseIds.length === 0) {
    throw createHttpError(400, "No courses supplied for enrollment");
  }

  const student = await Student.findById(studentId).select(
    "name email enrolledCourses"
  );

  if (!student) {
    throw createHttpError(404, "Student not found");
  }

  const existingCourseIds = new Set(
    (student.enrolledCourses || [])
      .map((enrollment) => enrollment?.course?.toString())
      .filter(Boolean)
  );

  const newCourseIds = uniqueCourseIds.filter((id) => !existingCourseIds.has(id));

  if (newCourseIds.length === 0) {
    return {
      student,
      alreadyEnrolled: true,
      validCourseIds: [],
      coursesToEnroll: [],
      purchasedCourses: [],
      totalAmount: 0,
    };
  }

  const coursesToEnroll = await Course.find({
    _id: { $in: newCourseIds },
    isDeleted: { $ne: true },
  }).select("_id title price");

  const validCourseIdSet = new Set(
    coursesToEnroll.map((course) => course._id.toString())
  );
  const validCourseIds = newCourseIds.filter((id) => validCourseIdSet.has(id));

  if (validCourseIds.length === 0) {
    throw createHttpError(400, "No valid courses supplied for enrollment");
  }

  const purchasedCourses = coursesToEnroll
    .filter((course) => validCourseIdSet.has(course._id.toString()))
    .map((course) => ({
      title: course.title,
      price: Number(course.price) || 0,
    }));

  const totalAmount = purchasedCourses.reduce((sum, course) => sum + course.price, 0);

  if (totalAmount <= 0) {
    throw createHttpError(
      400,
      "Selected courses have invalid pricing. Please contact support"
    );
  }

  return {
    student,
    alreadyEnrolled: false,
    validCourseIds,
    coursesToEnroll,
    purchasedCourses,
    totalAmount,
  };
}

async function processEnrollment(
  studentId,
  courseIds,
  paymentMeta = {},
  checkoutContext = null
) {
  const context = checkoutContext || (await buildCheckoutContext(studentId, courseIds));

  if (context.alreadyEnrolled) {
    return {
      message: "All selected courses are already enrolled",
      cart: { items: [] },
      enrolledCourses: context.student.enrolledCourses || [],
      alreadyEnrolled: true,
    };
  }

  const enrollementObjects = context.validCourseIds.map((id) => ({
    course: id,
    enrolledAt: new Date(),
    avgQuizScore: 0,
    completedQuizzes: 0,
    progress: 0,
  }));

  await Student.findByIdAndUpdate(
    studentId,
    {
      $push: {
        enrolledCourses: {
          $each: enrollementObjects,
        },
      },
    },
    { new: true }
  );

  await Course.updateMany(
    { _id: { $in: context.validCourseIds } },
    {
      $addToSet: { students: studentId },
    }
  );

  const orderDocuments = context.coursesToEnroll.map((course) => ({
    userId: studentId,
    courseId: course._id,
    amount: Number(course.price) || 0,
    status: "completed",
    paymentGateway: paymentMeta.gateway || "manual",
    razorpayOrderId: paymentMeta.razorpayOrderId,
    razorpayPaymentId: paymentMeta.razorpayPaymentId,
    razorpaySignature: paymentMeta.razorpaySignature,
    paymentVerifiedAt: paymentMeta.gateway === "razorpay" ? new Date() : undefined,
  }));

  if (orderDocuments.length > 0) {
    await Order.insertMany(orderDocuments);
  }

  const updatedStudent = await Student.findById(studentId)
    .select("name email enrolledCourses")
    .populate({
      path: "enrolledCourses.course",
      select: "title price image category level teacher",
      populate: { path: "teacher", select: "name" },
    });

  let clearedCart = await Cart.findOneAndUpdate(
    { student: studentId },
    { $set: { items: [] } },
    { new: true }
  ).populate({
    path: "items.course",
    select: "title description price image",
  });

  if (!clearedCart) {
    clearedCart = { items: [] };
  }

  if (updatedStudent?.email && context.purchasedCourses.length > 0) {
    try {
      await sendCoursePurchaseConfirmationEmail(updatedStudent.email, {
        studentName: updatedStudent.name,
        courses: context.purchasedCourses,
        totalAmount: context.totalAmount,
        purchasedAt: new Date(),
      });
    } catch (emailError) {
      console.error(
        "Purchase confirmation email failed:",
        emailError?.message || emailError
      );
    }
  }

  return {
    message: "Enrollment completed successfully",
    cart: clearedCart,
    enrolledCourses: updatedStudent?.enrolledCourses || [],
    alreadyEnrolled: false,
  };
}

// Get cart contents
async function getCart(req, res) {
  try {
    const studentId = req.user._id;
    console.log("Fetching cart for student:", studentId);
    let cart = await Cart.findOne({ student: studentId }).populate({
      path: "items.course",
      select: "title description price image",
    });

    if (!cart) {
      cart = { items: [] }; // Return empty cart if none exists
    }

    res.json({
      success: true,
      message: "Cart retrieved successfully",
      data: cart,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving cart",
    });
  }
}

// Add course to cart
async function addToCart(req, res) {
  try {
    const studentId = req.user._id;
    const { courseId } = req.params;
    console.log("Adding course to cart:", courseId, "for student:", studentId);

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Prevent duplicate purchases
    const student = await Student.findById(studentId).select("enrolledCourses");
    if (
      student?.enrolledCourses?.some(
        (enrollment) => enrollment?.course?.toString() === courseId.toString()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "You already own this course",
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ student: studentId });
    if (!cart) {
      cart = new Cart({
        student: studentId,
        items: [],
      });
    }

    // Check if course is already in cart
    const isInCart = cart.items.some(
      (item) => item.course.toString() === courseId.toString()
    );

    if (isInCart) {
      return res.json({
        success: false,
        message: "Course is already in cart",
      });
    }

    // Add course to cart
    cart.items.push({
      course: courseId,
      addedAt: new Date(),
    });

    await cart.save();

    // Return populated cart
    cart = await Cart.findOne({ student: studentId }).populate({
      path: "items.course",
      select: "title description price image",
    });

    res.json({
      success: true,
      message: "Course added to cart",
      data: cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding course to cart",
    });
  }
}

// Remove course from cart
async function removeFromCart(req, res) {
  try {
    const studentId = req.user._id;
    const { courseId } = req.params;

    const cart = await Cart.findOne({ student: studentId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Remove course from items array
    cart.items = cart.items.filter(
      (item) => item.course.toString() !== courseId.toString()
    );

    await cart.save();

    res.json({
      success: true,
      message: "Course removed from cart",
      data: cart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing course from cart",
    });
  }
}

// Clear entire cart
async function clearCart(req, res) {
  try {
    const studentId = req.user._id;

    const cart = await Cart.findOne({ student: studentId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: "Cart cleared successfully",
      data: cart,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
    });
  }
}

async function updateEnrollCourses(req, res) {
  const { courseIds } = req.body || {};
  const studentId = req.user._id;
  try {
    const enrollment = await processEnrollment(studentId, courseIds, {
      gateway: "manual",
    });

    res.json({
      success: true,
      error: false,
      message: enrollment.message,
      data: {
        cart: enrollment.cart,
        enrolledCourses: enrollment.enrolledCourses,
      },
    });
  } catch (error) {
    console.log("err occured...", error);
    const statusCode = error?.statusCode || 500;
    res.status(statusCode).json({
      message: error?.message || "Could not complete enrollment",
      success: false,
      error: true,
    });
  }
}

async function createRazorpayOrder(req, res) {
  const { courseIds } = req.body || {};
  const studentId = req.user._id;

  try {
    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        error: true,
        message: "Razorpay configuration is missing on server",
      });
    }

    const checkoutContext = await buildCheckoutContext(studentId, courseIds);

    if (checkoutContext.alreadyEnrolled) {
      return res.status(200).json({
        success: true,
        error: false,
        message: "All selected courses are already enrolled",
        data: {
          orderId: null,
          keyId: process.env.RAZORPAY_KEY_ID,
          amount: 0,
          currency: RAZORPAY_CURRENCY,
          courseIds: [],
        },
      });
    }

    const amountInPaise = Math.round(checkoutContext.totalAmount * 100);

    if (amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid amount for payment",
      });
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: RAZORPAY_CURRENCY,
      receipt: `lms_${studentId}_${Date.now()}`.slice(0, 40),
      notes: {
        studentId: String(studentId),
        courseIds: checkoutContext.validCourseIds.join(","),
      },
    });

    res.status(200).json({
      success: true,
      error: false,
      message: "Razorpay order created successfully",
      data: {
        orderId: order.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        amountInRupees: checkoutContext.totalAmount,
        courseIds: checkoutContext.validCourseIds,
      },
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    const statusCode = error?.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: true,
      message: error?.message || "Unable to create payment order",
    });
  }
}

async function verifyRazorpayPayment(req, res) {
  const {
    courseIds,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body || {};

  const studentId = req.user._id;
  const orderId = razorpayOrderId || razorpay_order_id;
  const paymentId = razorpayPaymentId || razorpay_payment_id;
  const signature = razorpaySignature || razorpay_signature;

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({
      success: false,
      error: true,
      message: "Missing Razorpay payment verification fields",
    });
  }

  try {
    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        error: true,
        message: "Razorpay configuration is missing on server",
      });
    }

    const checkoutContext = await buildCheckoutContext(studentId, courseIds);

    if (checkoutContext.alreadyEnrolled) {
      return res.status(200).json({
        success: true,
        error: false,
        message: "All selected courses are already enrolled",
        data: {
          cart: { items: [] },
          enrolledCourses: checkoutContext.student.enrolledCourses || [],
        },
      });
    }

    if (
      !isValidRazorpaySignature({
        orderId,
        paymentId,
        signature,
      })
    ) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid payment signature",
      });
    }

    const payment = await razorpay.payments.fetch(paymentId);

    if (!payment || payment.order_id !== orderId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Payment details do not match the provided order",
      });
    }

    if (!["captured", "authorized"].includes(payment.status)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Payment is not captured yet",
      });
    }

    const expectedAmountInPaise = Math.round(checkoutContext.totalAmount * 100);
    if (Number(payment.amount) !== expectedAmountInPaise) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Payment amount mismatch",
      });
    }

    const enrollment = await processEnrollment(
      studentId,
      courseIds,
      {
        gateway: "razorpay",
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      },
      checkoutContext
    );

    res.status(200).json({
      success: true,
      error: false,
      message: enrollment.message,
      data: {
        cart: enrollment.cart,
        enrolledCourses: enrollment.enrolledCourses,
        payment: {
          orderId,
          paymentId,
          status: payment.status,
        },
      },
    });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);
    const statusCode = error?.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: true,
      message: error?.message || "Unable to verify payment",
    });
  }
}

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  createRazorpayOrder,
  verifyRazorpayPayment,
  updateEnrollCourses,
};
