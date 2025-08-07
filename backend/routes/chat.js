const express = require('express');
const { protect } = require('../middleware/auth');
const axios = require('axios');
const logger = require('../config/logger');

const router = express.Router();

/**
 * @swagger
 * /api/chat/webhook:
 *   post:
 *     summary: Proxy chat request to n8n webhook
 *     description: Forwards chat messages to n8n webhook for AI processing
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's message
 *               userId:
 *                 type: string
 *                 description: User ID
 *               userName:
 *                 type: string
 *                 description: User name
 *               userRole:
 *                 type: string
 *                 description: User role
 *     responses:
 *       200:
 *         description: Chat response from n8n
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   description: AI response
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/webhook', protect, async (req, res) => {
  try {
    const { message, userId, userName, userRole, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    logger.info('Forwarding chat message to n8n', {
      userId,
      userName,
      userRole,
      messageLength: message.length
    });


    const n8nResponse = await axios.post('http://localhost:5678/webhook/chat-assistant', {
      message,
      userId,
      userName,
      userRole,
      sessionId,
      authorization: req.headers.authorization // Pass the JWT token
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
  
    
    logger.info('Received response from n8n', {
      status: n8nResponse.status,
      responseLength: JSON.stringify(n8nResponse.data).length,
      responseData: n8nResponse.data
    });

    // Return the n8n response
    res.status(200).json(n8nResponse.data);

  } catch (error) {
    logger.error('Chat webhook error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      logger.warn('n8n webhook not available, returning fallback response');
      return res.status(200).json({
        response: `I received your message: "${message}". The AI chat service is currently unavailable, but I can help you with basic information about your issues.`
      });
    }

    if (error.response) {
      // Forward the error response from n8n
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({
      success: false,
      message: 'Error processing chat request'
    });
  }
});

module.exports = router; 