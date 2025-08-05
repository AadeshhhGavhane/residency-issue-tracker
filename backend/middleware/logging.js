const logger = require('../config/logger');

// Industry-standard smart logging configuration
const IGNORED_PATHS = [
  '/api/health',
  '/api-docs',
  '/api-docs/',
  '/favicon.ico',
  '/robots.txt',
  '/swagger-ui',
  '/swagger.json'
];

// Compliance and security-critical events (always log)
const COMPLIANCE_EVENTS = [
  '/api/auth/login',
  '/api/auth/register', 
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/user/me'
];

// Performance monitoring events
const PERFORMANCE_EVENTS = [
  '/api/user/me',
  '/api/auth/login',
  '/api/auth/register'
];

const smartLogging = (req, res, next) => {
  const start = Date.now();
  
  // Skip ignored paths (noise reduction)
  if (IGNORED_PATHS.includes(req.path)) {
    return next();
  }
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    // Determine log level based on industry standards
    let logLevel = 'info';
    let shouldLog = false;
    
    // Compliance events - always log (GDPR/CCPA requirements)
    if (COMPLIANCE_EVENTS.includes(req.path)) {
      logLevel = 'info';
      shouldLog = true;
    }
    // Performance monitoring - log in development
    else if (PERFORMANCE_EVENTS.includes(req.path) && (process.env.NODE_ENV || 'development') === 'development') {
      logLevel = 'info';
      shouldLog = true;
    }
    // Server errors (5xx) - always log
    else if (res.statusCode >= 500) {
      logLevel = 'error';
      shouldLog = true;
    }
    // Security events (4xx on auth endpoints) - always log
    else if (res.statusCode >= 400 && req.path.startsWith('/api/auth/')) {
      logLevel = 'warn';
      shouldLog = true;
    }
    // All API requests in development (for debugging)
    else if (req.path.startsWith('/api/') && (process.env.NODE_ENV || 'development') === 'development') {
      logLevel = 'debug';
      shouldLog = true;
    }
    
    // Add user info if authenticated
    if (req.user) {
      logData.userId = req.user._id;
      logData.userEmail = req.user.email;
    }
    
    // Add compliance context
    if (COMPLIANCE_EVENTS.includes(req.path)) {
      logData.complianceEvent = true;
      logData.gdprArticle = 'Article 30 - Records of processing activities';
    }
    
    // Log only if shouldLog is true
    if (shouldLog) {
      logger.log(logLevel, `${req.method} ${req.path}`, logData);
    }
  });
  
  next();
};

module.exports = smartLogging; 