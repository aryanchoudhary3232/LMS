import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../css/admin/Admin.css";

const AdminCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      const response = await fetch(`${backendUrl}/admin/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setCourse(data.data);
        // Set default video to course intro video
        if (data.data.video) {
          setSelectedVideo(data.data.video);
        }
      } else {
        setError("Failed to fetch course details");
      }
    } catch (error) {
      setError("Network error while fetching course details");
      console.error("Error fetching course details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topicVideo) => {
    if (topicVideo) {
      setSelectedVideo(topicVideo);
    } else if (course.video) {
      setSelectedVideo(course.video);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading course details...</div>;
  }

  if (error) {
    return (
      <div className="admin-error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button
          onClick={() => navigate("/admin/courses")}
          className="admin-back-btn"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="admin-error-container">
        <h3>Course not found</h3>
        <button
          onClick={() => navigate("/admin/courses")}
          className="admin-back-btn"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="admin-course-detail-container">
      {/* Header */}
      <div className="admin-course-header">
        <button
          onClick={() => navigate("/admin/courses")}
          className="admin-back-btn"
        >
          ← Back to Courses
        </button>
        <div className="admin-course-title-section">
          <h1>{course.title}</h1>
          <p className="admin-course-subtitle">
            Admin View - Course Details & Content
          </p>
        </div>
      </div>

      <div className="admin-course-detail-layout">
        {/* Left - Video Player */}
        <div className="admin-course-main-content">
          <div className="admin-video-section">
            <h2 className="admin-current-video-title">
              {selectedVideo === course.video
                ? "Course Introduction"
                : "Topic Video"}
            </h2>

            {selectedVideo ? (
              <div className="admin-video-container">
                <video
                  src={selectedVideo}
                  controls
                  className="admin-video-player"
                  style={{
                    width: "100%",
                    height: "400px",
                    borderRadius: "8px",
                  }}
                />
              </div>
            ) : (
              <div className="admin-no-video">
                <span className="no-video-icon">🎥</span>
                <h3>No video available</h3>
                <p>This course doesn't have any video content.</p>
              </div>
            )}

            {course.description && (
              <div className="admin-course-description-section">
                <h3>Course Description</h3>
                <p>{course.description}</p>
              </div>
            )}

            {course.notes && (
              <div className="admin-course-notes">
                <h3>Course Notes</h3>
                <div className="admin-notes-content">
                  <a
                    href={course.notes}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-notes-link"
                  >
                    📄 Download Course Notes
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right - Chapters & Topics Sidebar */}
        <div className="admin-course-sidebar">
          <div className="admin-course-info-panel">
            <h3>Course Information</h3>
            <div className="admin-info-item">
              <span className="info-label">Teacher:</span>
              <span className="info-value">
                {course.teacher ? course.teacher.name : "No teacher assigned"}
              </span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Students:</span>
              <span className="info-value">
                {course.enrolledCount || 0} enrolled
              </span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Category:</span>
              <span className="info-value">
                {course.category || "Not specified"}
              </span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Level:</span>
              <span className="info-value">
                {course.level || "Not specified"}
              </span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Duration:</span>
              <span className="info-value">
                {course.duration || "Not specified"} hours
              </span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Price:</span>
              <span className="info-value">
                {course.price ? `₹${course.price}` : "Free"}
              </span>
            </div>

            {/* Course Intro Video Button */}
            {course.video && (
              <button
                onClick={() => setSelectedVideo(course.video)}
                className={`admin-intro-video-btn ${
                  selectedVideo === course.video ? "active" : ""
                }`}
              >
                🎬 Course Introduction
              </button>
            )}
          </div>

          <div className="admin-chapters-list">
            <h3>
              Course Content ({course.chapters ? course.chapters.length : 0}{" "}
              chapters)
            </h3>
            {course.chapters && course.chapters.length > 0 ? (
              course.chapters.map((chapter, chapterIndex) => (
                <div key={chapterIndex} className="admin-chapter-item">
                  <h4 className="admin-chapter-title">{chapter.title}</h4>
                  {chapter.topics && chapter.topics.length > 0 ? (
                    <ul className="admin-topics-list">
                      {chapter.topics.map((topic, topicIndex) => (
                        <li
                          key={topicIndex}
                          className={`admin-topic-item ${
                            selectedVideo === topic.video ? "active" : ""
                          }`}
                          onClick={() => handleTopicClick(topic.video)}
                        >
                          <span className="topic-icon">▶️</span>
                          {topic.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="admin-no-topics">No topics available</p>
                  )}
                </div>
              ))
            ) : (
              <p className="admin-no-chapters">No chapters available</p>
            )}
          </div>
        </div>
      </div>

      {/* Enrolled Students Section */}
      {course.enrolledStudents && course.enrolledStudents.length > 0 && (
        <div className="admin-enrolled-students-section">
          <h2>📚 Enrolled Students ({course.enrolledStudents.length})</h2>
          <div className="admin-students-grid">
            {course.enrolledStudents.map((student) => (
              <div key={student._id} className="admin-student-card">
                <div className="student-card-header">
                  <div className="student-avatar">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="student-info">
                    <h4>{student.name}</h4>
                    <p className="student-email">{student.email}</p>
                  </div>
                </div>
                <div className="student-card-details">
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <div>
                      <span className="detail-label">Enrolled:</span>
                      <span className="detail-value">
                        {student.enrolledAt
                          ? new Date(student.enrolledAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">✅</span>
                    <div>
                      <span className="detail-label">Completed Topics:</span>
                      <span className="detail-value">
                        {student.completedTopicsCount || 0}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📝</span>
                    <div>
                      <span className="detail-label">Quizzes Taken:</span>
                      <span className="detail-value">
                        {student.quizScoresCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourseDetail;
