/**
 * Authentication Controller
 * Handles login, logout, and user session management
 */

import { query } from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Query user from database
    // Note: Adjust table name and structure based on your actual database schema
    const userQuery = `
      SELECT id, username, password_hash, role, name, email, status
      FROM users
      WHERE username = ? AND role = ? AND status = 'active'
    `;

    const result = await query(userQuery, [username, role || 'student']);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Verify password (if using bcrypt)
    // const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    // For demo purposes, accept any password
    // TODO: Implement proper password verification
    const isValidPassword = true;

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data without password
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Mock login for development/testing (remove in production)
 * POST /api/auth/mock-login
 */
export const mockLogin = async (req, res) => {
  try {
    const { username, role } = req.body;

    // Mock users for testing
    const mockUsers = {
      admin: { id: 1, name: 'Admin User', email: 'admin@school.edu', role: 'admin' },
      teacher: { id: 2, name: 'Teacher User', email: 'teacher@school.edu', role: 'teacher' },
      student: { id: 1001, name: 'Student User', email: 'student@school.edu', role: 'student' },
      parent: { id: 2001, name: 'Parent User', email: 'parent@school.edu', role: 'parent' }
    };

    const user = mockUsers[role] || mockUsers.student;
    user.username = username;

    // Generate mock token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Mock login successful',
      data: { user, token }
    });

  } catch (error) {
    console.error('Mock login error:', error);
    res.status(500).json({
      success: false,
      message: 'Mock login failed',
      error: error.message
    });
  }
};

/**
 * Verify JWT token middleware
 */
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userQuery = `
      SELECT id, username, name, email, role, created_at
      FROM users
      WHERE id = ?
    `;

    const result = await query(userQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Logout (client-side token removal, but can log activity)
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    // Optionally log logout activity
    const userId = req.user?.id;
    
    if (userId) {
      // You can log the logout event to database if needed
      console.log(`User ${userId} logged out at ${new Date().toISOString()}`);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};
