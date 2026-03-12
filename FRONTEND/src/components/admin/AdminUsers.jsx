import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/admin/Admin.css";

const AdminUsers = () => {
  const [users, setUsers] = useState({ students: [], teachers: [] });
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    studentId: null,
    studentName: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const backendUrl =
          import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

        const response = await fetch(`${backendUrl}/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (data.success) {
          setUsers(data.data);
        } else {
          console.error("Error fetching users:", data.message);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteClick = (studentId, studentName) => {
    setDeleteModal({ show: true, studentId, studentName });
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      const response = await fetch(
        `${backendUrl}/admin/students/${deleteModal.studentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        // Remove student from the list
        setUsers((prevUsers) => ({
          ...prevUsers,
          students: prevUsers.students.filter(
            (student) => student._id !== deleteModal.studentId
          ),
        }));
        alert("Student deleted successfully!");
      } else {
        alert("Error deleting student: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Error deleting student. Please try again.");
    } finally {
      setDeleteModal({ show: false, studentId: null, studentName: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, studentId: null, studentName: "" });
  };

  if (loading) {
    return <div className="admin-loading">Loading users...</div>;
  }

  return (
    <div
      style={{ width: "100%", padding: "39px", boxSizing: "border-box" }}
      className="admin-users"
    >
      <h2>All Users</h2>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Student</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteModal.studentName}</strong>?
            </p>
            <p
              style={{
                color: "#e74c3c",
                fontSize: "0.9rem",
                marginTop: "10px",
              }}
            >
              This action cannot be undone. All student data will be permanently
              removed.
            </p>
            <div className="modal-actions">
              <button onClick={handleDeleteCancel} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="btn-delete">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-section">
        <h3 className="admin-section-title students">
          Students ({users.students.length})
        </h3>
        {users.students.length > 0 ? (
          <div className="admin-grid">
            {users.students.map((student) => (
              <div key={student._id} className="admin-card user">
                <h4>{student.name}</h4>
                <p>
                  <strong>Email:</strong> {student.email}
                </p>
                <p>
                  <strong>Role:</strong> Student
                </p>
                <button
                  onClick={() => handleDeleteClick(student._id, student.name)}
                  className="btn-delete-student"
                  title="Delete Student"
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty">No students found</div>
        )}
      </div>

      <div className="admin-section">
        <h3 className="admin-section-title teachers">
          Teachers ({users.teachers.length})
        </h3>
        {users.teachers.length > 0 ? (
          <div className="admin-grid">
            {users.teachers.map((teacher) => (
              <div key={teacher._id} className="admin-card user teacher-card">
                <h4>{teacher.name}</h4>
                <p>
                  <strong>Email:</strong> {teacher.email}
                </p>
                <p>
                  <strong>Role:</strong> Teacher
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`verification-badge ${teacher.verificationStatus?.toLowerCase()}`}
                  >
                    {teacher.verificationStatus || "Not Submitted"}
                  </span>
                </p>
                <p>
                  <strong>Courses:</strong> {teacher.courses?.length || 0}
                </p>
                <button
                  onClick={() => navigate(`/admin/teachers/${teacher._id}`)}
                  className="btn-review-teacher"
                >
                  👁️ Review Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty">No teachers found</div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
