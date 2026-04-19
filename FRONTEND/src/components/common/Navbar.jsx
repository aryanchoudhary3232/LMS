import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../common/layout.css";
import { useAuth } from "../../contexts/useAuth";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : null;

  const { logout } = useAuth();

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

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
  const toggleProfileMenu = () => setIsProfileOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const coursesPath = !token
    ? "/courses"
    : role === "Admin"
      ? "/admin/courses"
      : role === "Student"
        ? "/student/courses"
        : "/teacher/courses";

  const dashboardPath =
    role === "Admin"
      ? "/admin/dashboard"
      : role === "SuperAdmin"
        ? "/superadmin"
        : role === "Teacher"
          ? "/teacher/sidebar/dashboard"
          : "/student/sidebar/dashboard";

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout(setIsMenuOpen);
  };

  return (
    <header className="site-navbar" style={{ width: "100%" }}>
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
          Seekho
        </Link>

        {/* Hamburger Icon (Visible on Mobile) */}
        <div className="hamburger" onClick={toggleMenu}>
          <span className={isMenuOpen ? "bar active" : "bar"}></span>
          <span className={isMenuOpen ? "bar active" : "bar"}></span>
          <span className={isMenuOpen ? "bar active" : "bar"}></span>
        </div>

        {/* Navigation Links */}
        <nav className={`nav-links ${isMenuOpen ? "active" : ""}`}>
          <div className="nav-center">
            <Link to="/" className="nav-item nav-pill" onClick={closeMenu}>
              Home
            </Link>

            {role !== "SuperAdmin" && (
              <Link
                to={coursesPath}
                className="nav-item nav-pill"
                onClick={closeMenu}
              >
                Courses
              </Link>
            )}
          </div>

          <div className="nav-right">
            {!token && (
              <Link to="/login" className="nav-item action" onClick={closeMenu}>
                Login / Register
              </Link>
            )}

            {token && role === "Student" && (
              <Link
                to="/cart"
                className="nav-item cart-link nav-pill"
                onClick={closeMenu}
              >
                Cart
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </Link>
            )}

            {token && (
              <div className="profile-menu" ref={profileRef}>
                <button
                  type="button"
                  className="profile-button"
                  onClick={toggleProfileMenu}
                  aria-haspopup="true"
                  aria-expanded={isProfileOpen}
                >
                  P
                </button>
                {isProfileOpen && (
                  <div className="profile-dropdown">
                    <Link
                      to={dashboardPath}
                      className="profile-dropdown-item"
                      onClick={() => {
                        setIsProfileOpen(false);
                        closeMenu();
                      }}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={handleLogout}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
