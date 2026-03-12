import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../css/admin/Admin.css";

const AdminTeacherDetail = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    fetchTeacherDetails();
  }, [teacherId]);

  const fetchTeacherDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/admin/teachers/${teacherId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setTeacher(data.data);
      } else {
        alert("Error: " + data.message);
        navigate("/admin/users");
      }
    } catch (error) {
      console.error("Error fetching teacher details:", error);
      alert("Failed to load teacher details");
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/admin/teachers/${teacherId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(
          `Teacher deleted successfully! ${data.data.deletedCoursesCount} courses were also removed.`
        );
        navigate("/admin/users");
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
      alert("Failed to delete teacher");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleApproveTeacher = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/admin/teachers/${teacherId}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notes: approvalNotes }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Teacher verification approved successfully!");
        setShowApproveModal(false);
        fetchTeacherDetails(); // Refresh data
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error approving teacher:", error);
      alert("Failed to approve teacher");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectTeacher = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/admin/teachers/${teacherId}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notes: rejectionNotes }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Teacher verification rejected.");
        setShowRejectModal(false);
        fetchTeacherDetails(); // Refresh data
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error rejecting teacher:", error);
      alert("Failed to reject teacher");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Verified":
        return "#10b981";
      case "Rejected":
        return "#ef4444";
      case "Pending":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Verified":
        return "✅";
      case "Rejected":
        return "❌";
      case "Pending":
        return "⏳";
      default:
        return "❓";
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading teacher details...</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="admin-error">
        <h3>Teacher not found</h3>
        <button onClick={() => navigate("/admin/users")} className="btn-back">
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="admin-teacher-detail">
      <div className="detail-header">
        <button onClick={() => navigate("/admin/users")} className="btn-back">
          ← Back to Users
        </button>
        <h2>Teacher Review</h2>
      </div>

      <div className="detail-content">
        {/* Teacher Info Card */}
        <div className="info-card">
          <div className="card-header">
            <h3>👨‍🏫 Teacher Information</h3>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-delete-teacher"
            >
              🗑️ Delete Teacher
            </button>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Name:</label>
              <span>{teacher.name}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{teacher.email}</span>
            </div>
            <div className="info-item">
              <label>Role:</label>
              <span className="badge badge-teacher">Teacher</span>
            </div>
            <div className="info-item">
              <label>Total Courses:</label>
              <span className="badge badge-count">
                {teacher.courses?.length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="info-card">
          <div className="card-header">
            <h3>📋 Verification Status</h3>
          </div>

          <div className="verification-info">
            <div className="status-display">
              <span className="status-icon">
                {getStatusIcon(teacher.verificationStatus)}
              </span>
              <span
                className="status-badge-large"
                style={{
                  background: getStatusColor(teacher.verificationStatus),
                }}
              >
                {teacher.verificationStatus}
              </span>
            </div>

            {/* Approve/Reject Buttons */}
            {teacher.verificationStatus === "Pending" &&
              teacher.qualificationDoc?.url && (
                <div className="verification-actions">
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="btn-approve"
                  >
                    ✅ Approve Verification
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="btn-reject"
                  >
                    ❌ Reject Verification
                  </button>
                </div>
              )}

            {teacher.verificationNotes && (
              <div className="notes-section">
                <label>Admin Feedback:</label>
                <p className="notes-text">{teacher.verificationNotes}</p>
              </div>
            )}

            {teacher.qualificationDoc?.url ? (
              <div className="document-section">
                <label>Qualification Document:</label>
                <div className="doc-info">
                  <div className="doc-details">
                    <p>
                      📄{" "}
                      {teacher.qualificationDoc.format?.toUpperCase() ||
                        "Document"}
                    </p>
                    <p className="doc-size">
                      {teacher.qualificationDoc.bytes
                        ? `${(teacher.qualificationDoc.bytes / 1024).toFixed(
                            2
                          )} KB`
                        : "Unknown size"}
                    </p>
                    {teacher.qualificationDoc.uploadedAt && (
                      <p className="doc-date">
                        Uploaded:{" "}
                        {new Date(
                          teacher.qualificationDoc.uploadedAt
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <a
                    href={teacher.qualificationDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-view-doc"
                  >
                    📎 View Document
                  </a>
                </div>
              </div>
            ) : (
              <div className="no-document">
                <p>❌ No qualification document uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Courses Card */}
        <div className="info-card">
          <div className="card-header">
            <h3>📚 Created Courses ({teacher.courses?.length || 0})</h3>
          </div>

          {teacher.courses && teacher.courses.length > 0 ? (
            <div className="courses-list">
              {teacher.courses.map((course) => (
                <div key={course._id} className="course-item">
                  {course.thumbnail && (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="course-thumbnail-small"
                    />
                  )}
                  <div className="course-info">
                    <h4>{course.title}</h4>
                    <p>{course.description?.substring(0, 100)}...</p>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/courses/${course._id}`)}
                    className="btn-view-course"
                  >
                    View →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-courses">
              <p>No courses created yet</p>
            </div>
          )}
        </div>

        {/* Assessment Section */}
        <div className="info-card assessment-card">
          <div className="card-header">
            <h3>⚖️ Admin Assessment</h3>
          </div>

          <div className="assessment-content">
            <div className="assessment-criteria">
              <h4>Review Checklist:</h4>
              <ul>
                <li>✓ Valid qualification document submitted</li>
                <li>✓ Professional email and profile information</li>
                <li>✓ Course content quality (if applicable)</li>
                <li>✓ Compliance with platform policies</li>
              </ul>
            </div>

            <div className="assessment-actions">
              <p className="warning-text">
                ⚠️ <strong>Warning:</strong> Deleting this teacher will
                permanently remove:
              </p>
              <ul className="deletion-impact">
                <li>Teacher account and profile</li>
                <li>
                  All {teacher.courses?.length || 0} course(s) created by this
                  teacher
                </li>
                <li>Course enrollments and student progress</li>
              </ul>
              <p className="recommendation">
                Consider rejecting verification instead of deletion if possible.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⚠️ Confirm Teacher Deletion</h3>
            <p>
              Are you sure you want to delete <strong>{teacher.name}</strong>?
            </p>
            <div className="modal-warning">
              <p>This will permanently delete:</p>
              <ul>
                <li>Teacher account</li>
                <li>{teacher.courses?.length || 0} course(s)</li>
                <li>All associated data</li>
              </ul>
              <p className="danger-text">⚠️ This action cannot be undone!</p>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-cancel"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeacher}
                className="btn-confirm-delete"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete Teacher"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Verification Modal */}
      {showApproveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>✅ Approve Teacher Verification</h3>
            <p>
              Are you sure you want to approve <strong>{teacher.name}</strong>'s
              qualification?
            </p>
            <div className="modal-input">
              <label>Approval Notes (Optional):</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes for the teacher..."
                rows="4"
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApprovalNotes("");
                }}
                className="btn-cancel"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleApproveTeacher}
                className="btn-approve"
                disabled={processing}
              >
                {processing ? "Approving..." : "Approve Verification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Verification Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>❌ Reject Teacher Verification</h3>
            <p>
              Are you sure you want to reject <strong>{teacher.name}</strong>'s
              qualification?
            </p>
            <div className="modal-input">
              <label>Rejection Reason (Required):</label>
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Explain why the qualification was rejected..."
                rows="4"
                required
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionNotes("");
                }}
                className="btn-cancel"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectTeacher}
                className="btn-reject"
                disabled={processing || !rejectionNotes.trim()}
              >
                {processing ? "Rejecting..." : "Reject Verification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeacherDetail;
