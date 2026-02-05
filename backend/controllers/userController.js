/**
 * User Controller
 * Handles user management operations
 */

import { query } from '../config/database.js';

// Get all users with optional filtering
export const getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    
    let sql = `
      SELECT u.*, 
        CASE 
          WHEN u.role = 'student' THEN s.student_code
          WHEN u.role = 'teacher' THEN t.employee_code
          ELSE NULL
        END as code,
        CASE 
          WHEN u.role = 'student' THEN s.grade
          ELSE NULL
        END as grade,
        CASE 
          WHEN u.role = 'student' THEN s.section
          ELSE NULL
        END as section,
        CASE 
          WHEN u.role = 'teacher' THEN t.department
          ELSE NULL
        END as department,
        CASE 
          WHEN u.role = 'teacher' THEN t.specialization
          ELSE NULL
        END as specialization
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id AND u.role = 'student'
      LEFT JOIN teachers t ON u.id = t.user_id AND u.role = 'teacher'
      WHERE 1=1
    `;
    
    const params = [];
    
    if (role) {
      sql += ' AND u.role = ?';
      params.push(role);
    }
    
    if (status) {
      sql += ' AND u.status = ?';
      params.push(status);
    }
    
    if (search) {
      sql += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    sql += ' ORDER BY u.role, u.first_name, u.last_name';
    
    const result = await query(sql, params);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT u.*, 
        s.student_code, s.grade, s.section, s.admission_date, s.emergency_contact,
        t.employee_code, t.department, t.specialization, t.qualification, t.join_date
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE u.id = ?
    `, [id]);
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const { 
      email, first_name, last_name, phone, role, status,
      date_of_birth, address,
      // Student-specific
      student_code, grade, section,
      // Teacher-specific
      employee_code, department, specialization, qualification
    } = req.body;
    
    // Insert into users table
    const userResult = await query(`
      INSERT INTO users (email, first_name, last_name, phone, role, status, date_of_birth, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [email, first_name, last_name, phone, role || 'student', status || 'active', date_of_birth, address]);
    
    const userId = userResult.insertId;
    
    // Insert role-specific data
    if (role === 'student') {
      await query(`
        INSERT INTO students (user_id, student_code, grade, section, admission_date)
        VALUES (?, ?, ?, ?, CURDATE())
      `, [userId, student_code, grade, section]);
    } else if (role === 'teacher') {
      await query(`
        INSERT INTO teachers (user_id, employee_code, department, specialization, qualification, join_date)
        VALUES (?, ?, ?, ?, ?, CURDATE())
      `, [userId, employee_code, department, specialization, qualification]);
    }
    
    res.status(201).json({ 
      message: 'User created successfully',
      id: userId 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      email, first_name, last_name, phone, status,
      date_of_birth, address,
      grade, section,
      department, specialization, qualification
    } = req.body;
    
    // Build dynamic UPDATE query based on provided fields
    const updates = [];
    const values = [];
    
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (first_name !== undefined) { updates.push('first_name = ?'); values.push(first_name); }
    if (last_name !== undefined) { updates.push('last_name = ?'); values.push(last_name); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (date_of_birth !== undefined) { updates.push('date_of_birth = ?'); values.push(date_of_birth); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }
    
    if (updates.length > 0) {
      values.push(id);
      await query(`
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = ?
      `, values);
    }
    
    // Get user role to update role-specific table
    const userResult = await query('SELECT role FROM users WHERE id = ?', [id]);
    const role = userResult.rows?.[0]?.role;
    
    if (role === 'student' && (grade !== undefined || section !== undefined)) {
      const studentUpdates = [];
      const studentValues = [];
      
      if (grade !== undefined) { studentUpdates.push('grade = ?'); studentValues.push(grade); }
      if (section !== undefined) { studentUpdates.push('section = ?'); studentValues.push(section); }
      
      if (studentUpdates.length > 0) {
        studentValues.push(id);
        await query(`
          UPDATE students SET ${studentUpdates.join(', ')} WHERE user_id = ?
        `, studentValues);
      }
    } else if (role === 'teacher' && (department !== undefined || specialization !== undefined || qualification !== undefined)) {
      const teacherUpdates = [];
      const teacherValues = [];
      
      if (department !== undefined) { teacherUpdates.push('department = ?'); teacherValues.push(department); }
      if (specialization !== undefined) { teacherUpdates.push('specialization = ?'); teacherValues.push(specialization); }
      if (qualification !== undefined) { teacherUpdates.push('qualification = ?'); teacherValues.push(qualification); }
      
      if (teacherUpdates.length > 0) {
        teacherValues.push(id);
        await query(`
          UPDATE teachers SET ${teacherUpdates.join(', ')} WHERE user_id = ?
        `, teacherValues);
      }
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const userResult = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user (cascades to students/teachers tables)
    await query('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as teachers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
      FROM users
    `);
    
    res.json(stats.rows?.[0] || {});
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
