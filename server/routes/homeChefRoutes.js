const express = require('express');
const router = express.Router();
const {
  submitApplication,
  getMyApplication,
  getAllApplications,
  approveApplication,
  rejectApplication
} = require('../controllers/homeChefController');
const { protect, admin } = require('../middleware/auth');

// Logged-in user routes
router.post('/apply', protect, submitApplication);
router.get('/me', protect, getMyApplication);

// Admin-only routes
router.get('/admin/applications', protect, admin, getAllApplications);
router.put('/admin/applications/:id/approve', protect, admin, approveApplication);
router.put('/admin/applications/:id/reject', protect, admin, rejectApplication);

module.exports = router;
