import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/teacher/TeacherAllCourses.css";

const TeacherAllCourses = () => {
  const navigate = useNavigate();
  const [allCourses, setAllCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // "all" or "my"
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function fetchAllCourses() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/courses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAllCourses(data.data || []);
      } catch (err) {
        console.error("Error fetching all courses:", err);
      }
    }

    async function fetchMyCourses() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/teacher/courses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMyCourses(data.data || []);
      } catch (err) {
        console.error("Error fetching my courses:", err);
      }
    }

    fetchAllCourses();
    fetchMyCourses();
  }, [token]);

  const displayedCourses = activeTab === "all" ? allCourses : myCourses;

  return (
    <div className="teacher-courses-container">
      <div className="courses-header">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Courses
          </button>
          <button
            className={`tab ${activeTab === "my" ? "active" : ""}`}
            onClick={() => setActiveTab("my")}
          >
            My Courses
          </button>
        </div>
        <button
          className="add-course-btn"
          onClick={() => navigate("/teacher/courses/add")}
        >
          + Add New Course
        </button>
      </div>

      <div className="courses-grid">
        {displayedCourses.length > 0 ? (
          displayedCourses.map((course) => (
            <div key={course._id} className="course-card">
              {course.image && (
                <img
                  src={course.image}
                  alt={course.title}
                  className="course-image"
                />
              )}
              <div className="course-content">
                <h3>{course.title}</h3>
                <p className="course-description">{course.description}</p>
                <div className="course-meta">
                  <span className="course-category">{course.category}</span>
                  <span className="course-level">{course.level}</span>
                </div>
                <div className="course-footer">
                  <span className="course-price">₹{course.price}</span>
                  <button
                    className="view-details-btn"
                    onClick={() => navigate(`/teacher/courses/${course._id}`)}
                  >
                    View Details
                  </button>
                  <button
                    className="view-details-btn"
                    style={{ background: '#2337ad', marginLeft: '8px' }}
                    onClick={() => navigate(`/teacher/flashcards?courseId=${course._id}`)}
                  >
                    Flashcards
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-courses">No courses found</p>
        )}
      </div>
    </div>
  );
};

export default TeacherAllCourses;
