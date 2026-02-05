/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Implements fine-grained permission system:
 * - Admin: Full control
 * - Coach/Instructor: Own roster only
 * - Student/Parent: Read catalog, write enrollments only during active windows
 */

import { query } from '../config/database.js';

/**
 * Check if user has required role
 */
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.body.user_id || req.query.user_id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Get user roles
      const rolesQuery = `
        SELECT role, entity_id, entity_type, expires_at
        FROM user_roles
        WHERE user_id = ?
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      `;
      
      const rolesResult = await query(rolesQuery, [userId]);
      
      if (rolesResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No roles assigned to user'
        });
      }

      const userRoles = rolesResult.rows.map(r => r.role);
      const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: allowedRoles,
          current: userRoles
        });
      }

      // Attach roles to request
      req.userRoles = rolesResult.rows;
      req.primaryRole = rolesResult.rows[0].role;
      
      next();
    } catch (error) {
      console.error('RBAC Error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};

/**
 * Admin-only actions
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Coach can only access their own activities
 */
export const requireCoach = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.body.user_id;
      const activityId = req.params.activityId || req.body.activity_id;
      
      if (!userId || !activityId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters'
        });
      }

      // Check if coach is assigned to this activity
      const coachQuery = `
        SELECT asch.id
        FROM activity_schedules asch
        JOIN instructors i ON asch.instructor_id = i.id
        WHERE i.user_id = ? AND asch.activity_id = ?
        LIMIT 1
      `;
      
      const result = await query(coachQuery, [userId, activityId]);
      
      if (result.rows.length === 0) {
        // Check if user is admin (admin can override)
        const rolesResult = await query(
          'SELECT role FROM user_roles WHERE user_id = ? AND role = "admin"',
          [userId]
        );
        
        if (rolesResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'You are not assigned to this activity'
          });
        }
      }

      req.isCoach = true;
      next();
    } catch (error) {
      console.error('Coach authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: error.message
      });
    }
  };
};

/**
 * Check if enrollment window is active
 */
export const checkEnrollmentWindow = async (req, res, next) => {
  try {
    const { activity_id } = req.body;
    
    if (!activity_id) {
      return res.status(400).json({
        success: false,
        message: 'activity_id is required'
      });
    }

    const activityQuery = `
      SELECT registration_start, registration_end, status
      FROM activities
      WHERE id = ?
    `;
    
    const result = await query(activityQuery, [activity_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    const activity = result.rows[0];
    const now = new Date();
    
    // Admin can override
    if (req.primaryRole === 'admin') {
      return next();
    }
    
    // Check if activity is active
    if (activity.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Activity is not currently active'
      });
    }
    
    // Check registration window
    if (activity.registration_start && new Date(activity.registration_start) > now) {
      return res.status(400).json({
        success: false,
        message: 'Registration has not started yet',
        registration_starts: activity.registration_start
      });
    }
    
    if (activity.registration_end && new Date(activity.registration_end) < now) {
      return res.status(400).json({
        success: false,
        message: 'Registration period has ended',
        registration_ended: activity.registration_end
      });
    }
    
    next();
  } catch (error) {
    console.error('Enrollment window check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify enrollment window',
      error: error.message
    });
  }
};

/**
 * Ensure student can only access their own data
 */
export const requireOwnStudentData = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const studentId = req.params.studentId || req.body.student_id;
    
    if (!userId || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Check if user is admin
    const adminCheck = await query(
      'SELECT role FROM user_roles WHERE user_id = ? AND role = "admin"',
      [userId]
    );
    
    if (adminCheck.rows.length > 0) {
      return next();
    }

    // Check if user is the student or parent of the student
    const accessQuery = `
      SELECT 1 FROM user_roles
      WHERE user_id = ?
      AND role IN ('student', 'parent')
      AND entity_id = ?
      AND entity_type = 'student'
    `;
    
    const accessResult = await query(accessQuery, [userId, studentId]);
    
    if (accessResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own student data'
      });
    }
    
    next();
  } catch (error) {
    console.error('Student data access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Access check failed',
      error: error.message
    });
  }
};

/**
 * Admin can override quota limits
 */
export const checkQuotaOverride = (req, res, next) => {
  if (req.primaryRole === 'admin' && req.body.override_quota === true) {
    req.quotaOverride = true;
  }
  next();
};

/**
 * Audit all write operations
 */
export const auditMiddleware = (actionName) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log after response is sent
      if (req.method !== 'GET' && data.success) {
        const auditData = {
          user_id: req.user?.id || req.body.user_id,
          action: actionName || `${req.method}_${req.baseUrl}${req.path}`,
          entity_type: req.body.entity_type || 'unknown',
          entity_id: req.body.id || data.data?.id,
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        };
        
        // Async log (don't wait for it)
        query(
          `INSERT INTO audit_log (user_id, action, entity_type, entity_id, ip_address, user_agent)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [auditData.user_id, auditData.action, auditData.entity_type, auditData.entity_id, 
           auditData.ip_address, auditData.user_agent]
        ).catch(err => console.error('Audit log error:', err));
      }
      
      originalJson.call(this, data);
    };
    
    next();
  };
};

export default {
  requireRole,
  requireAdmin,
  requireCoach,
  checkEnrollmentWindow,
  requireOwnStudentData,
  checkQuotaOverride,
  auditMiddleware
};
