const logger = require('../config/logger');

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to measure response time
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Log slow requests (>500ms)
    if (duration > 500) {
      logger.warn(`Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
    
    // Log all requests for analytics
    logger.info(`Request: ${req.method} ${req.originalUrl} - ${duration}ms`);
    
    // Add performance headers
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Request-ID', req.headers['x-request-id'] || generateRequestId());
    
    // Call original end function
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Generate unique request ID
const generateRequestId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Database query performance monitoring
const dbPerformanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Override mongoose query methods to track database performance
  const originalExec = require('mongoose').Query.prototype.exec;
  
  require('mongoose').Query.prototype.exec = function() {
    const queryStart = Date.now();
    
    return originalExec.apply(this, arguments).then((result) => {
      const queryDuration = Date.now() - queryStart;
      
      // Log slow queries (>100ms)
      if (queryDuration > 100) {
        logger.warn(`Slow query: ${this.op} - ${queryDuration}ms`);
      }
      
      return result;
    });
  };
  
  next();
};

module.exports = {
  performanceMonitor,
  dbPerformanceMonitor
}; 