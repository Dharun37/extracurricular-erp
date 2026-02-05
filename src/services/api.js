/**
 * API Service for Extra-Curricular Activity Module
 * 
 * Centralized service for making API calls to the backend
 * Integration note: Update BASE_URL when deploying or merging with main ERP
 */

const BASE_URL = 'http://localhost:5000/api';

/**
 * Generic fetch wrapper with error handling
 */
const fetchAPI = async (url, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ==================== Activity APIs ====================

/**
 * Get all activities
 * @param {string} category - Optional category filter
 * @returns {Promise} Activities data
 */
export const getAllActivities = async (category = null) => {
  const url = category ? `/activities?category=${category}` : '/activities';
  return fetchAPI(url);
};

/**
 * Get single activity by ID
 * @param {number} id - Activity ID
 * @returns {Promise} Activity data
 */
export const getActivityById = async (id) => {
  return fetchAPI(`/activities/${id}`);
};

/**
 * Create a new activity
 * @param {Object} activityData - Activity information
 * @returns {Promise} Created activity
 */
export const createActivity = async (activityData) => {
  return fetchAPI('/activities', {
    method: 'POST',
    body: JSON.stringify(activityData),
  });
};

/**
 * Update an existing activity
 * @param {number} id - Activity ID
 * @param {Object} activityData - Updated activity data
 * @returns {Promise} Updated activity
 */
export const updateActivity = async (id, activityData) => {
  return fetchAPI(`/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(activityData),
  });
};

/**
 * Delete an activity
 * @param {number} id - Activity ID
 * @returns {Promise} Delete confirmation
 */
export const deleteActivity = async (id) => {
  return fetchAPI(`/activities/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Get activities grouped by category
 * @returns {Promise} Activities by category
 */
export const getActivitiesByCategory = async () => {
  return fetchAPI('/activities/by-category');
};

// ==================== Enrollment APIs ====================

/**
 * Enroll a student in an activity
 * @param {number} studentId - Student ID
 * @param {number} activityId - Activity ID
 * @param {string} notes - Optional enrollment notes
 * @returns {Promise} Enrollment data
 */
export const enrollStudent = async (studentId, activityId, notes = '') => {
  return fetchAPI('/enrollments', {
    method: 'POST',
    body: JSON.stringify({
      student_id: studentId,
      activity_id: activityId,
      notes,
    }),
  });
};

/**
 * Get all enrollments for a specific student
 * @param {number} studentId - Student ID
 * @returns {Promise} Student's enrollments
 */
export const getStudentEnrollments = async (studentId) => {
  return fetchAPI(`/enrollments/student/${studentId}`);
};

/**
 * Get all enrollments (admin only)
 * @returns {Promise} All enrollments
 */
export const getAllEnrollments = async () => {
  return fetchAPI('/enrollments');
};

/**
 * Update enrollment status (coach approval/rejection)
 * @param {number} enrollmentId - Enrollment ID
 * @param {string} status - New status (approved, rejected, active, etc.)
 * @returns {Promise} Updated enrollment
 */
export const updateEnrollmentStatus = async (enrollmentId, status) => {
  return fetchAPI(`/enrollments/${enrollmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

/**
 * Add performance remark to enrollment
 * @param {number} enrollmentId - Enrollment ID
 * @param {string} remark - Performance remark text
 * @returns {Promise} Updated enrollment
 */
export const addPerformanceRemark = async (enrollmentId, remark) => {
  return fetchAPI(`/enrollments/${enrollmentId}/remark`, {
    method: 'PATCH',
    body: JSON.stringify({ remark }),
  });
};

/**
 * Mark attendance for a student
 * @param {number} enrollmentId - Enrollment ID
 * @param {number} activityId - Activity ID
 * @param {string} status - Attendance status (present, absent, late, excused)
 * @param {string} notes - Optional notes
 * @returns {Promise} Attendance record
 */
export const markAttendance = async (enrollmentId, activityId, status, notes = '') => {
  return fetchAPI('/attendance', {
    method: 'POST',
    body: JSON.stringify({
      enrollment_id: enrollmentId,
      activity_id: activityId,
      status,
      notes,
    }),
  });
};

/**
 * Get all students enrolled in a specific activity
 * @param {number} activityId - Activity ID
 * @returns {Promise} Activity's enrollments
 */
export const getActivityEnrollments = async (activityId) => {
  return fetchAPI(`/enrollments/activity/${activityId}`);
};

/**
 * Withdraw a student from an activity
 * @param {number} enrollmentId - Enrollment ID
 * @returns {Promise} Withdrawal confirmation
 */
export const withdrawEnrollment = async (enrollmentId) => {
  return fetchAPI(`/enrollments/${enrollmentId}/withdraw`, {
    method: 'PATCH',
  });
};

/**
 * Delete an enrollment (admin only)
 * @param {number} enrollmentId - Enrollment ID
 * @returns {Promise} Delete confirmation
 */
export const deleteEnrollment = async (enrollmentId) => {
  return fetchAPI(`/enrollments/${enrollmentId}`, {
    method: 'DELETE',
  });
};

/**
 * Get enrollment statistics
 * @returns {Promise} Enrollment stats
 */
export const getEnrollmentStats = async () => {
  return fetchAPI('/enrollments/stats');
};

/**
 * Health check
 * @returns {Promise} Server health status
 */
export const healthCheck = async () => {
  try {
    const response = await fetch(`http://localhost:5000/health`);
    return response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// ==================== User Management APIs ====================

/**
 * Get all users with optional filters
 */
export const getAllUsers = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  
  const url = `/users${params.toString() ? `?${params.toString()}` : ''}`;
  return fetchAPI(url);
};

/**
 * Get user by ID
 */
export const getUserById = async (id) => {
  return fetchAPI(`/users/${id}`);
};

/**
 * Create new user
 */
export const createUser = async (userData) => {
  return fetchAPI('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

/**
 * Update user
 */
export const updateUser = async (id, userData) => {
  return fetchAPI(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

/**
 * Delete user
 */
export const deleteUser = async (id) => {
  return fetchAPI(`/users/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Get user statistics
 */
export const getUserStats = async () => {
  return fetchAPI('/users/stats');
};

export default {
  // Activities
  getAllActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivitiesByCategory,
  
  // Enrollments
  enrollStudent,
  getAllEnrollments,
  getStudentEnrollments,
  getActivityEnrollments,
  withdrawEnrollment,
  deleteEnrollment,
  getEnrollmentStats,
  updateEnrollmentStatus,
  addPerformanceRemark,
  markAttendance,
  
  // Users
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  
  // Health
  healthCheck,
};
