import React, { useState, useEffect } from 'react';
import { useSuperAdmin } from '../../contexts/SuperAdminContext';

const UsersTab = () => {
  const { fetchAllUsers } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [usersData, setUsersData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchAllUsers(false);
      setUsersData(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="superadmin-loading">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (!usersData) return null;

  const { stats, students, teachers, admins } = usersData;

  const getFilteredUsers = () => {
    let users = [];
    
    if (filter === 'all' || filter === 'students') {
      users = [...users, ...students.map(u => ({ ...u, type: 'Student' }))];
    }
    if (filter === 'all' || filter === 'teachers') {
      users = [...users, ...teachers.map(u => ({ ...u, type: 'Teacher' }))];
    }
    if (filter === 'all' || filter === 'admins') {
      users = [...users, ...admins.map(u => ({ ...u, type: 'Admin' }))];
    }

    if (searchTerm) {
      users = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return users;
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div>
      <h2>👥 User Management</h2>

      {/* Stats Cards */}
      <div className="superadmin-stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="superadmin-stat-card">
          <span className="icon">👤</span>
          <h3>Total Users</h3>
          <span className="value">{stats.totalUsers}</span>
        </div>
        <div className="superadmin-stat-card">
          <span className="icon">🎓</span>
          <h3>Students</h3>
          <span className="value">{stats.students}</span>
        </div>
        <div className="superadmin-stat-card">
          <span className="icon">👨‍🏫</span>
          <h3>Teachers</h3>
          <span className="value">{stats.teachers}</span>
        </div>
        <div className="superadmin-stat-card">
          <span className="icon">🔐</span>
          <h3>Admins</h3>
          <span className="value">{stats.admins}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="superadmin-filter-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Users</option>
          <option value="students">Students Only</option>
          <option value="teachers">Teachers Only</option>
          <option value="admins">Admins Only</option>
        </select>
        
        <input
          type="text"
          placeholder="🔍 Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />

        <button 
          onClick={loadUsers}
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

      {/* Users Table */}
      <table className="superadmin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Type</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user._id}>
              <td>
                <strong>{user.name}</strong>
              </td>
              <td>{user.email}</td>
              <td>
                <span className={`badge ${
                  user.type === 'Student' ? 'info' : 
                  user.type === 'Teacher' ? 'success' : 
                  'warning'
                }`}>
                  {user.type}
                </span>
              </td>
              <td>
                {user.type === 'Teacher' ? (
                  <span className={`badge ${
                    user.verificationStatus === 'Verified' ? 'success' :
                    user.verificationStatus === 'Pending' ? 'warning' :
                    user.verificationStatus === 'Rejected' ? 'danger' :
                    'info'
                  }`}>
                    {user.verificationStatus}
                  </span>
                ) : (
                  <span className="badge success">Active</span>
                )}
              </td>
              <td>
                {user.type === 'Student' && (
                  <span style={{ fontSize: '0.85rem', color: '#718096' }}>
                    Enrolled: {user.enrolledCourses?.length || 0} courses
                  </span>
                )}
                {user.type === 'Teacher' && (
                  <span style={{ fontSize: '0.85rem', color: '#718096' }}>
                    Created: {user.courses?.length || 0} courses
                  </span>
                )}
                {user.type === 'Admin' && (
                  <span style={{ fontSize: '0.85rem', color: '#718096' }}>
                    Role: {user.role}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredUsers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
          <p>No users found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default UsersTab;
