import React from "react";
import "../../css/teacher/Home.css";
import { Link } from "react-router-dom";
import TeacherVerificationStatus from "./TeacherVerificationStatus";

function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <header className="hero">
        <h2>Welcome to SeekhoBharat</h2>
        <p>Learn anytime, anywhere with our courses.</p>
        <Link to="/teacher/courses" className="btn">
          Explore Courses
        </Link>
      </header>

      {/* Verification Status Widget */}
      <section className="verification-section">
        <TeacherVerificationStatus />
      </section>

      {/* Courses Preview */}
      <section className="courses-preview">
        <h2>Popular Courses</h2>
        <div className="courses-grid">
          <div className="course-card">
            <img
              alt="Course 1"
            />
            <h3>Web Development</h3>
            <p>Learn HTML, CSS, JavaScript and React.</p>
          </div>
          <div className="course-card">
            <img
              alt="Course 2"
            />
            <h3>Data Science</h3>
            <p>Learn Python, Pandas, ML and AI basics.</p>
          </div>
          <div className="course-card">
            <img
              alt="Course 3"
            />
            <h3>Mobile Development</h3>
            <p>Learn Flutter & React Native for apps.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
