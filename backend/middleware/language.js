const translationService = require('../services/translationService');
const logger = require('../config/logger');

/**
 * Middleware to detect and set user's preferred language
 */
const detectLanguage = async (req, res, next) => {
  try {
    // Get language from query parameter, header, or user preference
    let targetLanguage = req.query.lang || req.headers['accept-language'] || 'en';
    
    // Extract language code (e.g., 'en-US' -> 'en')
    targetLanguage = targetLanguage.split('-')[0].toLowerCase();
    
    // Validate language
    if (!['en', 'hi'].includes(targetLanguage)) {
      targetLanguage = 'en';
    }
    
    // Set language in request object
    req.targetLanguage = targetLanguage;
    
    // If user is authenticated, use their language preference
    if (req.user && req.user.language) {
      req.targetLanguage = req.user.language;
    }
    
    next();
  } catch (error) {
    logger.error('Language detection error:', error);
    req.targetLanguage = 'en';
    next();
  }
};

/**
 * Middleware to translate API responses
 */
const translateResponse = async (req, res, next) => {
  try {
    // Store original send method
    const originalSend = res.json;
    
    // Override res.json to translate response
    res.json = async function(data) {
      try {
        // Only translate if target language is not English
        if (req.targetLanguage && req.targetLanguage !== 'en') {
          // Translate common response fields
          if (data.message) {
            data.message = await translationService.translateText(data.message, req.targetLanguage);
          }
          
          // Translate data object if it exists
          if (data.data) {
            if (Array.isArray(data.data)) {
              // Translate array of objects
              data.data = await translationService.translateArray(
                data.data, 
                req.targetLanguage, 
                ['title', 'description', 'category', 'status', 'message']
              );
            } else if (typeof data.data === 'object') {
              // Translate single object
              data.data = await translationService.translateObject(
                data.data, 
                req.targetLanguage, 
                ['title', 'description', 'category', 'status', 'message', 'name', 'email']
              );
            }
          }
          
          // Translate error messages
          if (data.error) {
            data.error = await translationService.translateText(data.error, req.targetLanguage);
          }
        }
        
        // Call original send method
        return originalSend.call(this, data);
      } catch (error) {
        logger.error('Response translation error:', error);
        // Fallback to original response
        return originalSend.call(this, data);
      }
    };
    
    next();
  } catch (error) {
    logger.error('Translate response middleware error:', error);
    next();
  }
};

/**
 * Middleware to update user's language preference
 */
const updateUserLanguage = async (req, res, next) => {
  try {
    if (req.user && req.targetLanguage && req.user.language !== req.targetLanguage) {
      // Update user's language preference in database
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user._id, { language: req.targetLanguage });
      req.user.language = req.targetLanguage;
    }
    next();
  } catch (error) {
    logger.error('Update user language error:', error);
    next();
  }
};

module.exports = {
  detectLanguage,
  translateResponse,
  updateUserLanguage
}; 