import React, { useState } from "react";
import "../css/Login.css";
import { useAuth } from "../contexts/useAuth";
import Navbar from "../components/common/Navbar";

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [forgotStep, setForgotStep] = useState(null); // null | 'email' | 'otp' | 'reset' | 'success'

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const [forgotData, setForgotData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
    resetToken: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "name":
        if (!value.trim()) {
          error = "Name is required";
        } else if (value.trim().length < 3) {
          error = "Name must be at least 3 characters";
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = "Name can only contain letters and spaces";
        }
        break;

      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;

      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters";
        } else if (!/(?=.*[a-z])/.test(value)) {
          error = "Password must contain at least one lowercase letter";
        } else if (!/(?=.*[A-Z])/.test(value)) {
          error = "Password must contain at least one uppercase letter";
        } else if (!/(?=.*\d)/.test(value)) {
          error = "Password must contain at least one number";
        }
        break;

      case "role":
        if (!value) {
          error = "Please select a role";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleOnChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({
        ...errors,
        [name]: error,
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched({
      ...touched,
      [name]: true,
    });

    const error = validateField(name, value);
    setErrors({
      ...errors,
      [name]: error,
    });
  };

  const handleSubmitSignUp = async (e) => {
    e.preventDefault();

    setTouched({
      name: true,
      email: true,
      password: true,
      role: true,
    });

    const newErrors = {};
    newErrors.name = validateField("name", formData.name);
    newErrors.email = validateField("email", formData.email);
    newErrors.password = validateField("password", formData.password);
    newErrors.role = validateField("role", formData.role);

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Registration response:", data);

      if (response.ok && data.success) {
        alert(
          formData.role === "Teacher"
            ? "Registration successful! Please login to complete your profile."
            : "Registration successful! Please login with your credentials."
        );
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "",
        });
        setErrors({});
        setTouched({});
        setIsSignup(false);
      } else {
        alert("Registration Error: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.log("Registration error:", error);
      alert("Network error during registration. Please try again.");
    }
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    await login(formData, setFormData);
  };

  // ============================================
  // FORGOT PASSWORD HANDLERS
  // ============================================

  const resetForgotState = () => {
    setForgotStep(null);
    setForgotData({ email: "", otp: "", newPassword: "", confirmPassword: "", resetToken: "" });
    setForgotError("");
    setForgotLoading(false);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotError("");

    if (!forgotData.email.trim()) {
      setForgotError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotData.email)) {
      setForgotError("Please enter a valid email address");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${backendUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotData.email }),
      });
      const data = await res.json();

      if (data.success) {
        setForgotStep("otp");
      } else {
        setForgotError(data.message || "Failed to send OTP");
      }
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotError("");

    if (!forgotData.otp.trim() || forgotData.otp.length !== 6) {
      setForgotError("Please enter the 6-digit OTP");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${backendUrl}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotData.email, otp: forgotData.otp }),
      });
      const data = await res.json();

      if (data.success) {
        setForgotData({ ...forgotData, resetToken: data.resetToken });
        setForgotStep("reset");
      } else {
        setForgotError(data.message || "Invalid OTP");
      }
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError("");

    if (!forgotData.newPassword || forgotData.newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters");
      return;
    }

    if (forgotData.newPassword !== forgotData.confirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${backendUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotData.email,
          newPassword: forgotData.newPassword,
          resetToken: forgotData.resetToken,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setForgotStep("success");
      } else {
        setForgotError(data.message || "Failed to reset password");
      }
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ============================================
  // FORGOT PASSWORD STEP INDICATOR
  // ============================================

  const ForgotStepIndicator = () => {
    const steps = [
      { key: "email", label: "Email" },
      { key: "otp", label: "Verify" },
      { key: "reset", label: "Reset" },
    ];
    const currentIdx = steps.findIndex((s) => s.key === forgotStep);

    return (
      <div className="forgot-steps">
        {steps.map((step, i) => (
          <React.Fragment key={step.key}>
            <div
              className={`forgot-step-dot ${i <= currentIdx ? "active" : ""
                } ${i < currentIdx ? "completed" : ""}`}
            >
              {i < currentIdx ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`forgot-step-line ${i < currentIdx ? "active" : ""
                  }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // ============================================
  // RENDER FORGOT PASSWORD FORMS
  // ============================================

  const renderForgotPassword = () => {
    if (forgotStep === "success") {
      return (
        <div className="auth-form forgot-form">
          <div className="forgot-success-icon">✓</div>
          <h2 className="form-title">Password<br />Reset!</h2>
          <p className="form-subtitle">
            Your password has been reset successfully. You can now login with your new password.
          </p>
          <button
            type="button"
            className="submit-btn"
            onClick={resetForgotState}
          >
            Back to Login
          </button>
        </div>
      );
    }

    return (
      <div className="auth-form forgot-form">
        <h2 className="form-title">
          {forgotStep === "email" && <>Forgot<br />Password?</>}
          {forgotStep === "otp" && <>Verify<br />Code</>}
          {forgotStep === "reset" && <>New<br />Password</>}
        </h2>
        <p className="form-subtitle">
          {forgotStep === "email" &&
            "Enter your email and we'll send you a verification code"}
          {forgotStep === "otp" &&
            `Enter the 6-digit code sent to ${forgotData.email}`}
          {forgotStep === "reset" &&
            "Create a new password for your account"}
        </p>

        <ForgotStepIndicator />

        {forgotError && (
          <div className="forgot-error">{forgotError}</div>
        )}

        {/* Step 1: Email */}
        {forgotStep === "email" && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <input
                type="email"
                value={forgotData.email}
                onChange={(e) =>
                  setForgotData({ ...forgotData, email: e.target.value })
                }
                placeholder="email@example.com"
                className="form-input"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="submit-btn"
              disabled={forgotLoading}
            >
              {forgotLoading ? (
                <span className="forgot-spinner" />
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {forgotStep === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <div className="otp-input-group">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-input"
                    value={forgotData.otp[i] || ""}
                    autoFocus={i === 0}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const newOtp =
                        forgotData.otp.substring(0, i) +
                        val +
                        forgotData.otp.substring(i + 1);
                      setForgotData({ ...forgotData, otp: newOtp });
                      if (val && i < 5) {
                        document.getElementById(`otp-${i + 1}`)?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Backspace" &&
                        !forgotData.otp[i] &&
                        i > 0
                      ) {
                        document.getElementById(`otp-${i - 1}`)?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData
                        .getData("text")
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setForgotData({ ...forgotData, otp: pasted });
                      const nextIdx = Math.min(pasted.length, 5);
                      document.getElementById(`otp-${nextIdx}`)?.focus();
                    }}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="submit-btn"
              disabled={forgotLoading}
            >
              {forgotLoading ? (
                <span className="forgot-spinner" />
              ) : (
                "Verify OTP"
              )}
            </button>
            <p className="forgot-resend">
              Didn't receive the code?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setForgotData({ ...forgotData, otp: "" });
                  setForgotStep("email");
                }}
              >
                Resend
              </a>
            </p>
          </form>
        )}

        {/* Step 3: New Password */}
        {forgotStep === "reset" && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <input
                type="password"
                value={forgotData.newPassword}
                onChange={(e) =>
                  setForgotData({
                    ...forgotData,
                    newPassword: e.target.value,
                  })
                }
                placeholder="New Password"
                className="form-input"
                autoFocus
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                value={forgotData.confirmPassword}
                onChange={(e) =>
                  setForgotData({
                    ...forgotData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm Password"
                className="form-input"
              />
            </div>
            <button
              type="submit"
              className="submit-btn"
              disabled={forgotLoading}
            >
              {forgotLoading ? (
                <span className="forgot-spinner" />
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        <p className="signup-link">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              resetForgotState();
            }}
          >
            ← Back to Login
          </a>
        </p>
      </div>
    );
  };

  return (
    <div className="login-page">
      <Navbar />
      <div className="login-container">
        <div className="login-content">
          {/* Left Panel - Form Panel */}
          <div className="form-panel">
            <div className="form-content">
              {/* Brand Logo */}
              <div className="brand-logo">
                <div className="brand-icon">S</div>
                <span className="brand-name">SeekhoBharat</span>
              </div>

              {/* Forgot Password Flow */}
              {forgotStep && renderForgotPassword()}

              {/* Sign In Form */}
              {!forgotStep && !isSignup && (
                <form onSubmit={handleSubmitLogin} className="auth-form">
                  <h2 className="form-title">Holla,<br />Welcome Back</h2>
                  <p className="form-subtitle">Hey, welcome back to your special place</p>

                  <div className="form-group">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleOnChange}
                      placeholder="email@example.com"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleOnChange}
                      placeholder="••••••••••"
                      className="form-input"
                    />
                  </div>

                  <div className="form-options">
                    <label className="remember-me">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>
                    <a
                      href="#"
                      className="forgot-link"
                      onClick={(e) => {
                        e.preventDefault();
                        setForgotStep("email");
                      }}
                    >
                      Forgot Password?
                    </a>
                  </div>

                  <button type="submit" className="submit-btn">
                    Sign In
                  </button>

                  <p className="signup-link">
                    Don't have an account?
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSignup(true);
                        setErrors({});
                        setTouched({});
                        setFormData({
                          name: "",
                          email: "",
                          password: "",
                          role: "",
                        });
                      }}
                    >
                      Sign Up
                    </a>
                  </p>
                </form>
              )}

              {/* Sign Up Form */}
              {!forgotStep && isSignup && (
                <form onSubmit={handleSubmitSignUp} className="auth-form">
                  <h2 className="form-title">Create<br />Account</h2>
                  <p className="form-subtitle">Join us and start your learning journey</p>

                  <div className="form-group">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleOnChange}
                      onBlur={handleBlur}
                      placeholder="Full Name"
                      required
                      className={`form-input ${errors.name && touched.name ? "error" : ""
                        }`}
                    />
                    {errors.name && touched.name && (
                      <span className="error-message">{errors.name}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleOnChange}
                      onBlur={handleBlur}
                      placeholder="email@example.com"
                      required
                      className={`form-input ${errors.email && touched.email ? "error" : ""
                        }`}
                    />
                    {errors.email && touched.email && (
                      <span className="error-message">{errors.email}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleOnChange}
                      onBlur={handleBlur}
                      placeholder="Create Password"
                      required
                      className={`form-input ${errors.password && touched.password ? "error" : ""
                        }`}
                    />
                    {errors.password && touched.password && (
                      <span className="error-message">{errors.password}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleOnChange}
                      onBlur={handleBlur}
                      required
                      className={`form-select ${errors.role && touched.role ? "error" : ""
                        }`}
                    >
                      <option value="">Choose your role...</option>
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                    </select>
                    {errors.role && touched.role && (
                      <span className="error-message">{errors.role}</span>
                    )}
                  </div>

                  <button type="submit" className="submit-btn">
                    Sign Up
                  </button>

                  <p className="signup-link">
                    Already have an account?
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSignup(false);
                        setErrors({});
                        setTouched({});
                        setFormData({
                          name: "",
                          email: "",
                          password: "",
                          role: "",
                        });
                      }}
                    >
                      Sign In
                    </a>
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Right Panel - Illustration Panel */}
          <div className="info-panel">
            <div className="info-content">
              <h1 className="brand-title">
                {forgotStep
                  ? "Reset Your Password"
                  : isSignup
                    ? "Start Learning Today"
                    : "Welcome Back!"}
              </h1>
              <p className="brand-subtitle">
                {forgotStep
                  ? "We'll help you get back into your account"
                  : isSignup
                    ? "Join thousands of learners on SeekhoBharat"
                    : "Your learning journey continues here"}
              </p>

              {/* Illustration Placeholder */}
              <div className="illustration-placeholder">
                <span className="icon">
                  {forgotStep ? "🔐" : "🎓"}
                </span>
                <span className="text">
                  {forgotStep ? "Secure Reset" : "Learn & Grow"}
                </span>
              </div>

              {!forgotStep && (
                <button
                  className="switch-btn"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setErrors({});
                    setTouched({});
                    setFormData({
                      name: "",
                      email: "",
                      password: "",
                      role: "",
                    });
                  }}
                >
                  {isSignup ? "Sign In Instead" : "Create Account"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
