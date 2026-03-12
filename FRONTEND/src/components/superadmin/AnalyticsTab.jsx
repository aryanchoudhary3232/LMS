import React, { useState, useEffect, useCallback } from 'react';
import { useSuperAdmin } from '../../contexts/useSuperAdmin';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

const AnalyticsTab = () => {
  const {
    fetchRevenueAnalytics,
    fetchUserGrowth,
    fetchTeacherPerformance,
    fetchCoursePerformance,
    fetchEnrollmentTrends
  } = useSuperAdmin();

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [analytics, setAnalytics] = useState({
    revenue: null,
    userGrowth: null,
    teacherPerformance: null,
    coursePerformance: null,
    enrollmentTrends: null
  });

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [revenue, userGrowth, teachers, courses, enrollment] = await Promise.all([
        fetchRevenueAnalytics(),
        fetchUserGrowth(period),
        fetchTeacherPerformance(),
        fetchCoursePerformance(),
        fetchEnrollmentTrends(period)
      ]);

      setAnalytics({
        revenue: revenue.data,
        userGrowth: userGrowth.data,
        teacherPerformance: teachers.data,
        coursePerformance: courses.data,
        enrollmentTrends: enrollment.data
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [
    fetchCoursePerformance,
    fetchEnrollmentTrends,
    fetchRevenueAnalytics,
    fetchTeacherPerformance,
    fetchUserGrowth,
    period,
  ]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="superadmin-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>📈 Advanced Analytics</h2>
        <select 
          value={period} 
          onChange={(e) => setPeriod(Number(e.target.value))}
          style={{ padding: '0.75rem', borderRadius: '10px', border: '2px solid #e2e8f0' }}
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>

      {/* Revenue by Category */}
      {analytics.revenue && (
        <div className="chart-card">
          <h3>💰 Revenue by Category</h3>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div>
                <strong style={{ color: '#667eea' }}>Total Revenue</strong>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{analytics.revenue.totalRevenue.toLocaleString()}</div>
              </div>
              <div>
                <strong style={{ color: '#48bb78' }}>Platform (30%)</strong>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{analytics.revenue.platformRevenue.toLocaleString()}</div>
              </div>
              <div>
                <strong style={{ color: '#ed8936' }}>Teachers (70%)</strong>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{analytics.revenue.teacherRevenue.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.revenue.revenueByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="platformRevenue" fill="#48bb78" name="Platform Revenue (30%)" />
              <Bar dataKey="teacherRevenue" fill="#ed8936" name="Teacher Revenue (70%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="chart-grid">
        {/* User Growth */}
        {analytics.userGrowth && (
          <div className="chart-card">
            <h3>👥 User Growth Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.userGrowth.studentGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#667eea" strokeWidth={2} name="New Students" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Enrollment Trends */}
        {analytics.enrollmentTrends && (
          <div className="chart-card">
            <h3>📊 Daily Enrollments & Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.enrollmentTrends.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip formatter={(value, name) => {
                  if (name === "Revenue") return `₹${value.toLocaleString()}`;
                  return value;
                }} />
                <Legend />
                <Line type="monotone" dataKey="enrollments" stroke="#667eea" name="Enrollments" />
                <Line type="monotone" dataKey="revenue" stroke="#764ba2" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Enrollments Pie Chart */}
      {analytics.enrollmentTrends?.categoryEnrollments && (
        <div className="chart-card" style={{ marginTop: '2rem' }}>
          <h3>📚 Enrollments by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.enrollmentTrends.categoryEnrollments}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ _id, enrollments }) => `${_id}: ${enrollments}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="enrollments"
              >
                {analytics.enrollmentTrends.categoryEnrollments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Teachers */}
      {analytics.teacherPerformance && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>
            🏆 Top Teachers by Revenue
          </h3>
          <table className="superadmin-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Courses</th>
                <th>Students</th>
                <th>Total Revenue</th>
                <th>Avg Revenue/Course</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics.teacherPerformance.slice(0, 10).map((teacher) => (
                <tr key={teacher.teacherId}>
                  <td>
                    <strong>{teacher.name}</strong>
                    <br />
                    <small style={{ color: '#718096' }}>{teacher.email}</small>
                  </td>
                  <td>{teacher.totalCourses}</td>
                  <td>{teacher.totalStudents}</td>
                  <td>₹{teacher.totalRevenue.toLocaleString()}</td>
                  <td>₹{Math.round(teacher.averageRevenuePerCourse).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${teacher.verificationStatus === 'Verified' ? 'success' : 'warning'}`}>
                      {teacher.verificationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top Courses */}
      {analytics.coursePerformance && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>
            🌟 Top Courses by Revenue
          </h3>
          <table className="superadmin-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Teacher</th>
                <th>Category</th>
                <th>Price</th>
                <th>Students</th>
                <th>Revenue</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {analytics.coursePerformance.slice(0, 10).map((course) => (
                <tr key={course.courseId}>
                  <td>
                    <strong>{course.title}</strong>
                    <br />
                    <span className={`badge info`}>{course.level}</span>
                  </td>
                  <td>
                    {course.teacher?.name || 'N/A'}
                    <br />
                    <small style={{ color: '#718096' }}>{course.teacher?.email}</small>
                  </td>
                  <td>{course.category}</td>
                  <td>₹{course.price}</td>
                  <td>{course.enrolledStudents}</td>
                  <td>₹{course.totalRevenue.toLocaleString()}</td>
                  <td>
                    ⭐ {course.rating.toFixed(1)} ({course.reviewCount})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTab;
