import React from "react";
import { Link } from "react-router-dom";
import "../common/layout.css";

const Header = () => {
  return (
    <section className="site-header">
      <div className="container header-inner">
        <h1 className="site-title">Welcome to SeekhoBharat</h1>
        <p className="site-sub">Learn anytime, anywhere — courses for every learner.</p>
        <Link to="/student/courses" className="btn primary">
          Explore Courses
        </Link>
      </div>
    </section>
  );
};

export default Header;
