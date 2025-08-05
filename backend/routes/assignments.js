const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  requireRole, 
  requireStaff, 
  requireAssignmentAccess 
} = require('../middleware/roleAuth');
const assignmentController = require('../controllers/assignmentController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Assignment:
 *       type: object
 *       required:
 *         - issue
 *         - assignedTo
 *         - assignedBy
 *       properties:
 *         issue:
 *           type: string
 *         assignedTo:
 *           type: string
 *         estimatedCompletionTime:
 *           type: string
 *           format: date-time
 *         assignmentNotes:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         isUrgent:
 *           type: boolean
 */

/**
 * @swagger
 * /api/assignments:
 *   get:
 *     summary: Get all assignments (filtered by user role)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, in_progress, completed, rejected]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *     responses:
 *       200:
 *         description: List of assignments
 *       401:
 *         description: Not authenticated
 */
router.get('/', protect, assignmentController.getAssignments);

/**
 * @swagger
 * /api/assignments/technicians:
 *   get:
 *     summary: Get available technicians (committee only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of technicians
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.get('/technicians', protect, requireRole('committee'), assignmentController.getTechnicians);

/**
 * @swagger
 * /api/assignments/{assignmentId}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assignment details
 *       404:
 *         description: Assignment not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.get('/:assignmentId', protect, requireAssignmentAccess('read'), assignmentController.getAssignment);

/**
 * @swagger
 * /api/assignments/{assignmentId}:
 *   put:
 *     summary: Update assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Assignment'
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Assignment not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.put('/:assignmentId', protect, requireAssignmentAccess('update'), assignmentController.updateAssignment);

/**
 * @swagger
 * /api/assignments/{assignmentId}/accept:
 *   post:
 *     summary: Accept assignment (technician only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assignment accepted successfully
 *       404:
 *         description: Assignment not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.post('/:assignmentId/accept', protect, requireAssignmentAccess('update'), assignmentController.acceptAssignment);

/**
 * @swagger
 * /api/assignments/{assignmentId}/reject:
 *   post:
 *     summary: Reject assignment (technician only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment rejected successfully
 *       400:
 *         description: Rejection reason required
 *       404:
 *         description: Assignment not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.post('/:assignmentId/reject', protect, requireAssignmentAccess('update'), assignmentController.rejectAssignment);

/**
 * @swagger
 * /api/assignments/{assignmentId}/start:
 *   post:
 *     summary: Start work on assignment (technician only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work started successfully
 *       404:
 *         description: Assignment not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.post('/:assignmentId/start', protect, requireAssignmentAccess('update'), assignmentController.startWork);

/**
 * @swagger
 * /api/assignments/{assignmentId}/complete:
 *   post:
 *     summary: Complete assignment (technician only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completionNotes:
 *                 type: string
 *               timeSpent:
 *                 type: number
 *               materialsUsed:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     cost:
 *                       type: number
 *     responses:
 *       200:
 *         description: Assignment completed successfully
 *       404:
 *         description: Assignment not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.post('/:assignmentId/complete', protect, requireAssignmentAccess('complete'), assignmentController.completeAssignment);

/**
 * @swagger
 * /api/assignments/{assignmentId}/time:
 *   put:
 *     summary: Update time spent on assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timeSpent
 *             properties:
 *               timeSpent:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Time updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Assignment not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.put('/:assignmentId/time', protect, requireAssignmentAccess('update'), assignmentController.updateTimeSpent);

/**
 * @swagger
 * /api/assignments/analytics:
 *   get:
 *     summary: Get assignment analytics (staff only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *       - in: query
 *         name: technicianId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.get('/analytics', protect, requireStaff(), assignmentController.getAnalytics);

module.exports = router; 