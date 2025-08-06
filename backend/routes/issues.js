const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  requireRole, 
  requireStaff, 
  requireIssueAccess 
} = require('../middleware/roleAuth');
const { upload } = require('../middleware/upload');
const { cacheMiddleware } = require('../middleware/cache');
const issueController = require('../controllers/issueController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Issue:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *         - priority
 *         - location
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 1000
 *         category:
 *           type: string
 *           enum: [sanitation, security, water, electricity, elevator, noise, parking, maintenance, cleaning, pest_control, landscaping, fire_safety, other]
 *         customCategory:
 *           type: string
 *           maxLength: 50
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               default: Point
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               minItems: 2
 *               maxItems: 2
 *         address:
 *           type: object
 *           properties:
 *             blockNumber:
 *               type: string
 *             apartmentNumber:
 *               type: string
 *             floorNumber:
 *               type: string
 *             area:
 *               type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/issues:
 *   post:
 *     summary: Report a new issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               customCategory:
 *                 type: string
 *               priority:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               blockNumber:
 *                 type: string
 *               apartmentNumber:
 *                 type: string
 *               floorNumber:
 *                 type: string
 *               area:
 *                 type: string
 *               tags:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Issue created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 */
router.post('/', protect, upload.array('media', 10), issueController.createIssue);

/**
 * @swagger
 * /api/issues:
 *   get:
 *     summary: Get all issues (filtered by user role)
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, assigned, in_progress, resolved, closed]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
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
 *         description: List of issues
 *       401:
 *         description: Not authenticated
 */
router.get('/', protect, cacheMiddleware(180), issueController.getIssues); // Cache for 3 minutes

/**
 * @swagger
 * /api/issues/admin/all:
 *   get:
 *     summary: Get all issues (admin/committee only)
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: All issues retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied (not admin/committee)
 */
router.get('/admin/all', protect, requireStaff(), cacheMiddleware(180), issueController.getAllIssues); // Cache for 3 minutes

/**
 * @swagger
 * /api/issues/categories:
 *   get:
 *     summary: Get available issue categories
 *     tags: [Issues]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', cacheMiddleware(3600), issueController.getCategories); // Cache for 1 hour

/**
 * @swagger
 * /api/issues/analytics:
 *   get:
 *     summary: Get issue analytics (staff only)
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *       - in: query
 *         name: category
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
router.get('/analytics', protect, requireStaff(), cacheMiddleware(300), issueController.getAnalytics); // Cache for 5 minutes

/**
 * @swagger
 * /api/issues/{issueId}:
 *   get:
 *     summary: Get specific issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue details
 *       404:
 *         description: Issue not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.get('/:issueId', protect, requireIssueAccess('read'), cacheMiddleware(300), issueController.getIssue); // Cache for 5 minutes

/**
 * @swagger
 * /api/issues/{issueId}:
 *   put:
 *     summary: Update issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Issue'
 *     responses:
 *       200:
 *         description: Issue updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Issue not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.put('/:issueId', protect, requireIssueAccess('update'), issueController.updateIssue);

/**
 * @swagger
 * /api/issues/{issueId}:
 *   delete:
 *     summary: Delete issue (committee only)
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue deleted successfully
 *       404:
 *         description: Issue not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.delete('/:issueId', protect, requireIssueAccess('delete'), issueController.deleteIssue);

/**
 * @swagger
 * /api/issues/{issueId}/assign:
 *   post:
 *     summary: Assign issue to technician (committee only)
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: issueId
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
 *               - technicianId
 *             properties:
 *               technicianId:
 *                 type: string
 *               estimatedCompletionTime:
 *                 type: number
 *               assignmentNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Issue assigned successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Issue or technician not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.post('/:issueId/assign', protect, requireIssueAccess('assign'), issueController.assignIssue);

/**
 * @swagger
 * /api/issues/{issueId}/status:
 *   put:
 *     summary: Update issue status
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: issueId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, assigned, in_progress, resolved, closed]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Issue not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.put('/:issueId/status', protect, requireIssueAccess('update'), issueController.updateIssueStatus);

module.exports = router; 