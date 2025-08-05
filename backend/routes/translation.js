const express = require('express');
const router = express.Router();
const { 
  translateText, 
  translateObject, 
  getSupportedLanguages, 
  detectLanguage,
  getCacheStats,
  clearCache
} = require('../controllers/translationController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// Translate text
router.post('/text', protect, translateText);

// Translate object
router.post('/object', protect, translateObject);

// Get supported languages
router.get('/languages', protect, getSupportedLanguages);

// Detect language
router.post('/detect', protect, detectLanguage);

// Cache management (admin only)
router.get('/cache', protect, requireRole(['admin']), getCacheStats);
router.delete('/cache', protect, requireRole(['admin']), clearCache);

module.exports = router; 