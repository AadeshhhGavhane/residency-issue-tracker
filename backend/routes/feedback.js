const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const {
  submitFeedback,
  getIssueFeedback,
  getTechnicianRatings,
  getAllTechnicianRatings
} = require('../controllers/feedbackController');

// Submit feedback for completed issue
router.post('/', protect, submitFeedback);

// Get feedback for specific issue
router.get('/issue/:issueId', protect, getIssueFeedback);

// Get technician ratings (committee only)
router.get('/technician/:technicianId', protect, requireRole(['committee']), getTechnicianRatings);

// Get all technician ratings (committee only)
router.get('/technicians', protect, requireRole(['committee']), getAllTechnicianRatings);

module.exports = router; 