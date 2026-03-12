const Cart = require("../models/Cart");
const Course = require("../models/Course");
const Student = require("../models/Student");

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
    if (student?.enrolledCourses?.some((id) => id.toString() === courseId.toString())) {
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

  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: true,
      message: "No courses supplied for enrollment",
    });
  }

  try {
    const uniqueCourseIds = [...new Set(courseIds.map((id) => id?.toString()))].filter(Boolean);

    if (uniqueCourseIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid course identifiers provided",
      });
    }

    const enrollementObjects = uniqueCourseIds.map(id => ({
      course : id,
      enrolledAt: new Date(),
      avgQuizScore: 0,
      completedQuizzes: 0,
      progress: 0
    }));


    await Student.findByIdAndUpdate(
      studentId,
      {
        // $addToSet: {
        //   enrolledCourses: {
        //     $each: uniqueCourseIds,
        //   },
        // },

        $push: {
          enrolledCourses: {
            $each: enrollementObjects,
          },
        },
      },
      { new: true }
    );

    await Course.updateMany(
      { _id: { $in: uniqueCourseIds } },
      {
        $addToSet: { students: studentId },
      }
    );

    const updatedStudent = await Student.findById(studentId)
      .select("name email enrolledCourses")
      .populate({
        path: "enrolledCourses",
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

    res.json({
      success: true,
      error: false,
      message: "Enrollment completed successfully",
      data: {
        cart: clearedCart,
        enrolledCourses: updatedStudent?.enrolledCourses || [],
      },
    });
  } catch (error) {
    console.log("err occured...", error);
    res.status(500).json({
      message: error?.message || "Could not complete enrollment",
      success: false,
      error: true,
    });
  }
}

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  updateEnrollCourses,
};
