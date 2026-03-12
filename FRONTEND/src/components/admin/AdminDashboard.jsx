import React, { useEffect, useState } from "react";
import "../../css/admin/Admin.css";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    studentCount: 0,
    teacherCount: 0,
    courseCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const backendUrl =
          import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

        const response = await fetch(`${backendUrl}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (data.success) {
          setStats(data.data);
        } else {
          console.error("Error fetching dashboard data:", data.message);
        }
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  return (
    <div style={{width: '100%', padding: '39px', boxSizing: 'border-box'}} className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <div className="admin-stats-cards">
        <div className="admin-stat-card students">
          <h3>Students</h3>
          <p className="admin-stat-number">{stats.studentCount}</p>
        </div>
        <div className="admin-stat-card teachers">
          <h3>Teachers</h3>
          <p className="admin-stat-number">{stats.teacherCount}</p>
        </div>
        <div className="admin-stat-card courses">
          <h3>Courses</h3>
          <p className="admin-stat-number">{stats.courseCount}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
