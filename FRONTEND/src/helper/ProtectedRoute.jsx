import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute component - Middleware for route protection
 * @param {React.ReactNode} children - Child components to render
 * @param {Array<string>} allowedRole - Array of allowed roles (e.g., ["Student", "Teacher", "Admin"])
 * @returns {React.ReactNode} - Protected route or redirect to login
 */
const ProtectedRoute = ({ children, allowedRole = [] }) => {
  const token = localStorage.getItem("token");
  
  // Redirect to login if no token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    // Decode JWT payload to extract user role
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userRole = payload.role;

    // If no specific roles are required, just verify authentication
    if (!allowedRole || allowedRole.length === 0) {
      return children;
    }

    // Check if user role is in the allowed roles array
    if (!allowedRole.includes(userRole)) {
      // Redirect to appropriate home based on actual role
      if (userRole === "Student") return <Navigate to="/student/home" replace />;
      if (userRole === "Teacher") return <Navigate to="/teacher/home" replace />;
      if (userRole === "Admin") return <Navigate to="/admin/dashboard" replace />;
      if (userRole === "SuperAdmin") return <Navigate to="/superadmin" replace />;
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (error) {
    console.error("Error decoding token:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
