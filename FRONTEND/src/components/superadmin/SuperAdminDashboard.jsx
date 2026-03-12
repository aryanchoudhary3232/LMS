import React, { useState, useEffect } from 'react';
import { useSuperAdmin } from '../../contexts/useSuperAdmin';
import '../../css/superadmin/SuperAdmin.css';
import OverviewTab from './OverviewTab';
import AnalyticsTab from './AnalyticsTab';
import UsersTab from './UsersTab';
import CoursesTab from './CoursesTab';
import DeletedItemsTab from './DeletedItemsTab';

const SuperAdminDashboard = () => {
  const { overview, loading, error, fetchOverview } = useSuperAdmin();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const renderContent = () => {
    if (loading && !overview) {
      return (
        <div className="superadmin-loading">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="superadmin-error">
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchOverview} className="action-btn">
            Retry
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewTab overview={overview} />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'users':
        return <UsersTab />;
      case 'courses':
        return <CoursesTab />;
      case 'deleted':
        return <DeletedItemsTab />;
      default:
        return <OverviewTab overview={overview} />;
    }
  };

  return (
    <div className="superadmin-dashboard">
      <div className="superadmin-container">
        <div className="superadmin-header">
          <h1>
            <span>👑</span>
            SuperAdmin Dashboard
          </h1>
          <div className="superadmin-nav">
            <button
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button
              className={activeTab === 'analytics' ? 'active' : ''}
              onClick={() => setActiveTab('analytics')}
            >
              📈 Analytics
            </button>
            <button
              className={activeTab === 'users' ? 'active' : ''}
              onClick={() => setActiveTab('users')}
            >
              👥 Users
            </button>
            <button
              className={activeTab === 'courses' ? 'active' : ''}
              onClick={() => setActiveTab('courses')}
            >
              📚 Courses
            </button>
            <button
              className={activeTab === 'deleted' ? 'active' : ''}
              onClick={() => setActiveTab('deleted')}
            >
              🗑️ Deleted Items
            </button>
          </div>
        </div>

        <div className="superadmin-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
