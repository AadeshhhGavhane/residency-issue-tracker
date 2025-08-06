const NodeCache = require('node-cache');

// Create cache instance with 5 minutes default TTL
const cache = new NodeCache({ stdTTL: 300 });

// Cache middleware for GET requests
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query params
    const key = `${req.originalUrl || req.url}`;
    
    // Check if response is cached
    const cachedResponse = cache.get(key);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store original send function
    const originalSend = res.json;
    
    // Override send function to cache response
    res.json = function(data) {
      // Cache the response
      cache.set(key, data, duration);
      
      // Add cache header
      res.setHeader('X-Cache', 'HIT');
      
      // Call original send function
      return originalSend.call(this, data);
    };

    next();
  };
};

// Clear cache for specific patterns
const clearCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  matchingKeys.forEach(key => cache.del(key));
};

// Clear all cache
const clearAllCache = () => {
  cache.flushAll();
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearAllCache,
  cache
}; 