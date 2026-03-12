import React, { useEffect, useState } from "react";
import "../../css/teacher/CourseDetail.css";
import { Link, useParams } from "react-router-dom";
import useLearningTimer from "../../helper/customHooks/useLearningTimer";

const CourseDetail = () => {
  const [course, setCourse] = useState({});
  const [studentId, setStudentId] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isEnroll, setIsEnroll] = useState(false);
  const [showPopUp, setShowPopUp] = useState(false);
  const { courseId } = useParams();

  // State for the new UI elements
  // 'materi' or 'komentar'
  const [activeTab, setActiveTab] = useState("materi");
  // Keep track of which chapters are open, start with first open

  const { startTimer, stopTimer, seconds } = useLearningTimer();
  useEffect(() => {
    startTimer();

    return () => {
      stopTimer();
    };
  }, []);
  const [openChapters, setOpenChapters] = useState([0]);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingMsg, setRatingMsg] = useState(null);

  useEffect(() => {
    async function getStudentProfile() {
      const token = localStorage.getItem("token");
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
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/student/courses/${courseId}`
        );
        const courseResponse = await response.json();

        if (response.ok && courseResponse.success) {
          setCourse(courseResponse.data);
          // Set default video on load
          if (courseResponse.data.video) {
            setSelectedVideo(courseResponse.data.video);
          } else if (
            courseResponse.data.chapters &&
            courseResponse.data.chapters[0] &&
            courseResponse.data.chapters[0].topics[0]
          ) {
            // If no main course video, set first topic's video
            setSelectedVideo(courseResponse.data.chapters[0].topics[0].video);
          }
        } else {
          console.error("Error fetching course:", courseResponse.message);
        }
      } catch (error) {
        console.log("err occurred...", error);
      }
    }
    getCourseById();
  }, [courseId]); // Changed dependency to courseId

  useEffect(() => {
    if (course?.students && studentId) {
      setIsEnroll(course.students.includes(studentId));
    }
  }, [course, studentId]);

  if (!course?.title) return <p>Loading...</p>; // Improved loading check

  // computed average rating from course.rating (if provided by API)
  const avgRating = course?.rating?.average || 0;
  const ratingCount = course?.rating?.count || 0;

  const handleTopicClick = (tpVideo, chIdx, tpIdx) => {
    // Logic from image: First video (ch 0, tp 0) is always viewable
    if (isEnroll || (chIdx === 0 && tpIdx === 0)) {
      if (tpVideo) {
        setSelectedVideo(tpVideo);
      }
    } else if (!isEnroll) {
      setShowPopUp(true);
    }
  };

  const toggleChapter = (chapterIndex) => {
    setOpenChapters((prevOpenChapters) => {
      const isOpen = prevOpenChapters.includes(chapterIndex);
      if (isOpen) {
        // Close it
        return prevOpenChapters.filter((idx) => idx !== chapterIndex);
      } else {
        // Open it
        return [...prevOpenChapters, chapterIndex];
      }
    });
  };

  // ----- STYLES -----
  // We define styles here to keep JSX clean
  const styles = {
    container: {
      display: "flex",
      flexDirection: "row",
      width: "100%",
      height: "100vh", // Full height
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f9f9f9",
    },
    sidebar: {
      width: "30%",
      height: "100vh",
      overflowY: "auto",
      backgroundColor: "white",
      borderRight: "1px solid #e0e0e0",
      display: "flex",
      flexDirection: "column",
    },
    sidebarTabs: {
      display: "flex",
      borderBottom: "1px solid #e0e0e0",
    },
    tab: {
      flex: 1,
      padding: "16px",
      textAlign: "center",
      cursor: "pointer",
      fontWeight: "600",
      color: "#666",
      borderBottom: "2px solid transparent",
    },
    activeTab: {
      color: "#333",
      borderBottom: "2px solid #0056d2",
    },
    chapterAccordion: {
      borderBottom: "1px solid #e0e0e0",
    },
    chapterHeader: {
      padding: "16px",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontWeight: "700",
      backgroundColor: "#f9f9f9",
    },
    topicList: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    topicItem: {
      padding: "12px 16px 12px 24px",
      cursor: "pointer",
      borderBottom: "1px solid #f0f0f0",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "14px",
      color: "#333",
    },
    activeTopicItem: {
      backgroundColor: "#e6f0ff",
      color: "#0056d2",
      fontWeight: "600",
    },
    quizLink: {
      textDecoration: "none",
      color: "inherit",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
    },
    mainContent: {
      width: "70%",
      height: "100vh",
      overflowY: "auto",
      padding: "24px",
      backgroundColor: "#ffffff",
    },
    mainHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: "#888",
      fontSize: "14px",
      marginBottom: "16px",
    },
    videoPlayer: {
      width: "100%",
      borderRadius: "8px",
      backgroundColor: "black",
    },
    videoActions: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 0",
      borderBottom: "1px solid #e0e0e0",
    },
    transcriptTab: {
      fontWeight: "600",
      color: "#333",
      cursor: "pointer",
    },
    completeButton: {
      padding: "10px 20px",
      border: "none",
      borderRadius: "6px",
      backgroundColor: "#0056d2",
      color: "white",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "15px",
    },
    contentDetails: {
      paddingTop: "24px",
    },
    notesLink: {
      display: "inline-block",
      padding: "10px 16px",
      background: "#2337ad",
      color: "white",
      borderRadius: "6px",
      textDecoration: "none",
      fontWeight: "600",
      marginTop: "16px",
    },
    // Modal Styles
    modalBackdrop: {
      width: "100%",
      height: "100%",
      position: "fixed",
      top: "0",
      left: "0",
      background: "rgba(0,0,0,0.6)",
      zIndex: 10,
    },
    modalContent: {
      background: "white",
      width: "30%",
      padding: "24px",
      margin: "12rem auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "8px",
      textAlign: "center",
    },
    modalButtonContainer: {
      display: "flex",
      gap: "10px",
      flexDirection: "column",
      width: "60%",
      marginTop: "24px",
    },
    modalEnrollLink: {
      border: "none",
      background: "rgb(35, 55, 173)",
      color: "white",
      fontSize: "18px",
      padding: "12px 24px",
      borderRadius: "5px",
      cursor: "pointer",
      textDecoration: "none",
      textAlign: "center",
    },
    modalCancelButton: {
      border: "none",
      background: "gray",
      color: "white",
      fontSize: "18px",
      padding: "12px 24px",
      borderRadius: "5px",
      cursor: "pointer",
    },
  };

  // ----- RENDER -----
  return (
    <div style={styles.container}>
      {/* ===== LEFT SIDEBAR ===== */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTabs}>
          <div
            style={{
              ...styles.tab,
              ...(activeTab === "materi" ? styles.activeTab : {}),
            }}
            onClick={() => setActiveTab("materi")}
          >
            Material
          </div>
          <div
            style={{
              ...styles.tab,
              ...(activeTab === "komentar" ? styles.activeTab : {}),
            }}
            onClick={() => setActiveTab("komentar")}
          >
            Comments
          </div>
        </div>

        {activeTab === "materi" && (
          <div className="chapters-list">
            {course.chapters && course.chapters.length > 0 ? (
              course.chapters.map((chapter, chIdx) => (
                <div key={chIdx} style={styles.chapterAccordion}>
                  <h3
                    style={styles.chapterHeader}
                    onClick={() => toggleChapter(chIdx)}
                  >
                    {chapter.title}
                    <span>{openChapters.includes(chIdx) ? "▲" : "▼"}</span>
                  </h3>
                  {openChapters.includes(chIdx) && (
                    <ul style={styles.topicList}>
                      {chapter.topics.map((topic, tpIdx) => (
                        <React.Fragment key={tpIdx}>
                          {/* Video Item */}
                          <li
                            style={{
                              ...styles.topicItem,
                              ...(selectedVideo === topic.video
                                ? styles.activeTopicItem
                                : {}),
                            }}
                            onClick={() =>
                              handleTopicClick(topic.video, chIdx, tpIdx)
                            }
                          >
                            <span>🎥</span>
                            {topic.title}
                          </li>
                          {/* Quiz Item */}
                          <li
                            style={{ ...styles.topicItem, cursor: "default" }}
                          >
                            <Link
                              to={`/student/courses/${course._id}/${chapter._id}/${topic._id}/quiz`}
                              style={styles.quizLink}
                            >
                              <span>📝</span>
                              Quiz: {topic.title}
                            </Link>
                          </li>
                        </React.Fragment>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              <p style={{ padding: "16px" }}>No chapters added yet.</p>
            )}
          </div>
        )}

        {activeTab === "komentar" && (
          <div style={{ padding: "16px" }}>
            <p>Comments feature coming soon.</p>
          </div>
        )}
      </div>

      {/* ===== RIGHT MAIN CONTENT ===== */}
      <div style={styles.mainContent}>
        {/* Video Player */}
        <video
          src={selectedVideo}
          controls
          style={styles.videoPlayer}
          key={selectedVideo} // Add key to force re-render on src change
        />

        {/* Actions Below Video */}
        <div style={styles.videoActions}>
          <span style={styles.transcriptTab}>Transcript</span>
          {/* <button style={styles.completeButton}>Mark as Complete</button> */}
        </div>

        {/* Content Details (Title, Desc, Notes) */}
        <div style={styles.contentDetails}>
          <h2 className="course-title">{course.title}</h2>
          <p className="course-description">{course.description}</p>
          {/* Rating summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 12,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              {avgRating || "—"}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    color: i < Math.round(avgRating) ? "#ffd166" : "#ddd",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <div style={{ color: "#666" }}>{ratingCount} ratings</div>
          </div>

          <div style={{ margin: "8px 0", display: "flex", gap: "8px" }}>
            <Link
              to={`/teacher/courses/${course._id}/edit`}
              style={{
                display: "inline-block",
                padding: "8px 12px",
                background: "#28a745",
                color: "white",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              ✏️ Edit Course
            </Link>
            <Link
              to={`/teacher/flashcards?courseId=${course._id}`}
              style={{
                display: "inline-block",
                padding: "8px 12px",
                background: "#2337ad",
                color: "white",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              Manage Flashcards
            </Link>
          </div>
          {/* Rating input for enrolled students */}
          {isEnroll && (
            <div style={{ marginTop: 14 }}>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>
                Rate this course
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const val = i + 1;
                  return (
                    <button
                      key={i}
                      onClick={() => setRatingValue(val)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 20,
                        color: val <= ratingValue ? "#ffd166" : "#ddd",
                      }}
                      aria-label={`Rate ${val} stars`}
                    >
                      ★
                    </button>
                  );
                })}
                <button
                  onClick={async () => {
                    if (!ratingValue) {
                      setRatingMsg("Please select a rating");
                      return;
                    }
                    setRatingSubmitting(true);
                    setRatingMsg(null);
                    try {
                      const backendUrl =
                        import.meta.env.VITE_BACKEND_URL ||
                        "http://localhost:3000";
                      const token = localStorage.getItem("token");
                      const res = await fetch(
                        `${backendUrl}/courses/${courseId}/rate`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            rating: ratingValue,
                            review: reviewText,
                          }),
                        }
                      );
                      const j = await res.json();
                      if (j.success) {
                        setRatingMsg("Thank you for your rating");
                        // update local summary
                        setCourse((c) => ({
                          ...c,
                          rating: {
                            average: j.data.average,
                            count: j.data.count,
                          },
                        }));
                      } else {
                        setRatingMsg(j.message || "Could not save rating");
                      }
                    } catch (err) {
                      console.error(err);
                      setRatingMsg("Network error");
                    } finally {
                      setRatingSubmitting(false);
                    }
                  }}
                  className="btn"
                  style={{ marginLeft: 8 }}
                >
                  {ratingSubmitting ? "Saving..." : "Submit"}
                </button>
              </div>

              <div style={{ marginTop: 8 }}>
                <textarea
                  placeholder="Leave an optional review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{ width: "100%", minHeight: 60, padding: 8 }}
                />
              </div>

              {ratingMsg && (
                <div style={{ marginTop: 8, color: "#d97706" }}>
                  {ratingMsg}
                </div>
              )}
            </div>
          )}
          {/* Notes Link (Retained as requested) */}
          {course.notes ? (
            <div style={{ margin: "16px 0" }}>
              <a
                href={course.notes}
                target="_blank"
                rel="noreferrer"
                style={styles.notesLink}
              >
                View / Download Notes (PDF)
              </a>
            </div>
          ) : null}
        </div>
      </div>

      {/* ===== ENROLLMENT POP-UP MODAL ===== */}
      {showPopUp && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContent}>
            <h2 style={{ fontSize: "1.5rem", lineHeight: "1.4" }}>
              <span>You need to enroll</span>
              <br />
              <span>to watch the video</span>
            </h2>
            <div style={styles.modalButtonContainer}>
              <Link to={``} style={styles.modalEnrollLink}>
                Enroll Now
              </Link>
              <button
                style={styles.modalCancelButton}
                onClick={() => setShowPopUp(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
