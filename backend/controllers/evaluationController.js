/**
 * Evaluation Controller
 * 
 * Coaches evaluate student progress
 * Award badges and track skill development
 */

import { query } from '../config/database.js';

/**
 * POST /api/evaluations
 * 
 * Create student evaluation (Coach only)
 */
export const createEvaluation = async (req, res) => {
  try {
    const {
      enrollment_id,
      student_id,
      activity_id,
      evaluator_id,
      evaluation_date,
      term,
      overall_rating,
      skill_ratings,
      strengths,
      areas_for_improvement,
      coach_notes
    } = req.body;

    if (!enrollment_id || !student_id || !activity_id || !evaluator_id) {
      return res.status(400).json({
        success: false,
        message: 'enrollment_id, student_id, activity_id, and evaluator_id are required'
      });
    }

    // Validate overall_rating (0-5 scale)
    if (overall_rating && (overall_rating < 0 || overall_rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'overall_rating must be between 0 and 5'
      });
    }

    const insertQuery = `
      INSERT INTO student_evaluations 
      (enrollment_id, student_id, activity_id, evaluator_id, evaluation_date, term,
       overall_rating, skill_ratings, strengths, areas_for_improvement, coach_notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `;

    const result = await query(insertQuery, [
      enrollment_id,
      student_id,
      activity_id,
      evaluator_id,
      evaluation_date || new Date().toISOString().split('T')[0],
      term || null,
      overall_rating || null,
      skill_ratings ? JSON.stringify(skill_ratings) : null,
      strengths || null,
      areas_for_improvement || null,
      coach_notes || null
    ]);

    const evaluationResult = await query(
      'SELECT * FROM student_evaluations WHERE id = ?',
      [result.rows.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Evaluation created successfully',
      data: evaluationResult.rows[0]
    });

  } catch (error) {
    console.error('Error creating evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create evaluation',
      error: error.message
    });
  }
};

/**
 * PUT /api/evaluations/:id/publish
 * 
 * Publish evaluation (make visible to student/parent)
 */
export const publishEvaluation = async (req, res) => {
  try {
    const { id } = req.params;

    const updateQuery = `
      UPDATE student_evaluations 
      SET status = 'published', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(updateQuery, [id]);

    const evaluationResult = await query(
      'SELECT * FROM student_evaluations WHERE id = ?',
      [id]
    );

    if (evaluationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    // TODO: Send notification to student/parent

    res.json({
      success: true,
      message: 'Evaluation published successfully',
      data: evaluationResult.rows[0]
    });

  } catch (error) {
    console.error('Error publishing evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish evaluation',
      error: error.message
    });
  }
};

/**
 * GET /api/evaluations/student/:studentId
 * 
 * Get all evaluations for a student
 */
export const getStudentEvaluations = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { activity_id, term } = req.query;

    let evaluationsQuery = `
      SELECT 
        e.*,
        a.name as activity_name,
        a.category,
        i.name as evaluator_name
      FROM student_evaluations e
      JOIN activities a ON e.activity_id = a.id
      JOIN instructors i ON e.evaluator_id = i.id
      WHERE e.student_id = ? AND e.status = 'published'
    `;

    const params = [studentId];

    if (activity_id) {
      evaluationsQuery += ' AND e.activity_id = ?';
      params.push(activity_id);
    }

    if (term) {
      evaluationsQuery += ' AND e.term = ?';
      params.push(term);
    }

    evaluationsQuery += ' ORDER BY e.evaluation_date DESC';

    const result = await query(evaluationsQuery, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluations',
      error: error.message
    });
  }
};

/**
 * POST /api/badges/award
 * 
 * Award badge to student (Coach only)
 */
export const awardBadge = async (req, res) => {
  try {
    const { student_id, badge_id, enrollment_id, awarded_by, notes } = req.body;

    if (!student_id || !badge_id || !awarded_by) {
      return res.status(400).json({
        success: false,
        message: 'student_id, badge_id, and awarded_by are required'
      });
    }

    // Check if badge exists
    const badgeQuery = 'SELECT * FROM skill_badges WHERE id = ?';
    const badgeResult = await query(badgeQuery, [badge_id]);

    if (badgeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    // Award badge
    const insertQuery = `
      INSERT INTO student_badges (student_id, badge_id, enrollment_id, awarded_by, notes)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE awarded_at = CURRENT_TIMESTAMP
    `;

    await query(insertQuery, [
      student_id,
      badge_id,
      enrollment_id || null,
      awarded_by,
      notes || null
    ]);

    // Get complete badge info
    const awardedBadgeQuery = `
      SELECT sb.*, b.name, b.description, b.category, b.points
      FROM student_badges sb
      JOIN skill_badges b ON sb.badge_id = b.id
      WHERE sb.student_id = ? AND sb.badge_id = ?
    `;

    const result = await query(awardedBadgeQuery, [student_id, badge_id]);

    res.status(201).json({
      success: true,
      message: 'Badge awarded successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award badge',
      error: error.message
    });
  }
};

/**
 * GET /api/badges/student/:studentId
 * 
 * Get all badges earned by student
 */
export const getStudentBadges = async (req, res) => {
  try {
    const { studentId } = req.params;

    const badgesQuery = `
      SELECT 
        sb.*,
        b.name,
        b.description,
        b.category,
        b.icon_url,
        b.points
      FROM student_badges sb
      JOIN skill_badges b ON sb.badge_id = b.id
      WHERE sb.student_id = ?
      ORDER BY sb.awarded_at DESC
    `;

    const result = await query(badgesQuery, [studentId]);

    // Calculate total points
    const totalPoints = result.rows.reduce((sum, badge) => sum + (badge.points || 0), 0);

    res.json({
      success: true,
      count: result.rows.length,
      total_points: totalPoints,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch badges',
      error: error.message
    });
  }
};

export default {
  createEvaluation,
  publishEvaluation,
  getStudentEvaluations,
  awardBadge,
  getStudentBadges
};
