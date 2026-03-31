const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Admin = require("../models/Admin");
const Otp = require("../models/Otp");
const { sendOtpEmail } = require("../utils/sendEmail");

// 🔹 Register User (Student / Teacher / Admin)
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.json({
        message: "Name, email, password, and role are required",
        success: false,
        error: true,
      });
    }

    // ✅ Check if user already exists
    let existingUser =
      (await Student.findOne({ email })) ||
      (await Teacher.findOne({ email })) ||
      (await Admin.findOne({ email }));

    if (existingUser) {
      return res.json({
        message: "User already exists with this email",
        success: false,
        error: true,
      });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser;
    if (role === "Student") {
      newUser = new Student({ name, email, password: hashedPassword, role });
    } else if (role === "Teacher") {
      newUser = new Teacher({ name, email, password: hashedPassword, role });
    } else if (role === "Admin") {
      newUser = new Admin({ name, email, password: hashedPassword, role });
    } else if (role === "SuperAdmin") {
      newUser = new Admin({ name, email, password: hashedPassword, role: "SuperAdmin" });
    } else {
      return res.json({
        message: "Invalid role provided",
        success: false,
        error: true,
      });
    }

    const savedUser = await newUser.save();

    res.json({
      message: `${role} registered successfully`,
      data: savedUser,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error during registration",
    });

    const admin = await Admin.findOne({ email });
    const student = await Student.findOne({ email });
    const teacher = await Teacher.findOne({ email });

    if (!admin && !student && !teacher) {
      res.json({
        message: "User does not exist.",
        success: false,
        error: true,
      });
    }
  }
}

// 🔹 Login Controller
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        message: "Email and password are required",
        success: false,
        error: true,
      });
    }

    // ✅ Try finding user in all roles
    let user =
      (await Admin.findOne({ email })) ||
      (await Teacher.findOne({ email })) ||
      (await Student.findOne({ email }));

    if (!user) {
      return res.json({
        message: "User does not exist",
        success: false,
        error: true,
      });
    }

    // ✅ Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        message: "Incorrect password",
        success: false,
        error: true,
      });
    }

    //  Generate token
    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role,
        email: user.email,
      },
      "aryan123"
    );

    // Inside login function, before sending response...

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Clear time
    let lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;

    if (lastLoginDate) {
      lastLoginDate = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());

      const diffTime = Math.abs(today - lastLoginDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Login is consecutive (yesterday)
        user.streak += 1;
      } else if (diffDays > 1) {
        // Streak broken
        user.streak = 1;
      }
      // If diffDays === 0 (same day), do nothing
    } else {
      // First login ever
      user.streak = 1;
    }

    // Update best streak
    if (user.streak > (user.bestStreak || 0)) {
      user.bestStreak = user.streak;
    }

    user.lastLogin = now;
    await user.save();

    // ... proceed to send response

    res.json({
      message: "Login successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login",
      success: false,
      error: true,
    });
  }
}

// 🔹 Logout (stateless JWT)
async function logout(req, res) {
  try {
    const { _id, role } = req.user || {};

    // Best-effort audit of logout time without blocking response
    let Model = null;
    if (role === "Student") Model = Student;
    else if (role === "Teacher") Model = Teacher;
    else if (role === "Admin" || role === "SuperAdmin") Model = Admin;

    if (_id && Model) {
      Model.findByIdAndUpdate(_id, { lastLogout: new Date() }).catch(() => {
        // Do not fail logout if auditing fails
      });
    }

    res.json({
      message: "Logged out successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Server error during logout",
      success: false,
      error: true,
    });
  }
}

// ============================================
// 🔹 PROFILE MANAGEMENT FUNCTIONS
// ============================================

/**
 * Get Profile - Retrieves the current user's profile data
 * Works for all roles (Student, Teacher, Admin) using JWT payload
 * @route GET /auth/profile
 */
async function getProfile(req, res) {
  try {
    const { _id, role } = req.user;

    // Select the appropriate model based on user role
    let user = null;
    if (role === "Student") {
      user = await Student.findById(_id).select("-password");
    } else if (role === "Teacher") {
      user = await Teacher.findById(_id).select("-password");
    } else if (role === "Admin") {
      user = await Admin.findById(_id).select("-password");
    }

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        error: true,
      });
    }

    res.json({
      message: "Profile fetched successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      message: "Server error while fetching profile",
      success: false,
      error: true,
    });
  }
}

