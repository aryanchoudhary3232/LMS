import React, { useEffect, useState } from "react";
import "../css/teacher/CourseDetail.css"; 
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../features/cart/cartSlice";

// Simple star rating component
const StarRating = ({ rating }) => {
  const avg = rating && typeof rating === 'object' ? rating.average : rating;
  const count = rating && typeof rating === 'object' ? rating.count : 0;
  const num = Number(avg) || 0;
  return (
    <div className="star-rating">
      {[...Array(5)].map((_, index) => (
        <span key={index} style={{ color: index < Math.round(num) ? "#ffc107" : "#e4e5e9" }}>
          {index < Math.round(num) ? "★" : "☆"}
        </span>
      ))}
      <span className="rating-text" style={{ marginLeft: 8 }}>{num}</span>
      {count ? <small style={{ marginLeft: 6, color: '#eee' }}>({count})</small> : null}
    </div>
  );
};

const CourseDetail = () => {
  const [course, setCourse] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [isEnroll, setIsEnroll] = useState(false);
  const [activeTab, setActiveTab] = useState("description"); // New State for Tabs
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- Data Fetching ---
  useEffect(() => {
    async function getStudentProfile() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/student/profile`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setStudentId(data.data._id);
      } catch (error) {
        console.log("err occurred...", error);
      }
    }
    getStudentProfile();
  }, []);

  useEffect(() => {
    async function getCourseById() {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        // Use the general courses endpoint for public course details
        const response = await fetch(
          `${backendUrl}/courses`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const coursesResponse = await response.json();
        
        if (coursesResponse.success) {
          // Find the specific course from the list
          const foundCourse = coursesResponse.data.find(course => course._id === courseId);
          if (foundCourse) {
            setCourse(foundCourse);
          } else {
            console.error("Course not found");
          }
        }
      } catch (error) {
        console.error("Error details:", error);
      }
    }

    if (courseId) {
      getCourseById();
    }
  }, [courseId]);

  useEffect(() => {
    if (course?.students && studentId) {
      // Check if the current student is enrolled in this course
      const isStudentEnrolled = course.students.some(student => 
        (typeof student === 'string' ? student : student._id) === studentId
      );
      setIsEnroll(isStudentEnrolled);
    }
  }, [course, studentId]);

  const handleEnroll = async () => {
    // If user is not authenticated, redirect to login
    const token = localStorage.getItem("token");
    if (!token) {
      // Include return URL so user can be redirected back after login
      navigate(`/login?next=${encodeURIComponent(`/courses/${courseId}`)}`);
      return;
    }

    if (!course) {
      alert("Course data not loaded. Please try again.");
      return;
    }

    try {
      // Use Redux action to add to cart
      const result = await dispatch(addToCart(course._id)).unwrap();
      
      alert("Course added to cart successfully!");
      // Dispatch event to update navbar
      window.dispatchEvent(new Event("cartUpdated"));
      
    } catch (error) {
      // Handle the error message from the backend
      const errorMessage = error || "Course is already in cart or failed to add";
      alert(errorMessage);
    }
  };

  if (!course) {
    return (
      <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Helper to format duration if needed
  const formatDuration = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="course-detail-container">
      <div className="main-content">
        <div className="breadcrumbs">
          <Link to="/">Dashboard</Link> &gt;{" "}
          <Link to="/courses">Courses</Link> &gt;{" "}
          <span>{course.title}</span>
        </div>

        <div
          className="course-header"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${
              course.image || "/default-banner.jpg"
            })`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <h1>{course.title}</h1>
          <p>{course.description.substring(0, 100)}...</p>
          <div className="header-meta">
             <span className="badge">{course.category}</span>
             <span className="badge">{course.level}</span>
          </div>
          <StarRating rating={course.rating} />
        </div>

        <div className="course-body">
          {/* Interactive Tabs */}
          <div className="course-tabs">
            <span 
              className={`tab ${activeTab === "description" ? "active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              Description
            </span>
            <span 
              className={`tab ${activeTab === "content" ? "active" : ""}`}
              onClick={() => setActiveTab("content")}
            >
              Course content
            </span>
            <span 
              className={`tab ${activeTab === "teacher" ? "active" : ""}`}
              onClick={() => setActiveTab("teacher")}
            >
              Teacher
            </span>
            <span 
              className={`tab ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews
            </span>
          </div>

          <div className="tab-content">
            
            {/* 1. Description Tab */}
            {activeTab === "description" && (
              <div className="fade-in">
                <h3>Course Description</h3>
                <p>{course.description}</p>
                
                <h3>What you will learn</h3>
                <ul className="learning-list">
                  {/* Ideally fetch this from backend, hardcoded for now as per prev code */}
                  <li>Understand key concepts of {course.category}.</li>
                  <li>Master the basics of {course.title}.</li>
                  <li>Build real-world projects.</li>
                </ul>
              </div>
            )}

            {/* 2. Course Content Tab (Updated based on JSON) */}
            {activeTab === "content" && (
              <div className="course-curriculum fade-in">
                <h3>Course Curriculum</h3>
                <div className="total-lectures">
                  {course.chapters?.length || 0} Chapters • {course.duration || 0} Hours Total
                </div>

                {course.chapters && course.chapters.length > 0 ? (
                  course.chapters.map((chapter, index) => (
                    <div key={chapter._id || index} className="chapter-item">
                      <div className="chapter-header">
                        <h4>Chapter {index + 1}: {chapter.title}</h4>
                        <span className="chapter-meta">{chapter.topics?.length || 0} lessons</span>
                      </div>
                      
                      <ul className="chapter-topics">
                        {chapter.topics && chapter.topics.map((topic, tIndex) => (
                          <li key={topic._id || tIndex} className="topic-item">
                            <div className="topic-left">
                              {/* Icon based on content */}
                              <span className="icon">{topic.video ? "▶" : "📄"}</span>
                              <span className="topic-title">{topic.title}</span>
                            </div>
                            
                            <div className="topic-right">
                              {topic.quiz && topic.quiz.length > 0 && (
                                <span className="quiz-badge">Quiz inside</span>
                              )}
                              {!isEnroll && <span className="locked-icon">🔒</span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p>No curriculum content available.</p>
                )}
              </div>
            )}

            {/* 3. Teacher Tab */}
            {activeTab === "teacher" && (
              <div className="teacher-info fade-in">
                <h3>Instructor</h3>
                {course.teacher ? (
                  <div className="teacher-card">
                    <div className="teacher-avatar">
                      {/* Placeholder avatar logic */}
                      {course.teacher.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4>{course.teacher.name}</h4>
                      <p>{course.teacher.email}</p>
                    </div>
                  </div>
                ) : (
                  <p>No teacher information.</p>
                )}
              </div>
            )}

            {/* 4. Reviews Tab (Based on JSON ratings) */}
            {activeTab === "reviews" && (
              <div className="reviews-section fade-in">
                <h3>Student Reviews</h3>
                {course.ratings && course.ratings.length > 0 ? (
                  course.ratings.map((review) => (
                    <div key={review._id} className="review-item">
                      <div className="review-header">
                        <span className="reviewer-name">Student</span>
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="review-text">{review.review}</p>
                      <small className="review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  ))
                ) : (
                  <p>No reviews yet.</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="sidebar">
        <div className="video-preview">
          <img
            src={course.image || "/default-thumbnail.jpg"}
            alt={course.title}
          />
          <div className="overlay">
            <span>▶</span>
            <p>Preview Course</p>
          </div>
        </div>

        <div className="course-meta">
          <h2 className="price">
            {course.price ? `$${course.price}` : "Free"}
          </h2>
          <div className="course-format">
            <h4>This course includes:</h4>
            <ul>
              <li>✓ {course.chapters?.length || "0"} Chapters</li>
              <li>✓ {course.duration || "0"} Hours video</li>
              <li>✓ Full lifetime access</li>
              <li>✓ Access on mobile and TV</li>
            </ul>
          </div>

          {isEnroll ? (
            <Link
              to={`/student/courses/${courseId}`}
              className="start-course-btn"
            >
              Go to course →
            </Link>
          ) : (
            <button onClick={handleEnroll} className="enroll-now-btn">
              Enroll Course
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;