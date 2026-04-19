const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");
const {
	verify,
	cacheTags,
	invalidateTagsOnSuccess,
} = require("../middleware");

// ===== ROUTER-BASED MIDDLEWARE =====
// All cart routes require authentication
router.use(verify);

// Cart routes
router.get("/", cartController.getCart);

router.post("/add/:courseId", cartController.addToCart);

router.delete("/remove/:courseId", cartController.removeFromCart);

router.delete("/clear", cartController.clearCart);

router.post("/create-payment-order", cartController.createRazorpayOrder);
router.post(
	"/verify-payment",
	invalidateTagsOnSuccess((req) => [
		cacheTags.student(req.user?._id),
		cacheTags.coursesPublic,
		cacheTags.statsPublic,
		cacheTags.adminDashboard,
		cacheTags.adminCourses,
		cacheTags.superadminOverview,
		cacheTags.superadminRevenue,
		cacheTags.superadminAnalytics,
	]),
	cartController.verifyRazorpayPayment,
);

router.put(
	"/update-enroll-courses",
	invalidateTagsOnSuccess((req) => [
		cacheTags.student(req.user?._id),
		cacheTags.coursesPublic,
		cacheTags.statsPublic,
		cacheTags.adminDashboard,
		cacheTags.adminCourses,
		cacheTags.superadminOverview,
		cacheTags.superadminRevenue,
		cacheTags.superadminAnalytics,
	]),
	cartController.updateEnrollCourses,
);

module.exports = router;