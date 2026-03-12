import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Use Link for internal navigation
import "../css/Home.css"; // Ensure this path matches your folder structure
// If your file is in 'student/home.jsx', use "../../css/Home.css"
import heroImage from "../assets/hero-banner.png"


import {
  FaStar,
  FaUserFriends,
  FaBook,
  FaRegPlayCircle,
  FaRegListAlt,
} from "react-icons/fa";

function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: "--",
    instructors: "--",
    videos: "--",
    materials: "--",
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  const fetchCourses = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      
      // Try to fetch from /courses endpoint first, fallback to /student/courses
      let response = await fetch(`${backendUrl}/courses`);
      let data;
      
      // If /courses endpoint fails, try /student/courses
      if (!response.ok) {
        response = await fetch(`${backendUrl}/student/courses`);
      }
      
      data = await response.json();

      if (data.success) {
        // Sort courses by rating (highest first) and get top 3
        const sortedCourses = data.data.sort((a, b) => {
          const aRating = a.rating?.average || 0;
          const bRating = b.rating?.average || 0;
          return bRating - aRating;
        });
        setCourses(sortedCourses.slice(0, 3));
      } else {
        console.error("Failed to fetch courses:", data.message);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      // try a few likely endpoints for stats
      let response = await fetch(`${backendUrl}/stats`);
      if (!response.ok) {
        response = await fetch(`${backendUrl}/dashboard/stats`);
      }

      const data = await response.json();

      // Accept a few possible shapes for returned data
      if (data && (data.success || data.students || data.totalStudents)) {
        const payload = data.data || data;
        setStats({
          students: payload.students || payload.studentCount || payload.totalStudents || "0",
          instructors:
            payload.instructors || payload.teacherCount || payload.totalInstructors || "0",
          videos: payload.videos || payload.videoCount || payload.totalVideos || "0",
          materials:
            payload.materials || payload.materialCount || payload.totalMaterials || "0",
        });
      } else {
        console.error("Failed to fetch stats:", data?.message || data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="home-container">
      
      <main>
        {/* --- Hero Section --- */}
        <section className="hero-section">
          <div className="hero-content">
            <h1>Welcome to SeekhoBharat</h1>
            <p>Learn anytime, anywhere — courses for every learner.</p>
            <div className="hero-buttons">
               {/* Updated buttons to Links for better navigation */}
              <Link to="/courses" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="/courses" className="btn btn-secondary">
                Browse all Courses
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img
              src={heroImage}
              alt="Students Learning"
              // Optional: Add onError fallback if you have a real image later
            />
          </div>
        </section>

        {/* --- Stats Bar --- */}
        <section className="stats-bar">
          <div className="stat-item">
            <FaUserFriends className="stat-icon" />
            <div className="stat-text">
              <strong>{statsLoading ? "Loading..." : stats.students}</strong>
              <span>Students</span>
            </div>
          </div>
          <div className="stat-item">
            <FaUserFriends className="stat-icon" />
            <div className="stat-text">
              <strong>{statsLoading ? "--" : stats.instructors}</strong>
              <span>Instructors</span>
            </div>
          </div>
          <div className="stat-item">
            <FaRegPlayCircle className="stat-icon" />
            <div className="stat-text">
              <strong>{statsLoading ? "--" : stats.videos}</strong>
              <span>Videos</span>
            </div>
          </div>
          <div className="stat-item">
            <FaRegListAlt className="stat-icon" />
            <div className="stat-text">
              <strong>{statsLoading ? "--" : stats.materials}</strong>
              <span>Materials</span>
            </div>
          </div>
        </section>

        {/* --- Courses Section --- */}
        <section className="courses-section">
          <div className="courses-header">
            <h2>Popular Courses</h2>
            <Link to="/courses" className="view-all-link">
              View All &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="loading-message" style={{textAlign: 'center', padding: '2rem'}}>
                Loading amazing courses...
            </div>
          ) : (
            <div className="courses-grid">
              {courses.length > 0 ? (
                courses.map((course, index) => (
                  <div key={course._id || index} className="course-card">
                    {/* Course Image */}
                    <img
                      src={
                        course.image ||
                        `https://via.placeholder.com/350x200.png?text=${encodeURIComponent(
                          course.title
                        )}`
                      }
                      alt={course.title}
                      className="course-image"
                      onError={(e) =>
                        (e.target.src =
                          "https://via.placeholder.com/350x200.png?text=No+Image")
                      }
                    />

                    <div className="course-content">
                      {/* Rating (Static Fallback if API doesn't have it yet) */}
                      <div className="course-rating">
                        <FaStar style={{ color: "#f39c12" }} /> 
                        {course.rating?.average || "0"} ({course.rating?.count || "0"} reviews)
                      </div>

                      <h3 className="course-title">{course.title}</h3>
                      
                      <p className="course-instructor">
                        Member: {course.teacher ? course.teacher.name : "Top Instructor"}
                      </p>

                      <div className="course-meta">
                        <span>
                          <FaBook /> {course.lessons || "12"} Lessons
                        </span>
                        <span>
                          <FaUserFriends /> {course.studentCount || "100+"} Students
                        </span>
                      </div>

                      <div className="course-footer">
                        {/* Display Price */}
                        <span className="course-price">
                           {course.price ? `₹${course.price}` : "Free"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-courses">No courses found.</div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;