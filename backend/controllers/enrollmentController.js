/**
 * Enrollment Controller
 * 
 * Handles student enrollment in activities
 * Integration note: When merging with main ERP:
 * - Validate student_id against main student table
 * - Add authentication to ensure students can only enroll themselves
 * - Add notification system for enrollment confirmations
 */

import { query, getClient } from '../config/database.js';

/**
 * Enroll a student in an activity
 * Body: { student_id, activity_id, notes (optional) }
 */
export const enrollStudent = async (req, res) => {
  try {
    const { student_id, activity_id, notes } = req.body;
    
    // Validation
    if (!student_id || !activity_id) {
      return res.status(400).json({
        success: false,
        message: 'student_id and activity_id are required'
      });
    }
    
    // Check if activity exists and has space
    const activityCheck = await query(
      `SELECT a.max_students, COUNT(ae.id) as enrolled_count
       FROM activities a
       LEFT JOIN activity_enrollments ae ON a.id = ae.activity_id AND ae.status = 'active'
       WHERE a.id = ?
       GROUP BY a.id, a.max_students`,
      [activity_id]
    );
    
    if (activityCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    const { max_students, enrolled_count } = activityCheck.rows[0];
    
    if (parseInt(enrolled_count) >= parseInt(max_students)) {
      return res.status(400).json({
        success: false,
        message: 'Activity is full. No more enrollments allowed.'
      });
    }
    
    // Check if already enrolled
    const existingEnrollment = await query(
      'SELECT * FROM activity_enrollments WHERE student_id = ? AND activity_id = ?',
      [student_id, activity_id]
    );
    
    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this activity'
      });
    }
    
    // Enroll student
    const enrollQuery = `
      INSERT INTO activity_enrollments (student_id, activity_id, status, notes)
      VALUES (?, ?, 'active', ?)
    `;
    
    const result = await query(enrollQuery, [student_id, activity_id, notes || null]);
    
    // Get the inserted record (MySQL returns ResultSetHeader with insertId)
    const insertedRecord = await query('SELECT * FROM activity_enrollments WHERE id = ?', [result.rows.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      data: insertedRecord.rows[0]
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this activity'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error enrolling student',
      error: error.message
    });
  }
};

/**
 * Get all enrollments for a specific student
 * Returns all activities the student is enrolled in
 */
export const getStudentEnrollments = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const queryText = `
      SELECT 
        ae.id as enrollment_id,
        ae.student_id,
        ae.status,
        ae.enrolled_at,
        ae.notes,
        a.id as activity_id,
        a.name as activity_name,
        a.category,
        a.coach_name,
        a.schedule,
        a.description
      FROM activity_enrollments ae
      JOIN activities a ON ae.activity_id = a.id
      WHERE ae.student_id = ?
      ORDER BY ae.enrolled_at DESC
    `;
    
    const result = await query(queryText, [studentId]);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student enrollments',
      error: error.message
    });
  }
};

/**
 * Get all enrollments (admin only)
 * Returns all enrollments in the system
 */
export const getAllEnrollments = async (req, res) => {
  try {
    const queryText = `
      SELECT 
        ae.id as enrollment_id,
        ae.student_id,
        ae.activity_id,
        ae.status,
        ae.enrolled_at,
        ae.notes,
        a.name as activity_name,
        a.category
      FROM activity_enrollments ae
      JOIN activities a ON ae.activity_id = a.id
      ORDER BY ae.enrolled_at DESC
    `;
    
    const result = await query(queryText);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching all enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all enrollments',
      error: error.message
    });
  }
};

/**
 * Get all students enrolled in a specific activity
 * Integration note: Will need to join with student table from main ERP
 */
export const getActivityEnrollments = async (req, res) => {
  try {
    const { activityId } = req.params;
    
    const queryText = `
      SELECT 
        ae.id as enrollment_id,
        ae.student_id,
        ae.status,
        ae.enrolled_at,
        ae.notes,
        a.name as activity_name
      FROM activity_enrollments ae
      JOIN activities a ON ae.activity_id = a.id
      WHERE ae.activity_id = ? AND ae.status IN ('active', 'approved', 'pending')
      ORDER BY ae.enrolled_at ASC
    `;
    
    const result = await query(queryText, [activityId]);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching activity enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity enrollments',
      error: error.message
    });
  }
};

/**
 * Withdraw a student from an activity
 * Updates status to 'withdrawn' instead of deleting
 */
export const withdrawEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    
    const queryText = `
      UPDATE activity_enrollments
      SET status = 'withdrawn'
      WHERE id = ?
    `;
    
    const result = await query(queryText, [enrollmentId]);
    
    if (result.rows.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Withdrawn from activity successfully'
    });
  } catch (error) {
    console.error('Error withdrawing enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Error withdrawing from activity',
      error: error.message
    });
  }
};

/**
 * Update enrollment status (for coach approval/rejection)
 * PATCH /api/enrollments/:enrollmentId/status
 */
export const updateEnrollmentStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['active', 'approved', 'rejected', 'withdrawn', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const queryText = `
      UPDATE activity_enrollments
      SET status = ?
      WHERE id = ?
    `;
    
    const result = await query(queryText, [status, enrollmentId]);
    
    if (result.rows.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    res.json({
      success: true,
      message: `Enrollment status updated to ${status}`,
      data: { id: enrollmentId, status }
    });
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating enrollment status',
      error: error.message
    });
  }
};

/**
 * Add performance remark to enrollment
 * PATCH /api/enrollments/:enrollmentId/remark
 */
export const addPerformanceRemark = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { remark } = req.body;
    
    if (!remark) {
      return res.status(400).json({
        success: false,
        message: 'Remark is required'
      });
    }
    
    const queryText = `
      UPDATE activity_enrollments
      SET performance_remarks = ?
      WHERE id = ?
    `;
    
    const result = await query(queryText, [remark, enrollmentId]);
    
    if (result.rows.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Performance remark added successfully',
      data: { id: enrollmentId, performance_remarks: remark }
    });
  } catch (error) {
    console.error('Error adding performance remark:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding performance remark',
      error: error.message
    });
  }
};

/**
 * Delete an enrollment (admin only)
 */
export const deleteEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    
    // Check if enrollment exists
    const checkResult = await query('SELECT id FROM activity_enrollments WHERE id = ?', [enrollmentId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    const queryText = 'DELETE FROM activity_enrollments WHERE id = ?';
    await query(queryText, [enrollmentId]);
    
    res.json({
      success: true,
      message: 'Enrollment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting enrollment',
      error: error.message
    });
  }
};

/**
 * Get enrollment statistics
 * Returns overall enrollment data for analytics
 */
export const getEnrollmentStats = async (req, res) => {
  try {
    const queryText = `
      SELECT 
        COUNT(DISTINCT student_id) as total_students,
        COUNT(DISTINCT activity_id) as total_activities_with_enrollments,
        COUNT(*) as total_enrollments,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_enrollments,
        SUM(CASE WHEN status = 'withdrawn' THEN 1 ELSE 0 END) as withdrawn_enrollments
      FROM activity_enrollments
    `;
    
    const result = await query(queryText);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching enrollment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment statistics',
      error: error.message
    });
  }
};
