import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useLearningTimer from "../../../helper/customHooks/useLearningTimer";
import "../../../css/student/Assignments.css";

const SubmitAssignment = () => {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [textContent, setTextContent] = useState("");
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Track learning time automatically
  const { isActive, formattedTime } = useLearningTimer();

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    fetchAssignmentDetails();
  }, [assignmentId]);

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // We need to get assignment from the list
      const response = await fetch(`${BACKEND_URL}/assignments/student/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        const found = data.data.find((a) => a._id === assignmentId);
        if (found) {
          setAssignment(found);

          // Check if already submitted
          if (found.submissionStatus.submitted) {
            alert("You have already submitted this assignment!");
            navigate("/student/assignments");
          }
        } else {
          alert("Assignment not found");
          navigate("/student/assignments");
        }
      } else {
        console.error("Failed to fetch assignments:", data.message);
        alert("Failed to load assignment. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching assignment:", error);
      alert("Error loading assignment. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxFileSize = 10 * 1024 * 1024; // 10MB per file
    const maxFiles = 10;
    
    const oversizedFiles = selectedFiles.filter(f => f.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      setErrors(prev => ({ ...prev, files: 'Each file must be less than 10MB' }));
      e.target.value = '';
      return;
    }
    
    if (selectedFiles.length > maxFiles) {
      setErrors(prev => ({ ...prev, files: `Maximum ${maxFiles} files allowed` }));
      e.target.value = '';
      return;
    }
    
    setErrors(prev => ({ ...prev, files: '' }));
    setFiles(selectedFiles);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Check if at least one submission method is provided
    if (!textContent.trim() && files.length === 0) {
      newErrors.submission = 'Please provide either text content or upload files';
    }
    
    // Text content validation
    if (textContent && textContent.length > 10000) {
      newErrors.textContent = 'Text content must be less than 10000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("textContent", textContent);

      files.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch(
        `${BACKEND_URL}/assignments/student/submit/${assignmentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Assignment submitted successfully!");
        navigate("/student/assignments");
      } else {
        alert(data.message || "Failed to submit assignment");
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      alert("Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="submit-loading">Loading assignment...</div>;
  }

  if (!assignment) {
    return <div className="submit-error">Assignment not found</div>;
  }

  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = now > dueDate;

  return (
    <div className="submit-assignment-container">
      <div className="submit-header">
        <button
          onClick={() => navigate("/student/assignments")}
          className="btn-back"
        >
          ← Back
        </button>
        <h2>📤 Submit Assignment</h2>
      </div>

      <div className="assignment-details">
        <h3>{assignment.title}</h3>
        <p className="course-name">📚 {assignment.course?.title}</p>

        <div className="details-grid">
          <div className="detail-item">
            <span className="label">Max Marks:</span>
            <span className="value">{assignment.maxMarks}</span>
          </div>
          <div className="detail-item">
            <span className="label">Due Date:</span>
            <span className={`value ${isOverdue ? "overdue" : ""}`}>
              {dueDate.toLocaleString()}
            </span>
          </div>
        </div>

        {isOverdue && (
          <div className="overdue-warning">
            ⚠️ This assignment is overdue.{" "}
            {assignment.allowLateSubmission
              ? "Late submissions are allowed."
              : "Late submissions are not allowed!"}
          </div>
        )}

        <div className="assignment-description">
          <h4>Description:</h4>
          <p>{assignment.description}</p>
        </div>

        {assignment.instructions && (
          <div className="assignment-instructions">
            <h4>Instructions:</h4>
            <p>{assignment.instructions}</p>
          </div>
        )}

        {assignment.attachments && assignment.attachments.length > 0 && (
          <div
            className="reference-files"
            style={{
              backgroundColor: "#f8f9fa",
              padding: "20px",
              borderRadius: "8px",
              marginTop: "20px",
              border: "2px solid #e9ecef",
            }}
          >
            <h4 style={{ color: "#2337AD", marginBottom: "15px" }}>
              📎 Assignment Files from Teacher
            </h4>
            <p
              style={{
                color: "#6c757d",
                marginBottom: "12px",
                fontSize: "0.9rem",
              }}
            >
              Download and review these files before submitting your work:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {assignment.attachments.map((file, index) => (
                <li key={index} style={{ marginBottom: "10px" }}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 16px",
                      backgroundColor: "#fff",
                      border: "1px solid #dee2e6",
                      borderRadius: "6px",
                      textDecoration: "none",
                      color: "#212529",
                      transition: "all 0.2s ease",
                      fontWeight: "500",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#e7f3ff";
                      e.currentTarget.style.borderColor = "#2337AD";
                      e.currentTarget.style.transform = "translateX(5px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#fff";
                      e.currentTarget.style.borderColor = "#dee2e6";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>📄</span>
                    <span style={{ flex: 1 }}>
                      {file.filename || `File ${index + 1}`}
                    </span>
                    <span style={{ color: "#2337AD", fontSize: "0.85rem" }}>
                      ⬇️ Download
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="submission-form">
        <h3>Your Submission</h3>

        {errors.submission && (
          <div className="error-text" style={{ color: '#dc3545', marginBottom: '16px', padding: '10px', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
            {errors.submission}
          </div>
        )}

        {(assignment.submissionType === "text" ||
          assignment.submissionType === "both") && (
          <div className="form-group">
            <label>Text Content (max 10000 characters)</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows="8"
              placeholder="Type your answer here..."
              required={assignment.submissionType === "text"}
              maxLength={10000}
              style={{ borderColor: errors.textContent ? '#dc3545' : undefined }}
            />
            <small style={{ color: '#666' }}>{textContent.length}/10000 characters</small>
            {errors.textContent && <span style={{ color: '#dc3545', fontSize: '12px', display: 'block' }}>{errors.textContent}</span>}
          </div>
        )}

        {(assignment.submissionType === "file" ||
          assignment.submissionType === "both") && (
          <div className="form-group">
            <label>Upload Files (max 10 files, 10MB each)</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.png,.zip"
              required={assignment.submissionType === "file"}
            />
            {errors.files && <span style={{ color: '#dc3545', fontSize: '12px', display: 'block' }}>{errors.files}</span>}
            {files.length > 0 && (
              <div className="selected-files">
                <p>Selected files:</p>
                <ul>
                  {files.map((file, index) => (
                    <li key={index}>
                      📎 {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/student/assignments")}
            className="btn-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              submitting || (isOverdue && !assignment.allowLateSubmission)
            }
            className="btn-submit"
          >
            {submitting ? "Submitting..." : "Submit Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitAssignment;
