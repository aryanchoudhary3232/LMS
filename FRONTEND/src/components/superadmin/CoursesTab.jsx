import React, { useState, useEffect, useCallback } from 'react';
import { useSuperAdmin } from '../../contexts/useSuperAdmin';

const CoursesTab = () => {
  const { fetchCoursesByCategory } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [coursesData, setCoursesData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchCoursesByCategory(false);
      setCoursesData(response.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchCoursesByCategory]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  if (loading) {
    return (
      <div className="superadmin-loading">
        <div className="spinner"></div>
        <p>Loading courses...</p>
      </div>
    );
  }

  if (!coursesData || coursesData.length === 0) {
    return <div>No courses data available</div>;
  }

  const getFilteredCourses = () => {
    let allCourses = [];
    
    if (selectedCategory === 'all') {
      coursesData.forEach(cat => {
        allCourses = [...allCourses, ...cat.courses.map(c => ({ ...c, category: cat._id }))];
      });
    } else {
      const category = coursesData.find(c => c._id === selectedCategory);
      if (category) {
        allCourses = category.courses.map(c => ({ ...c, category: category._id }));
      }
    }

    if (searchTerm) {
      allCourses = allCourses.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return allCourses;
  };

  const filteredCourses = getFilteredCourses();
  const totalCourses = coursesData.reduce((sum, cat) => sum + cat.totalCourses, 0);
  const totalStudents = coursesData.reduce((sum, cat) => sum + cat.totalStudents, 0);

  return (
    <div>
      <h2>📚 Course Management</h2>

      {/* Stats Cards */}
      <div className="superadmin-stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="superadmin-stat-card">
          <span className="icon">📖</span>
          <h3>Total Courses</h3>
          <span className="value">{totalCourses}</span>
        </div>
        <div className="superadmin-stat-card">
          <span className="icon">🏷️</span>
          <h3>Categories</h3>
          <span className="value">{coursesData.length}</span>
        </div>
        <div className="superadmin-stat-card">
          <span className="icon">🎓</span>
          <h3>Total Enrollments</h3>
          <span className="value">{totalStudents}</span>
        </div>
        <div className="superadmin-stat-card">
          <span className="icon">📊</span>
          <h3>Avg Students/Course</h3>
          <span className="value">{Math.round(totalStudents / totalCourses)}</span>
        </div>
      </div>

      {/* Category Stats */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>📊 Courses by Category</h3>
        <div className="superadmin-stats-grid">
          {coursesData.map((category) => (
            <div key={category._id} className="superadmin-stat-card">
              <h3>{category._id || 'Uncategorized'}</h3>
              <span className="value">{category.totalCourses}</span>
              <span className="subtext">{category.totalStudents} total students</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="superadmin-filter-bar">
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {coursesData.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat._id} ({cat.totalCourses})
            </option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="🔍 Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />

        <button 
          onClick={loadCourses}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Courses Table */}
      <table className="superadmin-table">
        <thead>
          <tr>
            <th>Course</th>
            <th>Category</th>
            <th>Level</th>
            <th>Teacher</th>
            <th>Price</th>
            <th>Students</th>
          </tr>
        </thead>
        <tbody>
          {filteredCourses.map((course) => (
            <tr key={course.id}>
              <td>
                <strong>{course.title}</strong>
              </td>
              <td>
                <span className="badge info">{course.category}</span>
              </td>
              <td>
                <span className="badge success">{course.level}</span>
              </td>
              <td>
                {course.teacher?.name || 'N/A'}
                <br />
                <small style={{ color: '#718096' }}>{course.teacher?.email}</small>
              </td>
              <td>₹{course.price}</td>
              <td>{course.studentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredCourses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
          <p>No courses found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default CoursesTab;
