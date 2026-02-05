/**
 * Enhanced Routes with RBAC Integration
 * 
 * Combines all controllers with proper access control
 */

import express from 'express';

// Import controllers
import * as activityController from '../controllers/activityController.js';
import * as enhancedEnrollmentController from '../controllers/enhancedEnrollmentController.js';
import * as attendanceController from '../controllers/attendanceController.js';
import * as evaluationController from '../controllers/evaluationController.js';

// Import RBAC middleware
import {
  requireRole,
  requireAdmin,
  requireCoach,
  checkEnrollmentWindow,
  requireOwnStudentData,
  checkQuotaOverride,
  auditMiddleware
} from '../middleware/rbac.js';

const router = express.Router();

// ========================
// ACTIVITY ROUTES
// ========================

/**
 * GET /api/enhanced/activities
 * Public: Browse activity catalog
 */
router.get('/activities', activityController.getAllActivities);

/**
 * GET /api/enhanced/activities/:id
 * Public: View activity details
 */
router.get('/activities/:id', activityController.getActivityById);

/**
 * POST /api/enhanced/activities
 * Admin only: Create new activity
 */
router.post(
  '/activities',
  requireAdmin,
  auditMiddleware('CREATE_ACTIVITY'),
  activityController.createActivity
);

/**
 * PUT /api/enhanced/activities/:id
 * Admin only: Update activity
 */
router.put(
  '/activities/:id',
  requireAdmin,
  auditMiddleware('UPDATE_ACTIVITY'),
  activityController.updateActivity
);

/**
 * DELETE /api/enhanced/activities/:id
 * Admin only: Delete activity
 */
router.delete(
  '/activities/:id',
  requireAdmin,
  auditMiddleware('DELETE_ACTIVITY'),
  activityController.deleteActivity
);

// ========================
// ENHANCED ENROLLMENT ROUTES
// ========================

/**
 * POST /api/enhanced/enroll/register
 * Student/Parent: Register for activity (with conflict detection)
 * - Checks enrollment window
 * - Detects time conflicts
 * - Validates age/grade restrictions
 * - Handles waitlist automatically
 */
router.post(
  '/enroll/register',
  requireRole(['admin', 'student', 'parent']),
  checkEnrollmentWindow,
  auditMiddleware('ENROLL_STUDENT'),
  enhancedEnrollmentController.registerStudent
);

/**
 * DELETE /api/enhanced/enroll/:enrollmentId
 * Student/Parent/Admin: Cancel enrollment
 * - Automatically promotes from waitlist
 */
router.delete(
  '/enroll/:enrollmentId',
  requireRole(['admin', 'student', 'parent']),
  auditMiddleware('CANCEL_ENROLLMENT'),
  enhancedEnrollmentController.cancelEnrollment
);

/**
 * GET /api/enhanced/enroll/student/:studentId
 * Student/Parent (own data) or Admin: View enrollments
 */
router.get(
  '/enroll/student/:studentId',
  requireOwnStudentData,
  enhancedEnrollmentController.getStudentEnrollments
);

/**
 * GET /api/enhanced/enroll/conflicts/:studentId
 * Admin only: View enrollment conflicts for debugging
 */
router.get(
  '/enroll/conflicts/:studentId',
  requireAdmin,
  enhancedEnrollmentController.getEnrollmentConflicts
);

// ========================
// ATTENDANCE ROUTES
// ========================

/**
 * POST /api/enhanced/attendance/mark
 * Coach only: Mark attendance for session
 * - Coaches can only mark attendance for their activities
 */
router.post(
  '/attendance/mark',
  requireCoach,
  auditMiddleware('MARK_ATTENDANCE'),
  attendanceController.markAttendance
);

/**
 * GET /api/enhanced/attendance/session/:sessionId
 * Coach/Admin: View session attendance roster
 */
router.get(
  '/attendance/session/:sessionId',
  requireRole(['admin', 'coach']),
  attendanceController.getSessionAttendance
);

/**
 * GET /api/enhanced/attendance/student/:enrollmentId
 * Student/Parent (own data) or Coach/Admin: View student attendance
 */
router.get(
  '/attendance/student/:enrollmentId',
  requireRole(['admin', 'coach', 'student', 'parent']),
  attendanceController.getStudentAttendance
);

/**
 * GET /api/enhanced/attendance/report/:activityId
 * Coach/Admin: Generate attendance report for activity
 */
router.get(
  '/attendance/report/:activityId',
  requireRole(['admin', 'coach']),
  attendanceController.generateAttendanceReport
);

// ========================
// EVALUATION ROUTES
// ========================

/**
 * POST /api/enhanced/evaluations
 * Coach only: Create student evaluation
 */
router.post(
  '/evaluations',
  requireCoach,
  auditMiddleware('CREATE_EVALUATION'),
  evaluationController.createEvaluation
);

/**
 * PUT /api/enhanced/evaluations/:id/publish
 * Coach only: Publish evaluation (make visible to student/parent)
 */
router.put(
  '/evaluations/:id/publish',
  requireCoach,
  auditMiddleware('PUBLISH_EVALUATION'),
  evaluationController.publishEvaluation
);

/**
 * GET /api/enhanced/evaluations/student/:studentId
 * Student/Parent (own data) or Coach/Admin: View evaluations
 */
router.get(
  '/evaluations/student/:studentId',
  requireRole(['admin', 'coach', 'student', 'parent']),
  evaluationController.getStudentEvaluations
);

// ========================
// BADGE ROUTES
// ========================

/**
 * POST /api/enhanced/badges/award
 * Coach only: Award badge to student
 */
router.post(
  '/badges/award',
  requireCoach,
  auditMiddleware('AWARD_BADGE'),
  evaluationController.awardBadge
);

/**
 * GET /api/enhanced/badges/student/:studentId
 * Student/Parent (own data) or Coach/Admin: View earned badges
 */
router.get(
  '/badges/student/:studentId',
  requireRole(['admin', 'coach', 'student', 'parent']),
  evaluationController.getStudentBadges
);

// ========================
// ADMIN OVERRIDE ROUTES
// ========================

/**
 * POST /api/enhanced/admin/enroll-override
 * Admin only: Bypass quota and register student
 * - Ignores capacity limits
 * - Bypasses enrollment windows
 */
router.post(
  '/admin/enroll-override',
  requireAdmin,
  checkQuotaOverride,
  auditMiddleware('ADMIN_ENROLL_OVERRIDE'),
  enhancedEnrollmentController.registerStudent
);

export default router;
