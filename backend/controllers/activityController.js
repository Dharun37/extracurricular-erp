/**
 * Activity Controller
 * 
 * Handles business logic for extra-curricular activities
 * Integration note: When merging with main ERP:
 * - Add proper authentication middleware
 * - Add role-based access control (admin/teacher can create, students can view)
 * - Integrate with main student table
 */

import { query } from '../config/database.js';

/**
 * Get all activities
 * Query params: ?category=sports (optional filter)
 */
export const getAllActivities = async (req, res) => {
  try {
    const { category } = req.query;
    
    let queryText = `
      SELECT 
        a.id,
        a.name,
        a.category,
        a.coach_id,
        CONCAT(u.first_name, ' ', u.last_name) as coach_name,
        a.schedule,
        a.venue,
        a.description,
        a.max_students,
        a.created_at,
        COUNT(ae.id) as enrolled_count
      FROM activities a
      LEFT JOIN users u ON a.coach_id = u.id
      LEFT JOIN activity_enrollments ae ON a.id = ae.activity_id AND ae.status = 'active'
    `;
    
    const params = [];
    
    if (category) {
      queryText += ' WHERE a.category = ?';
      params.push(category);
    }
    
    queryText += ' GROUP BY a.id ORDER BY a.created_at DESC';
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
};

/**
 * Get a single activity by ID
 */
export const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const queryText = `
      SELECT 
        a.*,
        CONCAT(u.first_name, ' ', u.last_name) as coach_name,
        COUNT(ae.id) as enrolled_count
      FROM activities a
      LEFT JOIN users u ON a.coach_id = u.id
      LEFT JOIN activity_enrollments ae ON a.id = ae.activity_id AND ae.status = 'active'
      WHERE a.id = ?
      GROUP BY a.id
    `;
    
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity',
      error: error.message
    });
  }
};

/**
 * Create a new activity
 * Integration note: Add authentication middleware to restrict to admin/teacher only
 */
export const createActivity = async (req, res) => {
  try {
    const { name, category, coach_id, schedule, description, max_students, venue } = req.body;
    
    // Validation
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }
    
    if (!coach_id) {
      return res.status(400).json({
        success: false,
        message: 'Coach/Teacher assignment is required'
      });
    }
    
    const queryText = `
      INSERT INTO activities (name, category, coach_id, schedule, description, max_students, venue)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      name,
      category,
      coach_id,
      schedule || null,
      description || null,
      max_students || 30,
      venue || null
    ];
    
    const result = await query(queryText, params);
    
    // Get the inserted record with coach name
    const insertedRecord = await query(`
      SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) as coach_name 
      FROM activities a 
      LEFT JOIN users u ON a.coach_id = u.id 
      WHERE a.id = ?
    `, [result.rows.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: insertedRecord.rows[0]
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating activity',
      error: error.message
    });
  }
};

/**
 * Update an activity
 * Integration note: Add authentication middleware to restrict to admin/teacher only
 */
export const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, coach_id, schedule, description, max_students, venue } = req.body;
    
    const queryText = `
      UPDATE activities
      SET 
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        coach_id = COALESCE(?, coach_id),
        schedule = COALESCE(?, schedule),
        description = COALESCE(?, description),
        max_students = COALESCE(?, max_students),
        venue = COALESCE(?, venue),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const params = [name, category, coach_id, schedule, description, max_students, venue, id];
    
    const result = await query(queryText, params);
    
    // Get the updated record with coach name
    const updatedRecord = await query(`
      SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) as coach_name 
      FROM activities a 
      LEFT JOIN users u ON a.coach_id = u.id 
      WHERE a.id = ?
    `, [id]);
    
    if (updatedRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: updatedRecord.rows[0]
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating activity',
      error: error.message
    });
  }
};

/**
 * Delete an activity
 * Integration note: Add authentication middleware to restrict to admin only
 */
export const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if activity exists
    const checkResult = await query('SELECT id FROM activities WHERE id = ?', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    const queryText = 'DELETE FROM activities WHERE id = ?';
    await query(queryText, [id]);
    
    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting activity',
      error: error.message
    });
  }
};

/**
 * Get activities by category
 */
export const getActivitiesByCategory = async (req, res) => {
  try {
    const queryText = `
      SELECT 
        category,
        COUNT(*) as count,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', id,
            'name', name,
            'coach_name', coach_name,
            'schedule', schedule
          )
        ) as activities
      FROM activities
      GROUP BY category
      ORDER BY category
    `;
    
    const result = await query(queryText);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching activities by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities by category',
      error: error.message
    });
  }
};
