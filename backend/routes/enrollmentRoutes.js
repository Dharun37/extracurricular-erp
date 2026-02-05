/**
 * Enrollment Routes
 * 
 * REST API endpoints for student enrollment management
 * Integration note: Add authentication middleware before routes when merging
 */

import express from 'express';
import {
  enrollStudent,
  getAllEnrollments,
  getStudentEnrollments,
  getActivityEnrollments,
  withdrawEnrollment,
  deleteEnrollment,
  getEnrollmentStats,
  updateEnrollmentStatus,
  addPerformanceRemark
} from '../controllers/enrollmentController.js';

const router = express.Router();

// POST /api/enrollments - Enroll student in an activity
router.post('/', enrollStudent);

// GET /api/enrollments - Get all enrollments (admin only)
router.get('/', getAllEnrollments);

// GET /api/enrollments/student/:studentId - Get all enrollments for a student
router.get('/student/:studentId', getStudentEnrollments);

// GET /api/enrollments/activity/:activityId - Get all students enrolled in an activity
router.get('/activity/:activityId', getActivityEnrollments);

// GET /api/enrollments/stats - Get enrollment statistics
router.get('/stats', getEnrollmentStats);

// PATCH /api/enrollments/:enrollmentId/status - Update enrollment status
router.patch('/:enrollmentId/status', updateEnrollmentStatus);

// PATCH /api/enrollments/:enrollmentId/remark - Add performance remark
router.patch('/:enrollmentId/remark', addPerformanceRemark);

// GET /api/enrollments/stats - Get enrollment statistics
router.get('/stats', getEnrollmentStats);

// PATCH /api/enrollments/:enrollmentId/withdraw - Withdraw from activity
router.patch('/:enrollmentId/withdraw', withdrawEnrollment);

// DELETE /api/enrollments/:enrollmentId - Delete enrollment (admin only)
router.delete('/:enrollmentId', deleteEnrollment);

export default router;
