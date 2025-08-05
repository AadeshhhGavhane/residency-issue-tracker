const translationService = require('../services/translationService');
const logger = require('../config/logger');

/**
 * Translate text
 * @route POST /api/translate
 * @access Private
 */
const translateText = async (req, res) => {
  try {
    const { text, targetLanguage = 'hi' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const translatedText = await translationService.translateText(text, targetLanguage);

    logger.info(`Text translated: ${text.substring(0, 50)}... -> ${targetLanguage}`);

    res.json({
      success: true,
      data: {
        originalText: text,
        translatedText,
        targetLanguage
      }
    });

  } catch (error) {
    logger.error('Translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed'
    });
  }
};

/**
 * Translate object
 * @route POST /api/translate/object
 * @access Private
 */
const translateObject = async (req, res) => {
  try {
    const { object, targetLanguage = 'hi', translatableKeys = [] } = req.body;

    if (!object) {
      return res.status(400).json({
        success: false,
        message: 'Object is required'
      });
    }

    const translatedObject = await translationService.translateObject(
      object, 
      targetLanguage, 
      translatableKeys
    );

    logger.info(`Object translated to ${targetLanguage}`);

    res.json({
      success: true,
      data: {
        originalObject: object,
        translatedObject,
        targetLanguage
      }
    });

  } catch (error) {
    logger.error('Object translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Object translation failed'
    });
  }
};

/**
 * Get supported languages
 * @route GET /api/translate/languages
 * @access Private
 */
const getSupportedLanguages = async (req, res) => {
  try {
    const languages = await translationService.getSupportedLanguages();

    res.json({
      success: true,
      data: languages
    });

  } catch (error) {
    logger.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supported languages'
    });
  }
};

/**
 * Detect language
 * @route POST /api/translate/detect
 * @access Private
 */
const detectLanguage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const detectedLanguage = await translationService.detectLanguage(text);

    res.json({
      success: true,
      data: {
        text,
        detectedLanguage
      }
    });

  } catch (error) {
    logger.error('Language detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Language detection failed'
    });
  }
};

/**
 * Get translation cache stats
 * @route GET /api/translate/cache
 * @access Private (Admin only)
 */
const getCacheStats = async (req, res) => {
  try {
    const stats = translationService.getCacheStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics'
    });
  }
};

/**
 * Clear translation cache
 * @route DELETE /api/translate/cache
 * @access Private (Admin only)
 */
const clearCache = async (req, res) => {
  try {
    translationService.clearCache();

    res.json({
      success: true,
      message: 'Translation cache cleared'
    });

  } catch (error) {
    logger.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
};

module.exports = {
  translateText,
  translateObject,
  getSupportedLanguages,
  detectLanguage,
  getCacheStats,
  clearCache
}; 