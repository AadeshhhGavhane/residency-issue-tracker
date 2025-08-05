const express = require('express');
const { protect } = require('../middleware/auth');
const { uploadProfilePicture, handleUploadError } = require('../middleware/upload');
const { validateProfileUpdate } = require('../middleware/validation');
const {
  getCurrentUser,
  updateProfile,
  deleteAccount,
  updateLanguage
} = require('../controllers/userController');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve detailed information about the current authenticated user
 *     tags: [User Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', getCurrentUser);

/**
 * @swagger
 * /api/user/me:
 *   put:
 *     summary: Update user profile
 *     description: Update current user's name and/or profile picture
 *     tags: [User Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name (optional)
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "John Doe"
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: New profile picture (max 2MB, JPG/PNG/GIF/WebP)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/me', validateProfileUpdate, uploadProfilePicture, handleUploadError, updateProfile);

/**
 * @swagger
 * /api/user/me:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete the current user's account and all associated data
 *     tags: [User Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Account deleted successfully"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/me', deleteAccount);

/**
 * @swagger
 * /api/user/language:
 *   put:
 *     summary: Update user language preference
 *     description: Update the current user's preferred language
 *     tags: [User Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [en, hi]
 *                 description: User's preferred language
 *                 example: "hi"
 *     responses:
 *       200:
 *         description: Language preference updated successfully
 *         content:
 *           application/json:
 *             schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 example: "Language preference updated successfully"
 *               data:
 *                 type: object
 *                 properties:
 *                   user:
 *                     $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid language
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/language', updateLanguage);

module.exports = router; 