const winston = require('winston');
const { Transport } = require('winston');
const path = require('path');

// Initialize Logtail if enabled
let logtail = null;
if (process.env.LOGTAIL_ENABLED === 'true' && process.env.LOGTAIL_SOURCE_TOKEN) {
  try {
    const { Logtail } = require('@logtail/node');
    logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
  } catch (error) {
    console.warn('⚠️ Logtail initialization failed:', error.message);
  }
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Production-specific format (no sensitive data)
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Remove sensitive data in production
    const { password, token, ...safeMeta } = meta;
    return JSON.stringify({
      timestamp, level, message, ...safeMeta
    });
  })
);

// Create transports array
const transports = [
  // Always log to console (stdout) - industry standard
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Add Logtail transport if enabled
if (logtail) {
  // Custom Logtail transport using HTTP (like curl)
  const https = require('https');
  
  class LogtailTransport extends Transport {
    constructor(options) {
      super(options);
      this.token = process.env.LOGTAIL_SOURCE_TOKEN;
      this.host = 's1466516.eu-nbg-2.betterstackdata.com';
    }
    
    log(info, callback) {
      const data = JSON.stringify({
        dt: new Date().toISOString(),
        message: info.message,
        level: info.level,
        ...info
      });
      
      const options = {
        hostname: this.host,
        port: 443,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'Content-Length': Buffer.byteLength(data)
        }
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          callback();
        } else {
          console.error('Logtail HTTP error:', res.statusCode);
          callback();
        }
      });
      
      req.on('error', (error) => {
        console.error('Logtail request error:', error.message);
        callback();
      });
      
      req.write(data);
      req.end();
    }
  }
  
  const logtailTransport = new LogtailTransport({
    level: process.env.LOGTAIL_LEVEL || 'info'
  });
  
  // Set the name manually
  logtailTransport.name = 'logtail';
  
  transports.push(logtailTransport);
}

// File logging disabled - using Logtail for all logs

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: (process.env.NODE_ENV || 'development') === 'production' ? productionFormat : logFormat,
  transports
});

// Handle uncaught exceptions
const exceptionHandlers = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Add Logtail for exceptions if enabled
if (logtail) {
  class LogtailExceptionTransport extends Transport {
    constructor(options) {
      super(options);
      this.logtail = logtail;
    }
    
    async log(info, callback) {
      try {
        await this.logtail.error(info.message, { 
          level: info.level, 
          ...info 
        });
        callback();
      } catch (error) {
        console.error('Logtail exception error:', error.message);
        callback();
      }
    }
  }
  
  exceptionHandlers.push(new LogtailExceptionTransport({
    name: 'logtail-exceptions'
  }));
} else {
  // File exception logging disabled - using Logtail
}

logger.exceptionHandlers = exceptionHandlers;

// Handle unhandled promise rejections
const rejectionHandlers = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Add Logtail for rejections if enabled
if (logtail) {
  class LogtailRejectionTransport extends Transport {
    constructor(options) {
      super(options);
      this.logtail = logtail;
    }
    
    async log(info, callback) {
      try {
        await this.logtail.error(info.message, { 
          level: info.level, 
          ...info 
        });
        callback();
      } catch (error) {
        console.error('Logtail rejection error:', error.message);
        callback();
      }
    }
  }
  
  rejectionHandlers.push(new LogtailRejectionTransport({
    name: 'logtail-rejections'
  }));
} else {
  // File rejection logging disabled - using Logtail
}

logger.rejectionHandlers = rejectionHandlers;

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Enhanced logging with context
logger.info('Logger initialized', { 
  nodeEnv: process.env.NODE_ENV || 'development', 
  logLevel: process.env.LOG_LEVEL || 'info',
  logtailEnabled: !!logtail,
  transports: logger.transports.length,
  hasFileTransports: logger.transports.some(t => t.name === 'file'),
  hasLogtailTransport: logger.transports.some(t => t.name === 'logtail')
});

module.exports = logger; 