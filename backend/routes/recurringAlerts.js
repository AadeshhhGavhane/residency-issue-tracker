const express = require('express');
const router = express.Router();
const { getRecurringProblems, triggerRecurringDetection } = require('../controllers/recurringAlertController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// Get recurring problems for dashboard
router.get('/', protect, requireRole(['committee', 'admin']), getRecurringProblems);

// Manually trigger recurring problem detection
router.post('/detect', protect, requireRole(['committee', 'admin']), triggerRecurringDetection);

module.exports = router; 