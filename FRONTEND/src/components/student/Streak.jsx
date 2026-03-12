import React, { useEffect, useState } from "react";
import "../../css/student/Streak.css";

const Streak = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    const token = localStorage.getItem("token");

    async function load() {
      try {
        const res = await fetch(`${backendUrl}/student/streak`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setStats(json.data);
      } catch (err) {
        console.error("Failed to load streak stats", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="streak-container">
        <div className="streak-loading">Loading streak data...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="streak-container">
        <div className="streak-error">No data available.</div>
      </div>
    );
  }

  const formatDate = (iso) => {
    if (!iso) return "No recent activity";
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="streak-container">
      <div className="streak-header">
        <h2 className="streak-title">Streak & Activity</h2>
        <p className="streak-subtitle">Overview of your recent activity</p>
      </div>

      <div className="streak-stats-grid">
        <div className="streak-stat-card active-days">
          <span className="streak-stat-number">{stats.activeDays}</span>
          <div className="streak-stat-label">Days Active</div>
        </div>

        <div className="streak-stat-card quiz-days">
          <span className="streak-stat-number">{stats.quizDays}</span>
          <div className="streak-stat-label">Days with Quiz Attempts</div>
        </div>

        <div className="streak-stat-card current-streak">
          <span className="streak-stat-number">{stats.currentStreak}</span>
          <div className="streak-stat-label">Current Streak (days)</div>
        </div>

        <div className="streak-stat-card best-streak">
          <span className="streak-stat-number">{stats.bestStreak}</span>
          <div className="streak-stat-label">Best Streak</div>
        </div>
      </div>

      <div className="last-active-panel">
        <h3 className="last-active-title">Last Active</h3>
        <div className="last-active-date">{formatDate(stats.lastActiveDate)}</div>
        <p className="last-active-description">
          Last recorded active date for streak tracking. Keep learning daily to maintain your streak!
        </p>
      </div>
    </div>
  );
};

export default Streak;
