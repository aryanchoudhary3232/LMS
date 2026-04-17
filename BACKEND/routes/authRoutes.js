const express = require("express");
const router = express.Router();

const authController = require("../controller/authController");
const {
	verify,
	createRateLimiter,
	invalidateTagsOnSuccess,
	cacheTags,
} = require("../middleware");

const authIpLimiter = createRateLimiter({
	keyPrefix: "rl:auth:ip",
	windowSeconds: 60,
	max: 40,
});

const loginLimiter = createRateLimiter({
	keyPrefix: "rl:login:ip",
	windowSeconds: 60,
	max: 10,
	message: "Too many login attempts. Please try again in a minute.",
});

const loginEmailLimiter = createRateLimiter({
	keyPrefix: "rl:login:email",
	windowSeconds: 300,
	max: 8,
	keyGenerator: (req) => (req.body?.email || req.ip || "unknown").toLowerCase(),
	message: "Too many login attempts for this account. Please try again later.",
});

const forgotPasswordLimiter = createRateLimiter({
	keyPrefix: "rl:forgot-password",
	windowSeconds: 300,
	max: 5,
	keyGenerator: (req) => (req.body?.email || req.ip || "unknown").toLowerCase(),
	message: "Too many password reset requests. Please wait before trying again.",
});

const verifyOtpLimiter = createRateLimiter({
	keyPrefix: "rl:verify-otp",
	windowSeconds: 300,
	max: 10,
	keyGenerator: (req) => (req.body?.email || req.ip || "unknown").toLowerCase(),
	message: "Too many OTP attempts. Please request a new OTP.",
});

// ============================================
//  PUBLIC ROUTES (No authentication required)
// ============================================
router.post("/register", authIpLimiter, authController.register);
router.post("/login", authIpLimiter, loginLimiter, loginEmailLimiter, authController.login);
router.post("/forgot-password", authIpLimiter, forgotPasswordLimiter, authController.forgotPassword);
router.post("/verify-otp", authIpLimiter, verifyOtpLimiter, authController.verifyOtp);
router.post("/reset-password", authIpLimiter, authController.resetPassword);

// ============================================
//  PROTECTED ROUTES (Authentication required)
// ============================================

router.post("/logout", verify, authController.logout);

// Profile Management - Works for all roles (Student, Teacher, Admin)
router.get("/profile", verify, authController.getProfile); // Get current user profile
router.put(
	"/profile",
	verify,
	invalidateTagsOnSuccess((req) => [
		cacheTags.student(req.user?._id),
		cacheTags.teacher(req.user?._id),
		cacheTags.adminUsers,
		cacheTags.superadminUsers,
	]),
	authController.updateProfile,
); // Update profile (name only)
router.put(
	"/change-password",
	verify,
	invalidateTagsOnSuccess((req) => [
		cacheTags.student(req.user?._id),
		cacheTags.teacher(req.user?._id),
		cacheTags.adminUsers,
		cacheTags.superadminUsers,
	]),
	authController.changePassword,
); // Change password

module.exports = router;
