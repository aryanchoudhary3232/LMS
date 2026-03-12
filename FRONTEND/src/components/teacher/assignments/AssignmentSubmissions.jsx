import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../../css/teacher/Assignments.css";

const AssignmentSubmissions = () => {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: "", feedback: "" });
  const navigate = useNavigate();

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/assignments/teacher/${assignmentId}/submissions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAssignment(data.data.assignment);
        setSubmissions(data.data.submissions);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/assignments/teacher/grade/${gradingSubmission._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gradeForm),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Submission graded successfully!");
        setGradingSubmission(null);
        setGradeForm({ marks: "", feedback: "" });
        fetchSubmissions();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      alert("Failed to grade submission");
    }
  };

  const openGradeModal = (submission) => {
    setGradingSubmission(submission);
    setGradeForm({
      marks: submission.grade?.marks || "",
      feedback: submission.grade?.feedback || "",
    });
  };

  if (loading) {
    return <div className="submissions-loading">Loading submissions...</div>;
  }

  if (!assignment) {
    return <div className="submissions-error">Assignment not found</div>;
  }

  return (
    <div className="submissions-container">
      <div className="submissions-header">
        <button
          onClick={() => navigate("/teacher/assignments")}
          className="btn-back"
        >
          ← Back to Assignments
        </button>
        <h2>📋 {assignment.title} - Submissions</h2>
      </div>

      <div className="assignment-info">
        <div className="info-item">
          <span className="label">Course:</span>
          <span className="value">{assignment.course?.title}</span>
        </div>
        <div className="info-item">
          <span className="label">Max Marks:</span>
          <span className="value">{assignment.maxMarks}</span>
        </div>
        <div className="info-item">
          <span className="label">Due Date:</span>
          <span className="value">
            {new Date(assignment.dueDate).toLocaleString()}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Total Submissions:</span>
          <span className="value">{submissions.length}</span>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="no-submissions">
          <p>📭 No submissions yet</p>
        </div>
      ) : (
        <div className="submissions-list">
          {submissions.map((submission) => (
            <div key={submission._id} className="submission-card">
              <div className="submission-header">
                <div className="student-info">
                  <h3>👤 {submission.student?.name}</h3>
                  <p className="student-email">{submission.student?.email}</p>
                </div>
                <div className="submission-badges">
                  {submission.isLate && (
                    <span className="badge badge-late">Late</span>
                  )}
                  {submission.status === "graded" ? (
                    <span className="badge badge-graded">Graded</span>
                  ) : (
                    <span className="badge badge-pending">Pending</span>
                  )}
                </div>
              </div>

              <div className="submission-body">
                <div className="submission-meta">
                  <p>
                    <strong>Submitted:</strong>{" "}
                    {new Date(submission.submittedAt).toLocaleString()}
                  </p>
                </div>

                {submission.textContent && (
                  <div className="text-content">
                    <h4>Text Submission:</h4>
                    <p>{submission.textContent}</p>
                  </div>
                )}

                {submission.attachments &&
                  submission.attachments.length > 0 && (
                    <div className="attachments">
                      <h4>Attachments:</h4>
                      <ul>
                        {submission.attachments.map((file, index) => (
                          <li key={index}>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              📎 {file.filename}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {submission.grade?.marks !== null && (
                  <div className="grade-display">
                    <h4>Grade:</h4>
                    <p className="marks">
                      {submission.grade.marks} / {assignment.maxMarks}
                    </p>
                    {submission.grade.feedback && (
                      <div className="feedback">
                        <strong>Feedback:</strong>
                        <p>{submission.grade.feedback}</p>
                      </div>
                    )}
                    <p className="graded-at">
                      Graded on:{" "}
                      {new Date(submission.grade.gradedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="submission-actions">
                <button
                  onClick={() => openGradeModal(submission)}
                  className="btn-grade"
                >
                  {submission.status === "graded"
                    ? "✏️ Edit Grade"
                    : "✅ Grade"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Grade Submission</h3>
            <p className="student-name">
              Student: {gradingSubmission.student?.name}
            </p>

            <form onSubmit={handleGradeSubmit}>
              <div className="form-group">
                <label>Marks (out of {assignment.maxMarks})</label>
                <input
                  type="number"
                  value={gradeForm.marks}
                  onChange={(e) =>
                    setGradeForm({ ...gradeForm, marks: e.target.value })
                  }
                  required
                  min="0"
                  max={assignment.maxMarks}
                />
              </div>

              <div className="form-group">
                <label>Feedback (max 2000 characters)</label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) =>
                    setGradeForm({ ...gradeForm, feedback: e.target.value })
                  }
                  rows="4"
                  maxLength={2000}
                  placeholder="Provide feedback to the student..."
                />
                <small style={{ color: '#666' }}>{gradeForm.feedback?.length || 0}/2000</small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Submit Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentSubmissions;
