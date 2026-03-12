import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../../css/student/Assignments.css";
import useLearningTimer from "../../../helper/customHooks/useLearningTimer";

const ViewSubmission = () => {
  const { assignmentId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Track learning time automatically
  const { isActive, formattedTime } = useLearningTimer();

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    fetchSubmission();
  }, [assignmentId]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/assignments/student/submission/${assignmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSubmission(data.data);
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="view-loading">Loading submission...</div>;
  }

  if (!submission) {
    return (
      <div className="view-error">
        <p>Submission not found</p>
        <button
          onClick={() => navigate("/student/assignments")}
          className="btn-back"
        >
          Back to Assignments
        </button>
      </div>
    );
  }

  const assignment = submission.assignment;
  const grade = submission.grade;

  return (
    <div className="view-submission-container">
      <div className="view-header">
        <button
          onClick={() => navigate("/student/assignments")}
          className="btn-back"
        >
          ← Back to Assignments
        </button>
        <h2>📋 Submission Details</h2>
      </div>

      <div className="assignment-info-card">
        <h3>{assignment.title}</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Course:</span>
            <span className="value">{assignment.course?.title}</span>
          </div>
          <div className="info-item">
            <span className="label">Max Marks:</span>
            <span className="value">{assignment.maxMarks}</span>
          </div>
          <div className="info-item">
            <span className="label">Submitted:</span>
            <span className="value">
              {new Date(submission.submittedAt).toLocaleString()}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Status:</span>
            <span className={`badge badge-${submission.status}`}>
              {submission.isLate && "⏰ Late - "}
              {submission.status === "graded" ? "✅ Graded" : "📤 Submitted"}
            </span>
          </div>
        </div>
      </div>

      {grade && grade.marks !== null && (
        <div className="grade-card">
          <h3>📊 Your Grade</h3>
          <div className="grade-score-display">
            <span className="score">{grade.marks}</span>
            <span className="separator">/</span>
            <span className="max-score">{assignment.maxMarks}</span>
          </div>
          <div className="percentage">
            {((grade.marks / assignment.maxMarks) * 100).toFixed(1)}%
          </div>

          {grade.feedback && (
            <div className="feedback-section">
              <h4>Teacher's Feedback:</h4>
              <p className="feedback-text">{grade.feedback}</p>
            </div>
          )}

          <p className="graded-date">
            Graded on: {new Date(grade.gradedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {!grade ||
        (grade.marks === null && (
          <div className="pending-grade">
            <p>⏳ Your submission is pending grading</p>
          </div>
        ))}

      <div className="submission-content-card">
        <h3>Your Submission</h3>

        {submission.textContent && (
          <div className="text-submission">
            <h4>Text Content:</h4>
            <div className="text-content-box">{submission.textContent}</div>
          </div>
        )}

        {submission.attachments && submission.attachments.length > 0 && (
          <div className="attachments-section">
            <h4>Uploaded Files:</h4>
            <ul className="attachments-list">
              {submission.attachments.map((file, index) => (
                <li key={index}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    📎 {file.filename}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSubmission;
