import React from 'react';

const OverviewTab = ({ overview }) => {
  if (!overview) return null;

  const { users, courses, revenue, recentActivity } = overview;

  return (
    <div>
      <h2>📊 Platform Overview</h2>
      
      <div className="superadmin-stats-grid">
        <div className="superadmin-stat-card">
          <span className="icon">👥</span>
          <h3>Total Users</h3>
          <span className="value">{users.total}</span>
          <span className="subtext">
            {users.students} students, {users.teachers} teachers
          </span>
        </div>

        <div className="superadmin-stat-card">
          <span className="icon">🎓</span>
          <h3>Students</h3>
          <span className="value">{users.students}</span>
          <span className="subtext">Active learners</span>
        </div>

        <div className="superadmin-stat-card">
          <span className="icon">👨‍🏫</span>
          <h3>Teachers</h3>
          <span className="value">{users.teachers}</span>
          <span className="subtext">Course creators</span>
        </div>

        <div className="superadmin-stat-card">
          <span className="icon">🔐</span>
          <h3>Admins</h3>
          <span className="value">{users.admins}</span>
          <span className="subtext">Platform managers</span>
        </div>

        <div className="superadmin-stat-card">
          <span className="icon">📚</span>
          <h3>Total Courses</h3>
          <span className="value">{courses.total}</span>
          <span className="subtext">Active courses</span>
        </div>

        <div className="superadmin-stat-card revenue">
          <span className="icon">💰</span>
          <h3>Total Revenue</h3>
          <span className="value">₹{revenue.total.toLocaleString()}</span>
          <span className="subtext">{revenue.completedOrders} completed orders</span>
        </div>

        <div className="superadmin-stat-card revenue">
          <span className="icon">🏢</span>
          <h3>Platform Revenue (30%)</h3>
          <span className="value">₹{revenue.platformRevenue.toLocaleString()}</span>
          <span className="subtext">Platform's share</span>
        </div>

        <div className="superadmin-stat-card revenue">
          <span className="icon">👨‍🏫</span>
          <h3>Teacher Revenue (70%)</h3>
          <span className="value">₹{revenue.teacherRevenue.toLocaleString()}</span>
          <span className="subtext">Teachers' share</span>
        </div>

        <div className="superadmin-stat-card">
          <span className="icon">📦</span>
          <h3>Total Orders</h3>
          <span className="value">{revenue.totalOrders}</span>
          <span className="subtext">
            {revenue.pendingOrders} pending, {revenue.failedOrders} failed
          </span>
        </div>

        <div className="superadmin-stat-card">
          <span className="icon">🗑️</span>
          <h3>Deleted Items</h3>
          <span className="value">{users.deleted + courses.deleted}</span>
          <span className="subtext">
            {users.deleted} users, {courses.deleted} courses
          </span>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>
          📈 Recent Activity (Last 7 Days)
        </h3>
        <div className="superadmin-stats-grid">
          <div className="superadmin-stat-card">
            <span className="icon">🆕</span>
            <h3>New Students</h3>
            <span className="value">{recentActivity.newStudents}</span>
            <span className="subtext">Joined recently</span>
          </div>

          <div className="superadmin-stat-card">
            <span className="icon">📖</span>
            <h3>New Courses</h3>
            <span className="value">{recentActivity.newCourses}</span>
            <span className="subtext">Published recently</span>
          </div>

          <div className="superadmin-stat-card">
            <span className="icon">🛒</span>
            <h3>New Orders</h3>
            <span className="value">{recentActivity.newOrders}</span>
            <span className="subtext">Placed recently</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
