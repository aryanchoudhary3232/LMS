import React, { useState, useEffect } from 'react';
import { useSuperAdmin } from '../../contexts/SuperAdminContext';

const DeletedItemsTab = () => {
  const { fetchDeletedUsers, fetchDeletedCourses, restoreUser, restoreCourse } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [deletedUsers, setDeletedUsers] = useState(null);
  const [deletedCourses, setDeletedCourses] = useState(null);
  const [activeView, setActiveView] = useState('users');
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadDeletedItems();
  }, []);

  const loadDeletedItems = async () => {
    try {
      setLoading(true);
      const [users, courses] = await Promise.all([
        fetchDeletedUsers(),
        fetchDeletedCourses()
      ]);
      setDeletedUsers(users.data);
      setDeletedCourses(courses.data);
    } catch (error) {
      console.error('Failed to load deleted items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreUser = async (userId, userType) => {
    if (!window.confirm(`Are you sure you want to restore this ${userType}?`)) {
      return;
    }

    try {
      setRestoring(true);
      await restoreUser(userId, userType);
      alert(`${userType} restored successfully!`);
      loadDeletedItems();
    } catch (error) {
      alert(`Failed to restore ${userType}: ${error.response?.data?.message || error.message}`);
    } finally {
      setRestoring(false);
    }
  };

  const handleRestoreCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to restore this course?')) {
      return;
    }

    try {
      setRestoring(true);
      await restoreCourse(courseId);
      alert('Course restored successfully!');
      loadDeletedItems();
    } catch (error) {
      alert(`Failed to restore course: ${error.response?.data?.message || error.message}`);
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="superadmin-loading">
        <div className="spinner"></div>
        <p>Loading deleted items...</p>
      </div>
    );
  }

  const totalDeletedUsers = (deletedUsers?.students?.length || 0) + 
                            (deletedUsers?.teachers?.length || 0) + 
                            (deletedUsers?.admins?.length || 0);

  return (
    <div>
      <h2>🗑️ Deleted Items</h2>

      {/* Stats Cards */}
      <div className="superadmin-stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="superadmin-stat-card">
          <span className="icon">👥</span>
          <h3>Deleted Users</h3>
          <span className="value">{totalDeletedUsers}</span>
          <span className="subtext">
            {deletedUsers?.students?.length || 0} students, {' '}
            {deletedUsers?.teachers?.length || 0} teachers, {' '}
            {deletedUsers?.admins?.length || 0} admins
          </span>
        </div>
        <div className="superadmin-stat-card">
          <span className="icon">📚</span>
          <h3>Deleted Courses</h3>
          <span className="value">{deletedCourses?.count || 0}</span>
        </div>
      </div>

      {/* View Switcher */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveView('users')}
          style={{
            padding: '0.75rem 1.5rem',
            marginRight: '1rem',
            background: activeView === 'users' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f7fafc',
            color: activeView === 'users' ? 'white' : '#4a5568',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          👥 Deleted Users ({totalDeletedUsers})
        </button>
        <button
          onClick={() => setActiveView('courses')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeView === 'courses' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f7fafc',
            color: activeView === 'courses' ? 'white' : '#4a5568',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📚 Deleted Courses ({deletedCourses?.count || 0})
        </button>
      </div>

      {/* Deleted Users View */}
      {activeView === 'users' && deletedUsers && (
        <div>
          {totalDeletedUsers === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
              <span style={{ fontSize: '3rem' }}>✨</span>
              <p>No deleted users found</p>
            </div>
          ) : (
            <>
              {/* Deleted Students */}
              {deletedUsers.students && deletedUsers.students.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>🎓 Deleted Students</h3>
                  <table className="superadmin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Deleted At</th>
                        <th>Enrolled Courses</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletedUsers.students.map((student) => (
                        <tr key={student._id}>
                          <td><strong>{student.name}</strong></td>
                          <td>{student.email}</td>
                          <td>{formatDate(student.deletedAt)}</td>
                          <td>{student.enrolledCourses?.length || 0}</td>
                          <td>
                            <button
                              onClick={() => handleRestoreUser(student._id, 'Student')}
                              disabled={restoring}
                              className="action-btn restore"
                            >
                              ♻️ Restore
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Deleted Teachers */}
              {deletedUsers.teachers && deletedUsers.teachers.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>👨‍🏫 Deleted Teachers</h3>
                  <table className="superadmin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Deleted At</th>
                        <th>Courses</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletedUsers.teachers.map((teacher) => (
                        <tr key={teacher._id}>
                          <td><strong>{teacher.name}</strong></td>
                          <td>{teacher.email}</td>
                          <td>{formatDate(teacher.deletedAt)}</td>
                          <td>{teacher.courses?.length || 0}</td>
                          <td>
                            <button
                              onClick={() => handleRestoreUser(teacher._id, 'Teacher')}
                              disabled={restoring}
                              className="action-btn restore"
                            >
                              ♻️ Restore
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Deleted Admins */}
              {deletedUsers.admins && deletedUsers.admins.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>🔐 Deleted Admins</h3>
                  <table className="superadmin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Deleted At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletedUsers.admins.map((admin) => (
                        <tr key={admin._id}>
                          <td><strong>{admin.name}</strong></td>
                          <td>{admin.email}</td>
                          <td><span className="badge warning">{admin.role}</span></td>
                          <td>{formatDate(admin.deletedAt)}</td>
                          <td>
                            <button
                              onClick={() => handleRestoreUser(admin._id, 'Admin')}
                              disabled={restoring}
                              className="action-btn restore"
                            >
                              ♻️ Restore
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Deleted Courses View */}
      {activeView === 'courses' && deletedCourses && (
        <div>
          {deletedCourses.count === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
              <span style={{ fontSize: '3rem' }}>✨</span>
              <p>No deleted courses found</p>
            </div>
          ) : (
            <table className="superadmin-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Teacher</th>
                  <th>Price</th>
                  <th>Students</th>
                  <th>Deleted At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deletedCourses.courses.map((course) => (
                  <tr key={course._id}>
                    <td>
                      <strong>{course.title}</strong>
                      <br />
                      <span className="badge info">{course.level}</span>
                    </td>
                    <td>{course.category}</td>
                    <td>
                      {course.teacher?.name || 'N/A'}
                      <br />
                      <small style={{ color: '#718096' }}>{course.teacher?.email}</small>
                    </td>
                    <td>₹{course.price}</td>
                    <td>{course.students?.length || 0}</td>
                    <td>{formatDate(course.deletedAt)}</td>
                    <td>
                      <button
                        onClick={() => handleRestoreCourse(course._id)}
                        disabled={restoring}
                        className="action-btn restore"
                      >
                        ♻️ Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default DeletedItemsTab;
