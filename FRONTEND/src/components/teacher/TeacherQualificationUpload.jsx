import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/teacher/TeacherQualification.css";

const initialForm = {
  degree: "",
  institution: "",
  specialization: "",
  experienceYears: "",
  bio: "",
};

const TeacherQualificationUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [lastUploadedFileName, setLastUploadedFileName] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    fetchVerificationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        },
      );

      const data = await response.json();
      if (data.success) {
        setVerificationStatus(data.data);
        if (data.data?.qualificationDetails) {
          setFormData((prev) => ({
            ...prev,
            degree: data.data.qualificationDetails.degree || "",
            institution: data.data.qualificationDetails.institution || "",
            specialization: data.data.qualificationDetails.specialization || "",
            experienceYears:
              data.data.qualificationDetails.experienceYears ?? "",
            bio: data.data.qualificationDetails.bio || "",
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
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
        setMessage({
          type: "error",
          text: "Please upload a valid file (PDF, JPG, PNG, DOC, DOCX)",
        });
        setFile(null);
        setLastUploadedFileName("");
        event.target.value = "";
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "File size should not exceed 5MB" });
        setFile(null);
        setLastUploadedFileName("");
        event.target.value = "";
        return;
      }

      setFile(selectedFile);
      setLastUploadedFileName(selectedFile.name);
      setMessage({ type: "", text: "" });
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (
      !formData.degree ||
      !formData.institution ||
      !formData.experienceYears
    ) {
      setMessage({
        type: "error",
        text: "Please fill in degree, institution, and experience.",
      });
      return;
    }

    if (!file) {
      setMessage({ type: "error", text: "Please select a file to upload" });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const payload = new FormData();
      payload.append("qualification", file);
      payload.append("degree", formData.degree.trim());
      payload.append("institution", formData.institution.trim());
      payload.append("specialization", formData.specialization.trim());
      payload.append("experienceYears", formData.experienceYears);
      payload.append("bio", formData.bio.trim());

      const response = await fetch(
        `${BACKEND_URL}/teacher/verification/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: payload,
        },
      );

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Details submitted. Awaiting admin verification.",
        });
        if (file) {
          setLastUploadedFileName(file.name);
        }
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setHasSubmitted(true);
        setShowForm(false);

        setTimeout(() => {
          fetchVerificationStatus();
        }, 1000);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to submit verification details",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  let status = verificationStatus?.verificationStatus || "Not Submitted";
  if (status === "NotSubmitted") status = "Not Submitted";
  const statusStyles = {
    Verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
    "Not Submitted": "bg-purple-50 text-purple-700 ring-purple-200",
  };
  const statusMessage =
    status === "Verified"
      ? "Verification completed. You can access all teacher tools."
      : status === "Rejected"
        ? "Verification was rejected. Please update your details and resubmit."
        : status === "Pending"
          ? "Your details are under review. We will notify you soon."
          : "Not Submitted, application under progress. Please complete your details below.";

  const calculateCompletion = () => {
    let count = 0;
    if (formData.degree.trim()) count++;
    if (formData.institution.trim()) count++;
    if (formData.experienceYears) count++;
    if (formData.bio.trim()) count++;
    if (file) count++;
    return Math.round((count / 5) * 100);
  };

  const completion = calculateCompletion();
  const fileLabel = file ? file.name : lastUploadedFileName || "No file chosen";
  const canEdit =
    hasSubmitted || Boolean(verificationStatus?.qualificationDetails);

  return (
    <div className="teacher-qualification-container">
      <div className="qualification-header">
        <h2>Teacher Verification</h2>
        {/* Status Button in Top Right */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 10px",
              backgroundColor:
                status === "Verified"
                  ? "#d1fae5"
                  : status === "Pending"
                    ? "#fef3c7"
                    : status === "Rejected"
                      ? "#fee2e2"
                      : "#e9d5ff",
              color:
                status === "Verified"
                  ? "#065f46"
                  : status === "Pending"
                    ? "#92400e"
                    : status === "Rejected"
                      ? "#991b1b"
                      : "#7c3aed",
              borderRadius: "15px",
              fontSize: "12px",
              fontWeight: "500",
              border: `1px solid ${status === "Verified" ? "#10b981" : status === "Pending" ? "#f59e0b" : status === "Rejected" ? "#ef4444" : "#c4b5fd"}`,
            }}
          >
            {status === "Verified"
              ? "✅"
              : status === "Pending"
                ? "⏳"
                : status === "Rejected"
                  ? "❌"
                  : status === "Not Submitted"
                    ? ""
                    : "📝"}
            {status}
          </span>
        </div>
      </div>

      {!showForm ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            margin: "40px 0",
            padding: "0 20px",
          }}
        >
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <svg width="200" height="200" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="#e5e7eb" />
              <path
                d={`M50,50 L50,10 A40,40 0 ${completion >= 50 ? 1 : 0},1 ${50 + 40 * Math.sin((completion / 100) * 2 * Math.PI)},${50 - 40 * Math.cos((completion / 100) * 2 * Math.PI)} Z`}
                fill="#7c3aed"
              />
            </svg>
            <p
              style={{
                marginTop: "10px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              {completion}% complete
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "16px",
                color: "#6b7280",
                marginBottom: "20px",
              }}
            >
              Not Submitted, application under progress. Complete your profile
              for verification.
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "12px 24px",
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              {canEdit
                ? "Edit details"
                : "Complete your profile for verification"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: "12px", paddingLeft: "4px" }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: "8px 12px",
                backgroundColor: "transparent",
                color: "#374151",
                border: "1px solid #e5e7eb",
                borderRadius: "999px",
                cursor: "pointer",
                fontSize: "14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {"<- Back"}
            </button>
          </div>
          <div
            className="upload-section"
            style={{
              position: "relative",
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 10px 20px rgba(17, 24, 39, 0.06)",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "600",
                }}
              >
                Profile Completion Status
              </label>
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#e5e7eb",
                  borderRadius: "10px",
                  height: "10px",
                }}
              >
                <div
                  style={{
                    width: `${completion}%`,
                    backgroundColor: "#7c3aed",
                    height: "10px",
                    borderRadius: "10px",
                    transition: "width 0.3s",
                  }}
                ></div>
              </div>
              <p
                style={{ marginTop: "5px", fontSize: "14px", color: "#6b7280" }}
              >
                {completion}% complete
              </p>
            </div>
            <div
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <p style={{ fontSize: "16px", color: "#374151" }}>
                Not Submitted, application under progress. Please complete your
                details below.
              </p>
            </div>
            <form onSubmit={handleUpload} className="qualification-form">
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
                    Degree *
                  </label>
                  <input
                    type="text"
                    name="degree"
                    value={formData.degree}
                    onChange={handleInputChange}
                    placeholder="e.g., B.Tech"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                      fontSize: "14px",
                    }}
                    required
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
                    Institution *
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleInputChange}
                    placeholder="e.g., IIT Delhi"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                      fontSize: "14px",
                    }}
                    required
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
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                      fontSize: "14px",
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
                    Experience (Years) *
                  </label>
                  <input
                    type="number"
                    name="experienceYears"
                    min="0"
                    max="60"
                    value={formData.experienceYears}
                    onChange={handleInputChange}
                    placeholder="e.g., 5"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                      fontSize: "14px",
                    }}
                    required
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
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Brief description about yourself"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "14px",
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
                  Document *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={uploading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                  }}
                  required
                />
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    color: "#4b5563",
                  }}
                >
                  Selected file: {fileLabel}
                </div>
                <small style={{ color: "#666", fontSize: "12px" }}>
                  PDF, JPG, PNG, DOC, DOCX. Max 5MB
                </small>
              </div>

              {message.text && (
                <div
                  style={{
                    padding: "10px",
                    borderRadius: "5px",
                    marginBottom: "15px",
                    backgroundColor:
                      message.type === "success" ? "#d4edda" : "#f8d7da",
                    color: message.type === "success" ? "#155724" : "#721c24",
                    border: `1px solid ${message.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
                  }}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: uploading ? "#ccc" : "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "16px",
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              >
                {uploading ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherQualificationUpload;
