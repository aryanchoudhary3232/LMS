import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function TeacherDashboard({ teacherId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/teacher/dashboard`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => setStats(res.data));
  }, [teacherId]);

  if (!stats) return <p>Loading...</p>;

  const styles = {
    container: { padding: "24px", fontFamily: "Arial, sans-serif" },
    heading: { fontSize: "28px", fontWeight: 700, marginBottom: "20px" },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "20px",
    },
    card: {
      background: "white",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      textAlign: "center",
    },
    cardValue: { fontSize: "32px", fontWeight: "700", color: "#4F46E5" },
    cardLabel: { fontSize: "16px", marginTop: "4px", color: "#555" },
    chartBox: {
      background: "white",
      padding: "20px",
      borderRadius: "12px",
      marginTop: "20px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    },
    tableBox: {
      background: "white",
      padding: "20px",
      marginTop: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
    },
    th: {
      padding: "12px",
      textAlign: "left",
      background: "#f3f4f6",
      fontWeight: "600",
    },
    td: { padding: "12px", borderBottom: "1px solid #eee" },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Teacher Dashboard</h2>

      {/* Summary Cards */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardValue}>{stats.totalCourses}</div>
          <div style={styles.cardLabel}>Total Courses</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardValue}>{stats.totalStudents}</div>
          <div style={styles.cardLabel}>Total Students</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardValue}>{stats.avgRating} ⭐</div>
          <div style={styles.cardLabel}>Avg Rating</div>
        </div>
      </div>

      {/* Enrollment Chart */}
      <div style={styles.chartBox}>
        <h3 style={{ marginBottom: "12px", fontSize: "20px" }}>
          Course Enrollment Overview
        </h3>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stats.enrollmentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="courseName" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="students" fill="#4F46E5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div style={styles.tableBox}>
        <h3 style={{ marginBottom: "12px", fontSize: "20px" }}>
          Recent Student Activity
        </h3>

        <table width="100%">
          <thead>
            <tr>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Course</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>

          <tbody>
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((a, i) => (
                <tr key={i}>
                  <td style={styles.td}>{a.name}</td>
                  <td style={styles.td}>{a.course}</td>
                  <td style={styles.td}>
                    {new Date(a.date).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ ...styles.td, textAlign: "center" }}>
                  No recent activity found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
