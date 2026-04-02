import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthToken } from "../api/axios";
import AuthContext from "./auth-context";

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    setRole(localStorage.getItem("role"));
  }, []);

  const login = async (formData, setFormData) => {
    const result = {
      success: false,
      requiresVerification: false,
      verificationStatus: null,
      message: "",
    };
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok && data.success) {
        // Store token and role
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.data.role);
        setToken(data.token);
        setRole(data.data.role);
        setAuthToken(data.token);
        result.success = true;

        setFormData({
          name: "",
          email: "",
          password: "",
          role: "",
        });

        // Navigate based on role
        if (data.data.role === "Teacher") {
          try {
            const statusResponse = await fetch(
              `${backendUrl}/teacher/verification/status`,
              {
                headers: { Authorization: `Bearer ${data.token}` },
              }
            );
            const statusData = await statusResponse.json();
            const status = statusData?.data?.verificationStatus;
            if (status && status !== "Verified") {
              result.requiresVerification = true;
              result.verificationStatus = status;
              navigate("/teacher/upload-qualification");
              return result;
            }
            navigate("/teacher/home");
            return result;
          } catch (statusError) {
            console.error("Error fetching teacher verification status:", statusError);
            navigate("/teacher/home");
            return result;
          }
        } else if (data.data.role === "Admin") {
          navigate("/admin/dashboard");
        } else if (data.data.role === "SuperAdmin") {
          navigate("/superadmin");
        } else if (data.data.role === "Student") {
          navigate("/student/home");
        } else {
          navigate("/");
        }
        return result;
      }

      if (data?.code === "TEACHER_VERIFICATION_PENDING") {
        result.requiresVerification = true;
        result.verificationStatus = data.verificationStatus || null;
        result.message = data.message || "Verification is not done yet.";
        return result;
      }

      result.message = data.message || "Invalid credentials";
      alert("Login Error: " + result.message);
      return result;
    } catch (error) {
      console.log("Login error:", error);
      result.message = "Network error during login. Please try again.";
      alert(result.message);
      return result;
    }
  };

  const logout = (setIsMenuOpen) => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
    setIsMenuOpen(false); // Close menu on logout
  };

  return (
    <AuthContext.Provider value={{ login, logout, token, role }}>
      {children}
    </AuthContext.Provider>
  );
};
