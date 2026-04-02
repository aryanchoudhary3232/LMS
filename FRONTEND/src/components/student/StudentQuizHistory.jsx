import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../css/student/QuizHistory.css";

const StudentQuizHistory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const backendUrl =
          import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

        const response = await fetch(`${backendUrl}/student/quiz-submissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to load quiz history");
        }

        setItems(data.data || []);
      } catch (err) {
        setError(err.message || "Unable to load quiz history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const summary = useMemo(() => {
    const totalAttempts = items.reduce(
      (sum, item) => sum + (item.attempts || 0),
      0,
    );
    const avgScore = items.length
      ? Math.round(
          items.reduce((sum, item) => {
            const score = parseInt(
              (item.averageScore || "0").toString().replace("%", ""),
              10,
            );
            return sum + (Number.isNaN(score) ? 0 : score);
          }, 0) / items.length,
        )
      : 0;

    return {
      totalCourses: items.length,
      totalAttempts,
      averageScore: `${avgScore}%`,
    };
  }, [items]);

  if (loading) {
    return (
      <div className="quiz-history-page">
        <div className="quiz-history-loading">Loading quiz history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-history-page">
        <div className="quiz-history-error">
          <h3>Unable to load quiz history</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-history-page">
      <div className="quiz-history-hero">
        <div>
          <h2>Past Quizzes</h2>
          <p>Review your quiz attempts and track your progress.</p>
        </div>
        <div className="quiz-history-summary">
          <div className="quiz-summary-card">
            <span>Courses</span>
            <strong>{summary.totalCourses}</strong>
          </div>
          <div className="quiz-summary-card">
            <span>Attempts</span>
            <strong>{summary.totalAttempts}</strong>
          </div>
          <div className="quiz-summary-card">
            <span>Avg Score</span>
            <strong>{summary.averageScore}</strong>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="quiz-history-empty">
          <h3>No quiz attempts yet</h3>
          <p>Start a course quiz to see your history here.</p>
        </div>
      ) : (
        <div className="quiz-history-grid">
          {items.map((item) => (
            <div
              className="quiz-history-card"
              key={item.courseId || item.courseTitle}
            >
              <div className="quiz-history-card-header">
                <div>
                  <h3>{item.courseTitle || "Course"}</h3>
                  <p>{item.attempts || 0} attempts</p>
                </div>
                <div className="quiz-history-score">
                  <span>Avg</span>
                  <strong>{item.averageScore || "0%"}</strong>
                </div>
              </div>

              <div className="quiz-history-meta">
                <div>
                  <span>Latest Score</span>
                  <strong>{item.latestScore || "0%"}</strong>
                </div>
                <div>
                  <span>Last Attempt</span>
                  <strong>
                    {item.lastAttemptAt
                      ? new Date(item.lastAttemptAt).toLocaleDateString()
                      : "—"}
                  </strong>
                </div>
              </div>

              <div className="quiz-history-actions">
                {item.courseId ? (
                  <Link
                    to={`/student/courses/${item.courseId}`}
                    className="quiz-history-link"
                  >
                    Open course
                  </Link>
                ) : (
                  <span className="quiz-history-muted">Course unavailable</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentQuizHistory;
