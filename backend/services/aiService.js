const axios = require('axios');
const logger = require('../config/logger');

class AIService {
  constructor() {
    this.priorityDetectorUrl = 'https://hiaa123.app.n8n.cloud/webhook/priority-detector';
  }

  /**
   * Detect priority level for an issue using AI
   * @param {string} title - Issue title
   * @param {string} description - Issue description
   * @param {string} category - Issue category
   * @returns {Promise<string>} - Priority level (low, medium, high, urgent)
   */
  async detectPriority(title, description, category) {
    try {
      const payload = {
        title: title,
        description: description,
        category: category
      };

      logger.info('Calling AI priority detector with payload:', payload);

      const response = await axios.post(this.priorityDetectorUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      const priority = response.data.priority;
      
      // Validate the returned priority
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        logger.warn(`AI returned invalid priority: ${priority}, defaulting to medium`);
        return 'medium';
      }

      logger.info(`AI detected priority: ${priority} for issue: ${title}`);
      return priority;

    } catch (error) {
      logger.error('Error calling AI priority detector:', error.message);
      
      // Return default priority on error
      return 'medium';
    }
  }
}

module.exports = new AIService(); 