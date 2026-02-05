/**
 * Extra-Curricular Activity Module - Express Server
 * 
 * This is a self-contained backend for the extra-curricular activity module
 * 
 * Integration notes:
 * 1. When merging with main ERP:
 *    - Import authentication middleware from main ERP
 *    - Add role-based access control
 *    - Update database connection to use main ERP config
 *    - Link student_id to main student table
 * 2. Keep all routes under /api/activities and /api/enrollments
 * 3. This module is stateless and can be easily integrated
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import activityRoutes from './routes/activityRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import enhancedRoutes from './routes/enhancedRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware (development only)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Mock user middleware (for testing - replace with real auth in production)
app.use((req, res, next) => {
  // This simulates a logged-in user
  // In production, replace with actual JWT verification or session middleware
  req.user = {
    id: 1,
    role: 'admin', // Options: 'admin', 'coach', 'student', 'parent'
    studentId: null // Set this for students/parents
  };
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Extra-Curricular Activity Module API is running',
    timestamp: new Date().toISOString(),
    features: {
      basic_crud: true,
      enhanced_enrollment: true,
      conflict_detection: true,
      waitlist_management: true,
      attendance_tracking: true,
      evaluations: true,
      rbac: true
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/activities', activityRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/enhanced', enhancedRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  Extra-Curricular Activity Module - Backend       ║
║  Server running on http://localhost:${PORT}        ║
║  Environment: ${process.env.NODE_ENV || 'development'}                      ║
╚════════════════════════════════════════════════════╝
  
API Endpoints:
  GET    /health
  GET    /api/activities
  POST   /api/activities
  GET    /api/activities/:id
  PUT    /api/activities/:id
  DELETE /api/activities/:id
  GET    /api/activities/by-category
  
  POST   /api/enrollments
  GET    /api/enrollments/student/:studentId
  GET    /api/enrollments/activity/:activityId
  GET    /api/enrollments/stats
  PATCH  /api/enrollments/:enrollmentId/withdraw
  DELETE /api/enrollments/:enrollmentId
  `);
});

export default app;
