import React, { useEffect, useState } from "react";

const StudentsEnrolled = () => {
  const [students, setStudents] = useState(null);

  useEffect(() => {
    async function fetchStudents(params) {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/teacher/students`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json()
      setStudents(data.students)
    }
    fetchStudents()
  }, []);

const styles = {
    container: {
      padding: "24px",
      fontFamily: "Arial, sans-serif",
    },
    heading: {
      fontSize: "28px",
      fontWeight: "700",
      marginBottom: "20px",
      color: "#1e1e1e",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      backgroundColor: "white",
      borderRadius: "10px",
      overflow: "hidden",
      boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    },
    thead: {
      backgroundColor: "#f3f4f6",
      textAlign: "left",
      fontWeight: "600",
      borderBottom: "2px solid #e5e7eb",
    },
    th: {
      padding: "14px 16px",
      fontSize: "15px",
      color: "#374151",
    },
    row: {
      borderBottom: "1px solid #f1f1f1",
    },
    td: {
      padding: "14px 16px",
      fontSize: "14px",
      color: "#4b5563",
    },
    badge: {
      display: "inline-block",
      padding: "6px 10px",
      fontSize: "12px",
      backgroundColor: "#e0e7ff",
      color: "#4338ca",
      borderRadius: "6px",
      marginRight: "6px",
      marginTop: "4px",
    },
    emptyText: {
      padding: "20px",
      fontSize: "16px",
      textAlign: "center",
      color: "#6b7280",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Enrolled Students</h2>

      {students?.length === 0 ? (
        <p style={styles.emptyText}>No students enrolled yet.</p>
      ) : (
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Courses Enrolled</th>
            </tr>
          </thead>

          <tbody>
            {students?.map((s) => (
              <tr key={s.id} style={styles.row}>
                <td style={styles.td}>{s.name}</td>
                <td style={styles.td}>{s.email}</td>

                <td style={styles.td}>
                  {s.courses.map((course, i) => (
                    <span key={i} style={styles.badge}>
                      {course}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentsEnrolled;
