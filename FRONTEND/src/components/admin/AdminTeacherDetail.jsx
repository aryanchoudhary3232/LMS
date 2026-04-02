import React, { useState, useEffect, useCallback } from "react";
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

  const fetchTeacherDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/admin/teachers/${teacherId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
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
  }, [BACKEND_URL, navigate, teacherId]);

  useEffect(() => {
    fetchTeacherDetails();
  }, [fetchTeacherDetails]);

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
        },
      );

      const data = await response.json();
      if (data.success) {
        alert(
          `Teacher deleted successfully! ${data.data.deletedCoursesCount} courses were also removed.`,
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
        },
      );

      const data = await response.json();
      if (data.success) {
        alert("Teacher verification approved successfully!");
        setShowApproveModal(false);
        fetchTeacherDetails();
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
        },
      );

      const data = await response.json();
      if (data.success) {
        alert("Teacher verification rejected.");
        setShowRejectModal(false);
        fetchTeacherDetails();
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
        <h2>Teacher Verification Review</h2>
      </div>

      <div className="detail-content">
        <div className="info-card approval-card">
          <div className="card-header approval-header">
            <div className="approval-title">
              <h3>Teacher Submission</h3>
              <p className="approval-subtitle">
                Review the submitted details and take action.
              </p>
            </div>
          </div>

          <form className="qualification-form">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Degree
                </label>
                <input
                  type="text"
                  value={teacher.qualificationDetails?.degree || ""}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "14px",
                    backgroundColor: "#f9fafb",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Institution
                </label>
                <input
                  type="text"
                  value={teacher.qualificationDetails?.institution || ""}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "14px",
                    backgroundColor: "#f9fafb",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Specialization
                </label>
                <input
                  type="text"
                  value={teacher.qualificationDetails?.specialization || ""}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "14px",
                    backgroundColor: "#f9fafb",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Experience (Years)
                </label>
                <input
                  type="number"
                  value={teacher.qualificationDetails?.experienceYears || 0}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "14px",
                    backgroundColor: "#f9fafb",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "600",
                }}
              >
                Bio
              </label>
              <textarea
                value={teacher.qualificationDetails?.bio || ""}
                readOnly
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "14px",
                  backgroundColor: "#f9fafb",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "600",
                }}
              >
                Document
              </label>
              {teacher.qualificationDoc?.url ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: "600" }}>
                      {teacher.qualificationDoc.format?.toUpperCase() ||
                        "Document"}
                    </p>
                    <p
                      style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}
                    >
                      {teacher.qualificationDoc.bytes
                        ? `${(teacher.qualificationDoc.bytes / 1024).toFixed(
                            2,
                          )} KB`
                        : "Unknown size"}
                    </p>
                  </div>
                  <a
                    href={teacher.qualificationDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-view-doc"
                  >
                    View Document
                  </a>
                </div>
              ) : (
                <div className="no-document">
                  <p>No qualification document uploaded</p>
                </div>
              )}
            </div>

            <div className="verification-actions approval-actions">
              <button
                onClick={() => setShowApproveModal(true)}
                className="btn-approve"
                type="button"
              >
                Approve Verification
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="btn-reject"
                type="button"
              >
                Reject Verification
              </button>
            </div>
          </form>
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
