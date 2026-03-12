import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/teacher/TeacherQualification.css";

const TeacherQualificationUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [verificationStatus, setVerificationStatus] = useState(null);
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    fetchVerificationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_URL}/teacher/verification/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setVerificationStatus(data.data);
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!validTypes.includes(selectedFile.type)) {
        setMessage({ type: "error", text: "Please upload a valid file (PDF, JPG, PNG, DOC, DOCX)" });
        setFile(null);
        e.target.value = "";
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "File size should not exceed 5MB" });
        setFile(null);
        e.target.value = "";
        return;
      }

      setFile(selectedFile);
      setMessage({ type: "", text: "" });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: "error", text: "Please select a file to upload" });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("qualification", file);

      const response = await fetch(`${BACKEND_URL}/teacher/verification/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Qualification uploaded successfully! Awaiting admin verification." });
        setFile(null);
        document.getElementById("fileInput").value = "";

        setTimeout(() => {
          fetchVerificationStatus();
        }, 1000);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to upload qualification" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Verified":
        return "status-verified";
      case "Rejected":
        return "status-rejected";
      case "Pending":
      default:
        return "status-pending";
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

  return (
    <div className="teacher-qualification-container">
      <div className="qualification-header">
        <button onClick={() => navigate("/teacher/home")} className="back-btn">
          ← Back to Dashboard
        </button>
        <h2>Teacher Qualification Verification</h2>
        <p className="qualification-subtitle">Upload your teaching qualification documents for verification</p>
      </div>

      {/* Current Verification Status */}
      {verificationStatus && (
        <div className="current-status">
          <div className="status-info">
            <div className="status-icon">{getStatusIcon(verificationStatus.verificationStatus)}</div>
            <div className="status-text">
              <h3>Current Verification Status</h3>
              <div className={`status-badge ${getStatusBadgeClass(verificationStatus.verificationStatus)}`}>{verificationStatus.verificationStatus}</div>
            </div>
          </div>

          <div className="status-details">
            {verificationStatus.verificationNotes && (
              <div className="status-notes">
                <h4>Admin Notes:</h4>
                <p>{verificationStatus.verificationNotes}</p>
              </div>
            )}

            {verificationStatus.qualificationDoc && (
              <div className="uploaded-doc-info">
                <h4>Uploaded Document</h4>
                <div className="doc-card">
                  <div className="doc-details">
                    <span className="doc-icon">📄</span>
                    <div className="doc-info">
                      <p className="doc-name">{verificationStatus.qualificationDoc.publicId || "Qualification Document"}</p>
                      <p className="doc-date">Uploaded: {new Date(verificationStatus.qualificationDoc.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {verificationStatus.qualificationDoc.url && (
                    <a href={verificationStatus.qualificationDoc.url} target="_blank" rel="noopener noreferrer" className="doc-link">View</a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="upload-section">
        <h3>{verificationStatus?.qualificationDoc ? "Upload New Qualification Document" : "Upload Qualification Document"}</h3>

        <div className="upload-instructions">
          <h4>Instructions</h4>
          <ul>
            <li>Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max size: 5MB)</li>
            <li>Use a clear, readable scan or photo of your certificate</li>
            <li>Ensure all text and personal details are visible</li>
          </ul>
        </div>

        <form onSubmit={handleUpload} className="qualification-form">
          <label htmlFor="fileInput" className={`file-upload-area ${file ? 'has-file' : ''}`}>
            <div className="upload-icon">📤</div>
            <h4>{file ? file.name : 'Drag & drop or click to browse'}</h4>
            <p>{file ? `${(file.size / 1024).toFixed(2)} KB` : 'PDF, JPG, PNG, DOC, DOCX'}</p>
            <button type="button" className="browse-btn" onClick={(e) => { e.preventDefault(); document.getElementById('fileInput').click(); }}>
              Browse files
            </button>
            <input type="file" id="fileInput" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileChange} disabled={uploading} style={{ display: 'none' }} />
          </label>

          {file && (
            <div className="selected-file">
              <div className="file-info">
                <div className="file-icon">📄</div>
                <div className="file-details">
                  <h5>{file.name}</h5>
                  <p>{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button type="button" className="remove-file-btn" onClick={() => { setFile(null); document.getElementById('fileInput').value = ''; }} disabled={uploading}>Remove</button>
            </div>
          )}

          {message.text && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <div className="submit-section">
            <button type="submit" disabled={!file || uploading} className="submit-btn">
              {uploading ? 'Uploading...' : 'Upload Qualification'}
            </button>
          </div>
        </form>

        <div className="upload-guidelines">
          <h4>📋 Upload Guidelines:</h4>
          <ul>
            <li>✓ Upload clear, readable copies of your qualification documents</li>
            <li>✓ Ensure all text and details are visible</li>
            <li>✓ Accepted: Teaching certificates, degrees, diplomas</li>
            <li>✓ File size limit: 5MB</li>
            <li>✓ Supported formats: PDF, JPG, PNG, DOC, DOCX</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TeacherQualificationUpload;
