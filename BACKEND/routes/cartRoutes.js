const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");
const { verify } = require("../middleware");

// ===== ROUTER-BASED MIDDLEWARE =====
// All cart routes require authentication
router.use(verify);

// Cart routes
router.get("/", cartController.getCart);
router.post("/add/:courseId", cartController.addToCart);
router.delete("/remove/:courseId", cartController.removeFromCart);
router.delete("/clear", cartController.clearCart);
router.put('/update-enroll-courses', cartController.updateEnrollCourses)

module.exports = router;