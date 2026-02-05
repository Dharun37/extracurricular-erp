/**
 * Attendance Controller
 * 
 * Coaches can mark attendance for their sessions
 * Automatic session creation and attendance tracking
 */

import { query, getClient } from '../config/database.js';

/**
 * POST /api/attendance/mark
 * 
 * Mark attendance for a session (Coach only)
 * Supports two modes:
 * 1. Session-based: session_id, student_id, status
 * 2. Enrollment-based (simple): enrollment_id, activity_id, status
 */
export const markAttendance = async (req, res) => {
  try {
    const { session_id, student_id, enrollment_id, activity_id, status, remarks, notes, marked_by } = req.body;
    
    // Validate status
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Simple enrollment-based attendance (no sessions table required)
    if (enrollment_id && activity_id) {
      // Check if enrollment exists
      const enrollmentCheck = await query(
        'SELECT id, student_id FROM activity_enrollments WHERE id = ?',
        [enrollment_id]
      );
      
      if (enrollmentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Enrollment not found'
        });
      }

      const studentIdFromEnrollment = enrollmentCheck.rows[0].student_id;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if attendance already exists for today
      const existingAttendance = await query(
        'SELECT id FROM attendance WHERE enrollment_id = ? AND DATE(created_at) = ?',
        [enrollment_id, today]
      );

      if (existingAttendance.rows.length > 0) {
        // Update existing attendance
        await query(
          `UPDATE attendance SET status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE enrollment_id = ? AND DATE(created_at) = ?`,
          [status, notes || remarks || null, enrollment_id, today]
        );
      } else {
        // Insert new attendance record
        await query(
          `INSERT INTO attendance (enrollment_id, student_id, activity_id, status, remarks, created_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [enrollment_id, studentIdFromEnrollment, activity_id, status, notes || remarks || null]
        );
      }

      res.json({
        success: true,
        message: `Attendance marked as ${status}`,
        data: { enrollment_id, activity_id, status, date: today }
      });
      return;
    }

    // Session-based attendance (original logic)
    if (!session_id || !student_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'session_id, student_id, and status are required (or use enrollment_id and activity_id)'
      });
    }

    // Get enrollment_id
    const enrollmentQuery = `
      SELECT ae.id as enrollment_id, s.activity_id
      FROM sessions s
      JOIN activity_enrollments ae ON s.activity_id = ae.activity_id
      WHERE s.id = ? AND ae.student_id = ? AND ae.status = 'active'
    `;
    
    const enrollmentResult = await query(enrollmentQuery, [session_id, student_id]);
    
    if (enrollmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student is not enrolled in this activity'
      });
    }
    
    const enroll_id = enrollmentResult.rows[0].enrollment_id;

    // Upsert attendance (update if exists, insert if not)
    const upsertQuery = `
      INSERT INTO attendance 
      (session_id, student_id, enrollment_id, status, remarks, marked_by, check_in_time)
      VALUES (?, ?, ?, ?, ?, ?, 
        CASE WHEN ? IN ('present', 'late') THEN CURRENT_TIMESTAMP ELSE NULL END
      )
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        remarks = VALUES(remarks),
        marked_by = VALUES(marked_by),
        check_in_time = VALUES(check_in_time),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await query(upsertQuery, [
      session_id,
      student_id,
      enroll_id,
      status,
      remarks || null,
      marked_by,
      status
    ]);

    // Get the attendance record
    const attendanceResult = await query(
      'SELECT * FROM attendance WHERE session_id = ? AND student_id = ?',
      [session_id, student_id]
    );

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendanceResult.rows[0]
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

/**
 * GET /api/attendance/session/:sessionId
 * 
 * Get attendance for a specific session
 */
export const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const attendanceQuery = `
      SELECT 
        a.*,
        s.session_date,
        s.start_time,
        s.end_time,
        act.name as activity_name
      FROM attendance a
      JOIN sessions s ON a.session_id = s.id
      JOIN activities act ON s.activity_id = act.id
      WHERE a.session_id = ?
      ORDER BY a.student_id
    `;
    
    const result = await query(attendanceQuery, [sessionId]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching session attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};

/**
 * GET /api/attendance/student/:studentId
 * 
 * Get attendance history for a student
 */
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { activity_id, from_date, to_date } = req.query;

    let attendanceQuery = `
      SELECT 
        a.*,
        s.session_date,
        s.start_time,
        s.end_time,
        act.name as activity_name,
        act.category
      FROM attendance a
      JOIN sessions s ON a.session_id = s.id
      JOIN activities act ON s.activity_id = act.id
      WHERE a.student_id = ?
    `;
    
    const params = [studentId];
    
    if (activity_id) {
      attendanceQuery += ' AND act.id = ?';
      params.push(activity_id);
    }
    
    if (from_date) {
      attendanceQuery += ' AND s.session_date >= ?';
      params.push(from_date);
    }
    
    if (to_date) {
      attendanceQuery += ' AND s.session_date <= ?';
      params.push(to_date);
    }
    
    attendanceQuery += ' ORDER BY s.session_date DESC, s.start_time DESC';
    
    const result = await query(attendanceQuery, params);

    // Calculate statistics
    const stats = {
      total_sessions: result.rows.length,
      present: result.rows.filter(r => r.status === 'present').length,
      absent: result.rows.filter(r => r.status === 'absent').length,
      late: result.rows.filter(r => r.status === 'late').length,
      excused: result.rows.filter(r => r.status === 'excused').length
    };
    
    stats.attendance_rate = stats.total_sessions > 0 
      ? ((stats.present + stats.late) / stats.total_sessions * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      count: result.rows.length,
      statistics: stats,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};

/**
 * GET /api/attendance/report/:activityId
 * 
 * Generate attendance report for an activity
 */
export const generateAttendanceReport = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { from_date, to_date } = req.query;

    const reportQuery = `
      SELECT 
        ae.student_id,
        COUNT(DISTINCT s.id) as total_sessions,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_count,
        ROUND((SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) / 
               COUNT(DISTINCT s.id) * 100), 2) as attendance_rate
      FROM activity_enrollments ae
      JOIN sessions s ON ae.activity_id = s.activity_id
      LEFT JOIN attendance a ON s.id = a.session_id AND ae.student_id = a.student_id
      WHERE ae.activity_id = ?
      AND ae.status = 'active'
      ${from_date ? 'AND s.session_date >= ?' : ''}
      ${to_date ? 'AND s.session_date <= ?' : ''}
      GROUP BY ae.student_id
      ORDER BY attendance_rate DESC
    `;
    
    const params = [activityId];
    if (from_date) params.push(from_date);
    if (to_date) params.push(to_date);
    
    const result = await query(reportQuery, params);

    res.json({
      success: true,
      activity_id: activityId,
      period: { from: from_date, to: to_date },
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

export default {
  markAttendance,
  getSessionAttendance,
  getStudentAttendance,
  generateAttendanceReport
};
