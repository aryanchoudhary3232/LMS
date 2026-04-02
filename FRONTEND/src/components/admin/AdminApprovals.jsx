import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/admin/Admin.css";

const AdminApprovals = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const fetchPendingTeachers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to load approvals");
      }

      const pending = (data.data?.teachers || []).filter(
        (teacher) => teacher.verificationStatus === "Pending",
      );
      setTeachers(pending);
    } catch (err) {
      setError(err.message || "Unable to load approvals");
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchPendingTeachers();
  }, [fetchPendingTeachers]);

  const stats = useMemo(() => {
    const withDoc = teachers.filter((teacher) => teacher.qualificationDoc?.url);
    return {
      pending: teachers.length,
      withDoc: withDoc.length,
      withoutDoc: teachers.length - withDoc.length,
    };
  }, [teachers]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading approvals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h3>Unable to load approvals</h3>
        <p>{error}</p>
        <button onClick={fetchPendingTeachers} className="btn-back">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-approvals-page">
      <div className="approvals-header">
        <div>
          <h2>Teacher Approvals</h2>
          <p className="approvals-subtitle">
            Review pending teacher verification submissions and open each
            profile for approval.
          </p>
        </div>
        <button className="approvals-refresh" onClick={fetchPendingTeachers}>
          Refresh
        </button>
      </div>

      <div className="approvals-stats">
        <div className="approvals-stat-card">
          <p className="stat-label">Pending</p>
          <p className="stat-value">{stats.pending}</p>
        </div>
        <div className="approvals-stat-card">
          <p className="stat-label">With document</p>
          <p className="stat-value">{stats.withDoc}</p>
        </div>
        <div className="approvals-stat-card">
          <p className="stat-label">Missing document</p>
          <p className="stat-value">{stats.withoutDoc}</p>
        </div>
      </div>

      {teachers.length === 0 ? (
        <div className="approval-empty">
          <h3>No pending approvals</h3>
          <p>All teacher verifications are up to date.</p>
        </div>
      ) : (
        <div className="approvals-grid">
          {teachers.map((teacher) => (
            <div className="approval-list-card" key={teacher._id}>
              <div className="approval-card-header">
                <div className="approval-card-title">
                  <h3>{teacher.name}</h3>
                  <p>{teacher.email}</p>
                </div>
                <span className="approval-status-pill">Pending</span>
              </div>

              <div className="approval-meta">
                <div className="approval-meta-item">
                  <span>Degree</span>
                  <strong>
                    {teacher.qualificationDetails?.degree || "Not provided"}
                  </strong>
                </div>
                <div className="approval-meta-item">
                  <span>Institution</span>
                  <strong>
                    {teacher.qualificationDetails?.institution ||
                      "Not provided"}
                  </strong>
                </div>
                <div className="approval-meta-item">
                  <span>Experience</span>
                  <strong>
                    {teacher.qualificationDetails?.experienceYears || 0} years
                  </strong>
                </div>
              </div>

              <div className="approval-actions">
                <button
                  className="btn-view-approval"
                  onClick={() => navigate(`/admin/teachers/${teacher._id}`)}
                >
                  Review details
                </button>
                {teacher.qualificationDoc?.url ? (
                  <a
                    className="btn-view-doc"
                    href={teacher.qualificationDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View document
                  </a>
                ) : (
                  <span className="approval-doc-missing">Document missing</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
