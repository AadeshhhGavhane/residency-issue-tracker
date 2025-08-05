const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const connectDB = require('./config/db');
const validateEnvironment = require('./config/validateEnv');
const smartLogging = require('./middleware/logging');

// Load environment variables FIRST
dotenv.config();

// Clear require cache and import logger after environment variables are loaded
delete require.cache[require.resolve('./config/logger')];
const logger = require('./config/logger');

// Validate environment variables
validateEnvironment();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Smart request logging middleware
app.use(smartLogging);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const issueRoutes = require('./routes/issues');
const assignmentRoutes = require('./routes/assignments');

// Import Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Residential Society Issue Tracker API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      issues: '/api/issues',
      assignments: '/api/assignments'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/assignments', assignmentRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Residential Society Issue Tracker API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showCommonExtensions: true
  }
}));

// Import error handler
const errorHandler = require('./middleware/errorHandler');

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

module.exports = app; 