import React, { useEffect, useState } from "react";
import "../../css/admin/Admin.css";

const AdminDeletedMembers = () => {
  const [deletedMembers, setDeletedMembers] = useState({
    students: [],
    teachers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeletedMembers = async () => {
      try {
        const token = localStorage.getItem("token");
        const backendUrl =
          import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

        const response = await fetch(`${backendUrl}/admin/deleted-members`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (data.success) {
          setDeletedMembers(data.data);
        } else {
          console.error("Error fetching deleted members:", data.message);
        }
      } catch (error) {
        console.error("Error fetching deleted members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeletedMembers();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="admin-loading">Loading deleted members...</div>;
  }

  return (
    <div
      style={{ width: "100%", padding: "39px", boxSizing: "border-box" }}
      className="admin-users"
    >
      <h2>🗑️ Deleted Members</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        View previously deleted students and teachers
      </p>

      <div className="admin-section">
        <h3 className="admin-section-title students">
          Deleted Students ({deletedMembers.students.length})
        </h3>
        {deletedMembers.students.length > 0 ? (
          <div className="admin-grid">
            {deletedMembers.students.map((student) => (
              <div key={student._id} className="admin-card user deleted-member">
                <div style={{ opacity: 0.7 }}>
                  <h4>{student.name}</h4>
                  <p>
                    <strong>Email:</strong> {student.email}
                  </p>
                  <p>
                    <strong>Role:</strong> Student
                  </p>
                  <p>
                    <strong>Enrolled Courses:</strong>{" "}
                    {student.enrolledCourses?.length || 0}
                  </p>
                  <p style={{ color: "#e74c3c", fontSize: "0.85rem" }}>
                    <strong>Deleted At:</strong> {formatDate(student.deletedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty">No deleted students found</div>
        )}
      </div>

      <div className="admin-section">
        <h3 className="admin-section-title teachers">
          Deleted Teachers ({deletedMembers.teachers.length})
        </h3>
        {deletedMembers.teachers.length > 0 ? (
          <div className="admin-grid">
            {deletedMembers.teachers.map((teacher) => (
              <div
                key={teacher._id}
                className="admin-card user teacher-card deleted-member"
              >
                <div style={{ opacity: 0.7 }}>
                  <h4>{teacher.name}</h4>
                  <p>
                    <strong>Email:</strong> {teacher.email}
                  </p>
                  <p>
                    <strong>Role:</strong> Teacher
                  </p>
                  <p>
                    <strong>Verification Status:</strong>{" "}
                    <span
                      className={`verification-badge ${teacher.verificationStatus?.toLowerCase()}`}
                    >
                      {teacher.verificationStatus || "Not Submitted"}
                    </span>
                  </p>
                  <p>
                    <strong>Courses:</strong> {teacher.courses?.length || 0}
                  </p>
                  <p style={{ color: "#e74c3c", fontSize: "0.85rem" }}>
                    <strong>Deleted At:</strong> {formatDate(teacher.deletedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty">No deleted teachers found</div>
        )}
      </div>
    </div>
  );
};

export default AdminDeletedMembers;
