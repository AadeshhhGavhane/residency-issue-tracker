require('dotenv').config();

console.log('=== ENVIRONMENT TEST ===');
console.log('LOGTAIL_ENABLED:', process.env.LOGTAIL_ENABLED);
console.log('LOGTAIL_SOURCE_TOKEN:', process.env.LOGTAIL_SOURCE_TOKEN ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Test logger
const logger = require('./config/logger');
console.log('=== LOGGER TEST ===');
console.log('Logger transports:', logger.transports.length);
console.log('Transport names:', logger.transports.map(t => t.name));

logger.info('Test log from environment test');
console.log('=== TEST COMPLETE ==='); 