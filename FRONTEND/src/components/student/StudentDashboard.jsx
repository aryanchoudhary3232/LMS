import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Import the CSS file (adjust path if needed)
import "../common/StudentDashboard.css";

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to manually add learning minutes (for testing)
  const addLearningMinutes = async (minutes) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/student/progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ minutes }),
        }
      );

      if (response.ok) {
        fetchDashboardData();
      } else {
        console.error("Failed to add learning minutes");
      }
    } catch (error) {
      console.error("Error adding learning minutes:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/student/dashboard`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
        setStudent(data.data);
      } else {
        console.error("Failed to fetch dashboard data:", data.message);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Data extractors
  const enrolledCount = dashboardData?.dashboardStats?.totalEnrolledCourses || 0;
  const currentStreak = dashboardData?.dashboardStats?.currentStreak || 0;
  const totalQuizzesTaken = dashboardData?.dashboardStats?.totalQuizzesTaken || 0;
  const globalQuizAverage = dashboardData?.dashboardStats?.globalQuizAverage || 0;
  const highestQuizScore = dashboardData?.dashboardStats?.highestQuizScore || 0;
  const studentName = dashboardData?.studentInfo?.name || "Student";
  const studentEmail = dashboardData?.studentInfo?.email || "student@example.com";

  // Chart Data Logic
  const formattedProgressData = dashboardData?.studentProgress?.length > 0
    ? dashboardData.studentProgress.map((data) => ({
      day: new Date(data.date).toLocaleDateString("en-us", {
        weekday: "short",
      }),
      minutes: data.minutes || 0,
    }))
    : (() => {
      const fallbackData = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        fallbackData.push({
          day: date.toLocaleDateString("en-us", { weekday: "short" }),
          minutes: 0
        });
      }
      return fallbackData;
    })();

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: "center", marginTop: "50px", fontSize: "18px", color: "#666" }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="header-icon">🌿</div>
          <div>
            <h1>Hello, {studentName}!</h1>
            <p>Explore your learning progress and activities</p>
          </div>
        </div>
        <div className="header-right">
          <div className="search-box">
            <span>🔍</span>
            <input type="text" placeholder="Search..." />
          </div>
          <button className="header-btn" title="Notifications">🔔</button>
          <button className="header-btn" onClick={fetchDashboardData} title="Refresh">🔄</button>
        </div>
      </div>

      {/* Bento Grid Content */}
      <div className="dashboard-content">

        {/* Stat Cards Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <span className="stat-label">Enrolled Courses</span>
              <span className="stat-value">{enrolledCount}</span>
            </div>
            <div className="stat-chart">
              <div className="stat-bar" style={{ height: '60%' }}></div>
              <div className="stat-bar" style={{ height: '80%' }}></div>
              <div className="stat-bar" style={{ height: '40%' }}></div>
              <div className="stat-bar" style={{ height: '100%' }}></div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-info">
              <span className="stat-label">Current Streak</span>
              <span className="stat-value">{currentStreak}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <span className="stat-label">Weekly Minutes</span>
              <span className="stat-value">{dashboardData?.dashboardStats?.totalWeeklyMinutes || 0}</span>
            </div>
          </div>

          <div className="stat-card accent">
            <div className="stat-icon">🎥</div>
            <div className="stat-info">
              <span className="stat-label">Videos Watched</span>
              <span className="stat-value">
                {dashboardData?.dashboardStats?.totalCompletedTopics || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Balance/Progress Card - Spans 2 columns */}
        <div className="dashboard-card balance-card">
          <div className="balance-header">
            <div>
              <div className="card-title">
                Learning Progress
                <div className="balance-status">
                  <span className="status-dot"></span>
                  <span className="status-text">On track</span>
                </div>
              </div>
            </div>
            <select className="period-select">
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>

          <div className="balance-stats">
            <div className="balance-stat">
              <span className="balance-stat-label">Quiz Average</span>
              <div className="balance-stat-row">
                <span className="balance-stat-value">{globalQuizAverage}%</span>
                <span className="balance-stat-change positive">+2.45%</span>
              </div>
            </div>
            <div className="balance-stat">
              <span className="balance-stat-label">Best Score</span>
              <div className="balance-stat-row">
                <span className="balance-stat-value">{highestQuizScore}%</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div style={{ width: '100%', height: '150px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedProgressData}>
                <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} hide />
                <Tooltip
                  cursor={{ fill: 'rgba(74, 124, 89, 0.1)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="minutes" fill="#4a7c59" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Earnings/Quiz Summary Card */}
        <div className="dashboard-card earnings-card">
          <div className="card-title">Quiz Summary</div>
          <div className="card-subtitle">Total Quizzes Taken</div>
          <div className="earnings-amount">{totalQuizzesTaken}</div>
          <div className="earnings-subtitle">Performance score compared to last month</div>

          <div className="progress-ring">
            <svg viewBox="0 0 100 100" width="100" height="100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e8e8e3" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="#4a7c59" strokeWidth="8"
                strokeDasharray={`${globalQuizAverage * 2.51} 251`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="progress-ring-inner">
              <span className="progress-value">{globalQuizAverage}%</span>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="dashboard-card profile-card">
          <div className="profile-avatar">👤</div>
          <div className="profile-name">{studentName}</div>
          <div className="profile-email">{studentEmail}</div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">{enrolledCount}</span>
              <span className="profile-stat-label">Courses</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{currentStreak}</span>
              <span className="profile-stat-label">Streak</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{totalQuizzesTaken}</span>
              <span className="profile-stat-label">Quizzes</span>
            </div>
          </div>
        </div>

        {/* My Courses Card - Spans 2 columns */}
        <div className="dashboard-card courses-card">
          <div className="card-title">
            My Courses
            <Link to="/student/courses" className="continue-btn">
              View All →
            </Link>
          </div>

          <div className="courses-list">
            {dashboardData?.enrolledCourses?.length > 0 ? (
              dashboardData.enrolledCourses.slice(0, 4).map((item) => (
                <Link
                  to={`/student/courses/${item.course._id}`}
                  className="course-item"
                  key={item.course._id}
                >
                  <img
                    src={item.course.image}
                    alt={item.course.title}
                    onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=Course")}
                  />
                  <div className="course-item-content">
                    <div className="course-item-title">{item.course.title}</div>
                    <div className="course-meta">
                      {item.completedTopics || 0}/{item.totalTopics || 0} topics • {item.avgQuizScore}% avg
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', gridColumn: '1 / -1' }}>
                No courses enrolled yet.
                <Link to="/courses" style={{ color: 'var(--color-primary)', marginLeft: '4px' }}>
                  Browse courses
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Activity/Transfers List */}
        <div className="dashboard-card activity-card">
          <div className="card-title">Recent Activity</div>

          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📖</div>
              <div className="activity-info">
                <div className="activity-title">Completed Topic</div>
                <div className="activity-time">Today, 14:34</div>
              </div>
              <span className="activity-change positive">+15 min</span>
            </div>

            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-info">
                <div className="activity-title">Quiz Submitted</div>
                <div className="activity-time">Today, 10:23</div>
              </div>
              <span className="activity-change positive">85%</span>
            </div>

            <div className="activity-item">
              <div className="activity-icon">🎯</div>
              <div className="activity-info">
                <div className="activity-title">Streak Extended</div>
                <div className="activity-time">Yesterday, 17:54</div>
              </div>
              <span className="activity-change positive">+1 day</span>
            </div>
          </div>
        </div>

        {/* Security/Reminder Card */}
        <div className="dashboard-card security-card">
          <div className="security-icon">🎓</div>
          <div className="security-title">Keep Learning!</div>
          <div className="security-text">Complete your daily goal to maintain your streak</div>
          <button
            className="security-btn"
            onClick={() => addLearningMinutes(15)}
          >
            Add 15 Minutes
          </button>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;