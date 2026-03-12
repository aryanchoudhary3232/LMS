import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const SuperAdminContext = createContext();

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within SuperAdminProvider');
  }
  return context;
};

export const SuperAdminProvider = ({ children }) => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/superadmin/overview');
      if (response.data.success) {
        setOverview(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch overview');
      console.error('Overview fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueAnalytics = async () => {
    try {
      const response = await axios.get('/superadmin/revenue');
      return response.data;
    } catch (err) {
      console.error('Revenue analytics error:', err);
      throw err;
    }
  };

  const fetchUserGrowth = async (period = 30) => {
    try {
      const response = await axios.get(`/superadmin/analytics/user-growth?period=${period}`);
      return response.data;
    } catch (err) {
      console.error('User growth error:', err);
      throw err;
    }
  };

  const fetchTeacherPerformance = async () => {
    try {
      const response = await axios.get('/superadmin/analytics/teacher-performance');
      return response.data;
    } catch (err) {
      console.error('Teacher performance error:', err);
      throw err;
    }
  };

  const fetchCoursePerformance = async () => {
    try {
      const response = await axios.get('/superadmin/analytics/course-performance');
      return response.data;
    } catch (err) {
      console.error('Course performance error:', err);
      throw err;
    }
  };

  const fetchEnrollmentTrends = async (period = 30) => {
    try {
      const response = await axios.get(`/superadmin/analytics/enrollment-trends?period=${period}`);
      return response.data;
    } catch (err) {
      console.error('Enrollment trends error:', err);
      throw err;
    }
  };

  const fetchAllUsers = async (includeDeleted = false) => {
    try {
      const response = await axios.get(`/superadmin/users?includeDeleted=${includeDeleted}`);
      return response.data;
    } catch (err) {
      console.error('Fetch users error:', err);
      throw err;
    }
  };

  const fetchDeletedUsers = async () => {
    try {
      const response = await axios.get('/superadmin/users/deleted');
      return response.data;
    } catch (err) {
      console.error('Fetch deleted users error:', err);
      throw err;
    }
  };

  const restoreUser = async (userId, userType) => {
    try {
      const response = await axios.put(`/superadmin/users/${userId}/restore`, { userType });
      return response.data;
    } catch (err) {
      console.error('Restore user error:', err);
      throw err;
    }
  };

  const fetchCoursesByCategory = async (includeDeleted = false) => {
    try {
      const response = await axios.get(`/superadmin/courses/by-category?includeDeleted=${includeDeleted}`);
      return response.data;
    } catch (err) {
      console.error('Fetch courses by category error:', err);
      throw err;
    }
  };

  const fetchDeletedCourses = async () => {
    try {
      const response = await axios.get('/superadmin/courses/deleted');
      return response.data;
    } catch (err) {
      console.error('Fetch deleted courses error:', err);
      throw err;
    }
  };

  const restoreCourse = async (courseId) => {
    try {
      const response = await axios.put(`/superadmin/courses/${courseId}/restore`);
      return response.data;
    } catch (err) {
      console.error('Restore course error:', err);
      throw err;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = JSON.parse(localStorage.getItem('user'))?.role;
    
    if (token && userRole === 'SuperAdmin') {
      fetchOverview();
    }
  }, []);

  const value = {
    overview,
    loading,
    error,
    fetchOverview,
    fetchRevenueAnalytics,
    fetchUserGrowth,
    fetchTeacherPerformance,
    fetchCoursePerformance,
    fetchEnrollmentTrends,
    fetchAllUsers,
    fetchDeletedUsers,
    restoreUser,
    fetchCoursesByCategory,
    fetchDeletedCourses,
    restoreCourse
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
};

export default SuperAdminContext;
