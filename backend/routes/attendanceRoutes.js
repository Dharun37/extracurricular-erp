/**
 * Attendance Routes
 * 
 * REST API endpoints for attendance management
 */

import express from 'express';
import { markAttendance } from '../controllers/attendanceController.js';

const router = express.Router();

// POST /api/attendance - Mark attendance
router.post('/', markAttendance);

export default router;
