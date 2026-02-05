/**
 * Authentication Routes
 * Handles user login, logout, and profile management
 */

import express from 'express';
import { login, mockLogin, getProfile, logout, verifyToken } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/mock-login
 * @desc    Mock login for development (remove in production)
 * @access  Public
 */
router.post('/mock-login', mockLogin);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Protected
 */
router.get('/profile', verifyToken, getProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Protected
 */
router.post('/logout', verifyToken, logout);

export default router;
