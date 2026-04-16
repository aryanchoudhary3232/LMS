const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");
const {
	verify,
	cacheResponse,
	cacheTags,
	invalidateTagsOnSuccess,
} = require("../middleware");

// ===== ROUTER-BASED MIDDLEWARE =====
// All cart routes require authentication
router.use(verify);

// Cart routes
router.get(
	"/",
	cacheResponse({
		ttlSeconds: 90,
		namespace: "cart",
		varyByUser: true,
		tags: (req) => [cacheTags.cart(req.user?._id)],
	}),
	cartController.getCart,
);

router.post(
	"/add/:courseId",
	invalidateTagsOnSuccess((req) => [cacheTags.cart(req.user?._id)]),
	cartController.addToCart,
);

router.delete(
	"/remove/:courseId",
	invalidateTagsOnSuccess((req) => [cacheTags.cart(req.user?._id)]),
	cartController.removeFromCart,
);

router.delete(
	"/clear",
	invalidateTagsOnSuccess((req) => [cacheTags.cart(req.user?._id)]),
	cartController.clearCart,
);

router.post("/create-payment-order", cartController.createRazorpayOrder);
router.post(
	"/verify-payment",
	invalidateTagsOnSuccess((req) => [
		cacheTags.cart(req.user?._id),
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
		cacheTags.cart(req.user?._id),
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