/**
 * Update Profile - Updates user's display name
 * Email is read-only and cannot be changed to maintain account integrity
 * @route PUT /auth/profile
 */
async function updateProfile(req, res) {
  try {
    const { _id, role } = req.user;
    const { name } = req.body;

    // Validate name field
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        message: "Name is required and cannot be empty",
        success: false,
        error: true,
      });
    }

    // Select the appropriate model based on user role
    let Model;
    if (role === "Student") {
      Model = Student;
    } else if (role === "Teacher") {
      Model = Teacher;
    } else if (role === "Admin") {
      Model = Admin;
    } else {
      return res.status(400).json({
        message: "Invalid role",
        success: false,
        error: true,
      });
    }

    // Update only the name field (email is read-only)
    const updatedUser = await Model.findByIdAndUpdate(
      _id,
      { name: name.trim() },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        error: true,
      });
    }

    res.json({
      message: "Profile updated successfully",
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      message: "Server error while updating profile",
      success: false,
      error: true,
    });
  }
}

/**
 * Change Password - Allows user to change their password
 * Requires current password verification before setting new password
 * @route PUT /auth/change-password
 */
async function changePassword(req, res) {
  try {
    const { _id, role } = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // ✅ Validate all required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Current password, new password, and confirm password are required",
        success: false,
        error: true,
      });
    }

    // ✅ Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match",
        success: false,
        error: true,
      });
    }

    // ✅ Validate new password length (minimum 6 characters)
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
        success: false,
        error: true,
      });
    }

    // Select the appropriate model based on user role
    let user = null;
    if (role === "Student") {
      user = await Student.findById(_id);
    } else if (role === "Teacher") {
      user = await Teacher.findById(_id);
    } else if (role === "Admin") {
      user = await Admin.findById(_id);
    }

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        error: true,
      });
    }

    // ✅ Verify current password is correct
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: "Current password is incorrect",
        success: false,
        error: true,
      });
    }

    // ✅ Prevent using the same password as the new one
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be the same as current password",
        success: false,
        error: true,
      });
    }

    // ✅ Hash the new password and save
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.json({
      message: "Password changed successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      message: "Server error while changing password",
      success: false,
      error: true,
    });
  }
}

// ============================================
// 🔹 FORGOT PASSWORD FUNCTIONS
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || "aryan123";

async function findUserByEmail(email) {
  return (
    (await Student.findOne({ email })) ||
    (await Teacher.findOne({ email })) ||
    (await Admin.findOne({ email }))
  );
}

function getModelForRole(role) {
  if (role === "Student") return Student;
  if (role === "Teacher") return Teacher;
  if (role === "Admin") return Admin;
  return null;
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        success: false,
        error: true,
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        message: "No account found with this email address",
        success: false,
        error: true,
      });
    }

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email });

    const otp = crypto.randomInt(100000, 999999).toString();
    await Otp.create({ email, otp });

    await sendOtpEmail(email, otp);

    res.json({
      message: "OTP sent to your email",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "Failed to send OTP. Please try again.",
      success: false,
      error: true,
    });
  }
}

async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
        success: false,
        error: true,
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        message: "No account found with this email address",
        success: false,
        error: true,
      });
    }

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
        success: false,
        error: true,
      });
    }

    // Generate a short-lived reset token (5 minutes)
    const resetToken = jwt.sign(
      { email, purpose: "password-reset" },
      JWT_SECRET,
      { expiresIn: "5m" }
    );

    // Clean up the used OTP
    await Otp.deleteMany({ email });

    res.json({
      message: "OTP verified successfully",
      resetToken,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      message: "Failed to verify OTP. Please try again.",
      success: false,
      error: true,
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, newPassword, resetToken } = req.body;

    if (!email || !newPassword || !resetToken) {
      return res.status(400).json({
        message: "Email, new password, and reset token are required",
        success: false,
        error: true,
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
        success: false,
        error: true,
      });
    }

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return res.status(400).json({
        message: "Reset token is invalid or expired. Please request a new OTP.",
        success: false,
        error: true,
      });
    }

    if (decoded.email !== email || decoded.purpose !== "password-reset") {
      return res.status(400).json({
        message: "Invalid reset token",
        success: false,
        error: true,
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        message: "No account found with this email address",
        success: false,
        error: true,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      message: "Password reset successfully. You can now login.",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Failed to reset password. Please try again.",
      success: false,
      error: true,
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
