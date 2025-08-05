const { Translate } = require('@google-cloud/translate').v2;
const logger = require('../config/logger');

class TranslationService {
  constructor() {
    // Initialize Google Translate with API key
    this.translate = new Translate({
      key: process.env.GOOGLE_TRANSLATE_API_KEY
    });

    // Translation cache to avoid repeated API calls
    this.cache = new Map();
    
    // Cache expiration time (24 hours)
    this.cacheExpiration = 24 * 60 * 60 * 1000;
  }

  /**
   * Get cached translation or fetch from API
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code (e.g., 'hi', 'en')
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, targetLanguage) {
    try {
      if (!text || !targetLanguage) {
        return text;
      }

      // Normalize text for caching
      const normalizedText = text.trim();
      
      // Check cache first
      const cacheKey = `${normalizedText}_${targetLanguage}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheExpiration) {
        logger.debug(`Translation cache hit for: ${normalizedText}`);
        return cached.translation;
      }

      // Detect source language (assume English if not specified)
      const sourceLanguage = 'en';
      
      // Skip translation if target language is same as source
      if (targetLanguage === sourceLanguage) {
        return normalizedText;
      }

      // Call Google Translate API
      const [translation] = await this.translate.translate(normalizedText, {
        from: sourceLanguage,
        to: targetLanguage
      });

      // Cache the result
      this.cache.set(cacheKey, {
        translation,
        timestamp: Date.now()
      });

      logger.debug(`Translation API call for: ${normalizedText} -> ${translation}`);
      return translation;

    } catch (error) {
      logger.error('Translation error:', error.message);
      // Return original text on error
      return text;
    }
  }

  /**
   * Translate an object with nested properties
   * @param {Object} obj - Object to translate
   * @param {string} targetLanguage - Target language code
   * @param {Array} translatableKeys - Array of keys to translate
   * @returns {Promise<Object>} Translated object
   */
  async translateObject(obj, targetLanguage, translatableKeys = []) {
    try {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      const translatedObj = { ...obj };

      for (const key of translatableKeys) {
        if (obj[key] && typeof obj[key] === 'string') {
          translatedObj[key] = await this.translateText(obj[key], targetLanguage);
        }
      }

      return translatedObj;
    } catch (error) {
      logger.error('Object translation error:', error.message);
      return obj;
    }
  }

  /**
   * Translate an array of objects
   * @param {Array} array - Array of objects to translate
   * @param {string} targetLanguage - Target language code
   * @param {Array} translatableKeys - Array of keys to translate
   * @returns {Promise<Array>} Translated array
   */
  async translateArray(array, targetLanguage, translatableKeys = []) {
    try {
      if (!Array.isArray(array)) {
        return array;
      }

      const translatedArray = [];
      
      for (const item of array) {
        if (typeof item === 'object') {
          const translatedItem = await this.translateObject(item, targetLanguage, translatableKeys);
          translatedArray.push(translatedItem);
        } else if (typeof item === 'string') {
          const translatedText = await this.translateText(item, targetLanguage);
          translatedArray.push(translatedText);
        } else {
          translatedArray.push(item);
        }
      }

      return translatedArray;
    } catch (error) {
      logger.error('Array translation error:', error.message);
      return array;
    }
  }

  /**
   * Get supported languages
   * @returns {Promise<Array>} Array of supported languages
   */
  async getSupportedLanguages() {
    try {
      const [languages] = await this.translate.getLanguages();
      return languages;
    } catch (error) {
      logger.error('Error getting supported languages:', error.message);
      return [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi' }
      ];
    }
  }

  /**
   * Detect language of text
   * @param {string} text - Text to detect language for
   * @returns {Promise<string>} Language code
   */
  async detectLanguage(text) {
    try {
      if (!text) {
        return 'en';
      }

      const [detection] = await this.translate.detect(text);
      return detection.language;
    } catch (error) {
      logger.error('Language detection error:', error.message);
      return 'en';
    }
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Translation cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()).slice(0, 10) // First 10 entries
    };
  }
}

// Create singleton instance
const translationService = new TranslationService();

module.exports = translationService; 