import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../common/layout.css";
import { useAuth } from "../../contexts/useAuth";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : null;

  const {logout} = useAuth()

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Update cart count when cart changes
  useEffect(() => {
    const updateCartCount = async () => {
      if (!token || role !== "Student") {
        setCartCount(0);
        return;
      }

      try {
        const response = await fetch(`${backendUrl}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (data.success && data.data && data.data.items) {
          setCartCount(data.data.items.length);
        } else {
          setCartCount(0);
        }
      } catch (err) {
        console.error("Error fetching cart count:", err);
        setCartCount(0);
      }
    };

    updateCartCount();

    // Listen for custom events that signal cart updates
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, [token, role, backendUrl]);

  // Helper to close menu when a link is clicked
  const closeMenu = () => setIsMenuOpen(false);

  // Toggle function
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="site-navbar" style={{ width: '100%' }}>
      <div className="container nav-inner">
        <Link
          to={
            !role
              ? "/"
              : role === "Admin"
              ? "/admin/dashboard"
              : role === "SuperAdmin"
              ? "/superadmin"
              : role === "Teacher"
              ? "/teacher/home"
              : "/student/home"
          }
          className="brand"
          onClick={closeMenu}
        >
          SeekhoBharat
        </Link>

        {/* Hamburger Icon (Visible on Mobile) */}
        <div className="hamburger" onClick={toggleMenu}>
          <span className={isMenuOpen ? "bar active" : "bar"}></span>
          <span className={isMenuOpen ? "bar active" : "bar"}></span>
          <span className={isMenuOpen ? "bar active" : "bar"}></span>
        </div>

        {/* Navigation Links */}
        <nav className={`nav-links ${isMenuOpen ? "active" : ""}`}>
          {role === "SuperAdmin" && (
            <Link to={"/superadmin"} className="nav-item" onClick={closeMenu}>
              Dashboard
            </Link>
          )}
          {role === "Teacher" && (
            <Link to={"/teacher/sidebar/dashboard"} className="nav-item" onClick={closeMenu}>
              Dashboard
            </Link>
          )}
          {role === "Student" && (
            <Link to={"/student/sidebar/dashboard"} className="nav-item" onClick={closeMenu}>
              Dashboard
            </Link>
          )}

          {role !== "SuperAdmin" && (
            <Link
              to={
                !token
                  ? "/courses"
                  : role === "Admin"
                  ? "/admin/courses"
                  : role === "Student"
                  ? "/student/courses"
                  : "/teacher/courses"
              }
              className="nav-item"
              onClick={closeMenu}
            >
              Courses
            </Link>
          )}

          {/* Assignments Link for Teacher and Student */}
          {role === "Teacher" && (
            <Link to="/teacher/assignments" className="nav-item" onClick={closeMenu}>
              Assignments
            </Link>
          )}
          {role === "Student" && (
            <Link to="/student/assignments" className="nav-item" onClick={closeMenu}>
              Assignments
            </Link>
          )}

          {token && role === "Student" && (
            <Link to="/cart" className="nav-item cart-link" onClick={closeMenu}>
              Cart
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </Link>
          )}

          {token ? (
            // when logged in show Sign Out and role if available
            <>
              {role && (
                <span className="nav-item role-badge">
                  {role}
                </span>
              )}
              <button className="nav-item action" onClick={() => logout(setIsMenuOpen)}>
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-item action" onClick={closeMenu}>
              Login / Register
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
