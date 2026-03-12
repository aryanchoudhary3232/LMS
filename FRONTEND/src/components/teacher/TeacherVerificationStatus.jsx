import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/teacher/TeacherQualification.css";

const TeacherVerificationStatus = () => {
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/teacher/verification/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setVerificationData(data.data);
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Verified":
        return "#10b981";
      case "Rejected":
        return "#ef4444";
      case "Pending":
      default:
        return "#f59e0b";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Verified":
        return "✅";
      case "Rejected":
        return "❌";
      case "Pending":
      default:
        return "⏳";
    }
  };

  if (loading) {
    return (
      <div className="verification-status-widget loading">
        <p>Loading verification status...</p>
      </div>
    );
  }

  if (!verificationData) {
    return (
      <div className="verification-status-widget not-uploaded">
        <div className="widget-icon">📋</div>
        <h3>Verification Required</h3>
        <p>Please upload your teaching qualification for verification</p>
        <button
          onClick={() => navigate("/teacher/upload-qualification")}
          className="upload-now-btn"
        >
          Upload Now
        </button>
      </div>
    );
  }

  const status = verificationData.verificationStatus;

  return (
    <div
      className="verification-status-widget"
      style={{ borderLeft: `4px solid ${getStatusColor(status)}` }}
    >
      <div className="widget-header">
        <span className="widget-icon">{getStatusIcon(status)}</span>
        <h3>Verification Status</h3>
      </div>

      <div className="widget-status">
        <span
          className="status-badge"
          style={{ background: getStatusColor(status), color: "white" }}
        >
          {status}
        </span>
      </div>

      {verificationData.verificationNotes && (
        <div className="widget-notes">
          <p className="notes-label">Admin Feedback:</p>
          <p className="notes-text">{verificationData.verificationNotes}</p>
        </div>
      )}

      <button
        onClick={() => navigate("/teacher/upload-qualification")}
        className="view-details-btn"
      >
        View Details
      </button>
    </div>
  );
};

export default TeacherVerificationStatus;
