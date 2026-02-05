/**
 * Activity Routes
 * 
 * REST API endpoints for activity management
 * Integration note: Add authentication middleware before routes when merging
 */

import express from 'express';
import {
  getAllActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivitiesByCategory
} from '../controllers/activityController.js';

const router = express.Router();

// GET /api/activities - Get all activities (with optional category filter)
router.get('/', getAllActivities);

// GET /api/activities/by-category - Get activities grouped by category
router.get('/by-category', getActivitiesByCategory);

// GET /api/activities/:id - Get single activity
router.get('/:id', getActivityById);

// POST /api/activities - Create new activity (admin/teacher only)
router.post('/', createActivity);

// PUT /api/activities/:id - Update activity (admin/teacher only)
router.put('/:id', updateActivity);

// DELETE /api/activities/:id - Delete activity (admin only)
router.delete('/:id', deleteActivity);

export default router;
