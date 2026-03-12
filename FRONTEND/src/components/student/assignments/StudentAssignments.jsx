import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../../css/student/Assignments.css";
import useLearningTimer from "../../../helper/customHooks/useLearningTimer";

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  
  // Track learning time automatically
  const { isActive, formattedTime } = useLearningTimer();

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    fetchAssignments();
  }, [filter]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url =
        filter === "all"
          ? `${BACKEND_URL}/assignments/student/list`
          : `${BACKEND_URL}/assignments/student/list?status=${filter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setAssignments(data.data);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (assignment) => {
    if (assignment.submissionStatus.submitted) {
      if (assignment.submissionStatus.grade?.marks !== null) {
        return <span className="badge badge-graded">✅ Graded</span>;
      }
      return <span className="badge badge-submitted">📤 Submitted</span>;
    } else if (assignment.submissionStatus.isOverdue) {
      return <span className="badge badge-overdue">⏰ Overdue</span>;
    } else {
      return <span className="badge badge-pending">📝 Pending</span>;
    }
  };

  const getDaysLeft = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diff < 0) return "Overdue";
    if (diff === 0) return "Due Today";
    if (diff === 1) return "1 day left";
    return `${diff} days left`;
  };

  if (loading) {
    return <div className="assignments-loading">Loading assignments...</div>;
  }

  return (
    <div className="student-assignments-container">
      <div className="assignments-header">
        <h2>📚 My Assignments</h2>
      </div>

      <div className="assignments-filters">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "pending" ? "active" : ""}
          onClick={() => setFilter("pending")}
        >
          Pending
        </button>
        <button
          className={filter === "submitted" ? "active" : ""}
          onClick={() => setFilter("submitted")}
        >
          Submitted
        </button>
        <button
          className={filter === "graded" ? "active" : ""}
          onClick={() => setFilter("graded")}
        >
          Graded
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="no-assignments">
          <p>📭 No assignments found</p>
        </div>
      ) : (
        <div className="assignments-grid">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="assignment-card">
              <div className="card-header">
                <h3>{assignment.title}</h3>
                {getStatusBadge(assignment)}
              </div>

              <div className="card-body">
                <p className="course-name">
                  📚 <strong>{assignment.course?.title}</strong>
                </p>
                {assignment.chapter && (
                  <p className="chapter-name">📖 {assignment.chapter}</p>
                )}
                <p className="description">{assignment.description}</p>

                <div className="assignment-meta">
                  <div className="meta-item">
                    <span className="label">Max Marks:</span>
                    <span className="value">{assignment.maxMarks}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">Due:</span>
                    <span className="value">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  {!assignment.submissionStatus.submitted && (
                    <div className="meta-item time-left">
                      <span className="label">⏰</span>
                      <span className="value urgent">
                        {getDaysLeft(assignment.dueDate)}
                      </span>
                    </div>
                  )}
                </div>

                {assignment.submissionStatus.submitted && (
                  <div className="submission-info">
                    <p className="submitted-at">
                      ✅ Submitted on:{" "}
                      {new Date(
                        assignment.submissionStatus.submittedAt
                      ).toLocaleString()}
                    </p>
                    {assignment.submissionStatus.grade?.marks !== null && (
                      <div className="grade-display">
                        <p className="grade-score">
                          Grade: {assignment.submissionStatus.grade.marks} /{" "}
                          {assignment.maxMarks}
                        </p>
                        {assignment.submissionStatus.grade.feedback && (
                          <p className="grade-feedback">
                            💬 {assignment.submissionStatus.grade.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="card-actions">
                {assignment.submissionStatus.submitted ? (
                  <button
                    onClick={() =>
                      navigate(`/student/assignments/${assignment._id}/view`)
                    }
                    className="btn-view"
                  >
                    👁️ View Submission
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      navigate(`/student/assignments/${assignment._id}/submit`)
                    }
                    className="btn-submit-assignment"
                  >
                    📤 Submit Assignment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
