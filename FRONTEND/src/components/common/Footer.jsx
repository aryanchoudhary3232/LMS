import React from "react";
import { Link } from "react-router-dom";
import "./layout.css";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container footer-inner footer-grid">
        <div className="footer-col">
          <h4>About SeekhoBharat</h4>
          <p className="footer-about">
            SeekhoBharat is an e-learning platform focused on delivering
            high-quality courses in regional languages. We help learners
            across India access practical skills from verified teachers.
          </p>
          <small className="muted">© {new Date().getFullYear()} SeekhoBharat</small>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/courses">Courses</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Resources</h4>
          <ul className="footer-links">
            <li>
              <a href="#">Blog</a>
            </li>
            <li>
              <a href="#">Help Center</a>
            </li>
            <li>
              <a href="#">Privacy Policy</a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <address className="footer-contact">
            <div>Email: <a href="mailto:support@seekhobharat.example">support@seekhobharat.example</a></div>
            <div>Phone: +91 98765 43210</div>
            <div style={{ marginTop: 8 }}>
              <a className="social" href="#" aria-label="twitter">🐦</a>
              <a className="social" href="#" aria-label="facebook">📘</a>
              <a className="social" href="#" aria-label="linkedin">🔗</a>
            </div>
          </address>
        </div>
      </div>

      <div className="container footer-bottom">
        <div>Made for learners across India.</div>
        <div className="muted">Terms • Privacy • Contact</div>
      </div>
    </footer>
  );
};

export default Footer;
