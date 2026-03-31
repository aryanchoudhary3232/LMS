const express = require("express");
const router = express.Router();

const authController = require('../controller/authController');
const { verify } = require('../middleware');

// ============================================
//  PUBLIC ROUTES (No authentication required)
// ============================================
router.post("/register", authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);

// ============================================
//  PROTECTED ROUTES (Authentication required)
// ============================================

router.post('/logout', verify, authController.logout);

// Profile Management - Works for all roles (Student, Teacher, Admin)
router.get('/profile', verify, authController.getProfile);      // Get current user profile
router.put('/profile', verify, authController.updateProfile);   // Update profile (name only)
router.put('/change-password', verify, authController.changePassword); // Change password

module.exports = router;
