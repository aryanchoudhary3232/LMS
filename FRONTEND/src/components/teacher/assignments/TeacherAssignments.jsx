import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../../css/teacher/Assignments.css";

const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState("");
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_URL}/teacher/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchAssignments = async (courseId = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = courseId
        ? `${BACKEND_URL}/assignments/teacher/list?courseId=${courseId}`
        : `${BACKEND_URL}/assignments/teacher/list`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setAssignments(data.data);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (courseId) => {
    setFilterCourse(courseId);
    fetchAssignments(courseId);
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/assignments/teacher/delete/${assignmentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Assignment deleted successfully!");
        fetchAssignments(filterCourse);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment");
    }
  };

  const getStatusBadge = (assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);

    if (assignment.status === "closed") {
      return <span className="badge badge-closed">Closed</span>;
    } else if (now > dueDate) {
      return <span className="badge badge-overdue">Overdue</span>;
    } else {
      return <span className="badge badge-active">Active</span>;
    }
  };

  if (loading) {
    return <div className="assignments-loading">Loading assignments...</div>;
  }

  return (
    <div className="teacher-assignments-container">
      <div className="assignments-header">
        <h2>📝 My Assignments</h2>
        <button
          onClick={() => navigate("/teacher/assignments/create")}
          className="btn-create-assignment"
        >
          ➕ Create New Assignment
        </button>
      </div>

      <div className="assignments-filters">
        <select
          value={filterCourse}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="filter-select"
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {assignments.length === 0 ? (
        <div className="no-assignments">
          <p>📭 No assignments found</p>
          <button
            onClick={() => navigate("/teacher/assignments/create")}
            className="btn-create-first"
          >
            Create Your First Assignment
          </button>
        </div>
      ) : (
        <div className="assignments-grid">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="assignment-card">
              <div className="card-header">
                <h3>{assignment.title}</h3>
                {getStatusBadge(assignment)}
              </div>

              <div className="card-body">
                <p className="course-name">
                  📚 <strong>{assignment.course?.title}</strong>
                </p>
                {assignment.chapter && (
                  <p className="chapter-name">
                    📖 Chapter: {assignment.chapter}
                  </p>
                )}
                <p className="description">{assignment.description}</p>

                <div className="assignment-meta">
                  <div className="meta-item">
                    <span className="label">Max Marks:</span>
                    <span className="value">{assignment.maxMarks}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">Due Date:</span>
                    <span className="value">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="stats-section">
                  <div className="stat-item">
                    <span className="stat-number">
                      {assignment.stats?.totalSubmissions || 0}
                    </span>
                    <span className="stat-label">Submissions</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">
                      {assignment.stats?.gradedSubmissions || 0}
                    </span>
                    <span className="stat-label">Graded</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number pending">
                      {assignment.stats?.pendingGrading || 0}
                    </span>
                    <span className="stat-label">Pending</span>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button
                  onClick={() =>
                    navigate(
                      `/teacher/assignments/${assignment._id}/submissions`
                    )
                  }
                  className="btn-view-submissions"
                >
                  👁️ View Submissions
                </button>
                <button
                  onClick={() => handleDelete(assignment._id)}
                  className="btn-delete"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
