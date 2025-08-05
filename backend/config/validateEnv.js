const logger = require('./logger');

// Required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

// Optional environment variables with defaults
const optionalEnvVars = {
  'PORT': '5000',
  'NODE_ENV': 'development',
  'CORS_ORIGIN': 'http://localhost:3000',
  'RATE_LIMIT_WINDOW_MS': '900000',
  'RATE_LIMIT_MAX_REQUESTS': '100',
  'BCRYPT_ROUNDS': '12',
  'COOKIE_SECRET': 'your-cookie-secret-key',
  'LOG_LEVEL': 'info'
};

const validateEnvironment = () => {
  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Set optional variables with defaults
  Object.entries(optionalEnvVars).forEach(([varName, defaultValue]) => {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      warnings.push(`${varName} not set, using default: ${defaultValue}`);
    }
  });

  // Log validation results
  if (missing.length > 0) {
    logger.error('❌ Missing required environment variables:', missing);
    logger.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    warnings.forEach(warning => {
      logger.warn(`⚠️  ${warning}`);
    });
  }

  // Validate specific values
  const port = parseInt(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    logger.error('❌ Invalid PORT value. Must be a number between 1 and 65535.');
    process.exit(1);
  }

  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS);
  if (isNaN(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 14) {
    logger.error('❌ Invalid BCRYPT_ROUNDS value. Must be between 10 and 14.');
    process.exit(1);
  }

  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS);
  if (isNaN(rateLimitMax) || rateLimitMax < 1) {
    logger.error('❌ Invalid RATE_LIMIT_MAX_REQUESTS value. Must be a positive number.');
    process.exit(1);
  }

  logger.info('✅ Environment validation passed');
  logger.info(`🚀 Server will start on port ${process.env.PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`📊 Log level: ${process.env.LOG_LEVEL}`);
};

module.exports = validateEnvironment; 