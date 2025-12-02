/**
 * Artisan Apparel Backend Server
 * ==============================
 * Main application entry point.
 * Artisan Bitcoin Inc. DBA Artisan Apparel
 * 
 * E-commerce platform with cryptocurrency payment processing,
 * print-on-demand fulfillment, and automated order management.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./src/config/env');
const { testConnection, syncDatabase } = require('./src/config/database');
const logger = require('./src/utils/logger');
const { captureRawBody } = require('./src/middleware/validateWebhook');

// Import routes
const orderRoutes = require('./src/routes/orders');
const paymentRoutes = require('./src/routes/payments');
const reviewRoutes = require('./src/routes/reviews');
const webhookRoutes = require('./src/routes/webhooks');

// Create Express app
const app = express();

// ============ Security Middleware ============

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: config.isProduction 
    ? [config.urls.frontend, /\.artisanapparel\.com$/]
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Webhook-Signature'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for webhooks
    return req.path.startsWith('/api/webhooks');
  },
});
app.use(limiter);

// ============ Body Parsing ============

// Capture raw body for webhook signature verification
app.use(express.json({
  limit: '10mb',
  verify: captureRawBody,
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============ Request Logging ============

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res.statusCode, duration);
  });
  
  next();
});

// ============ Health Check ============

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    version: require('./package.json').version,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    api_version: config.apiVersion,
    timestamp: new Date().toISOString(),
  });
});

// ============ API Routes ============

app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/rates', paymentRoutes); // Alias for /rates/:crypto
app.use('/api/reviews', reviewRoutes);
app.use('/api/webhooks', webhookRoutes);

// ============ Error Handling ============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // Don't leak error details in production
  const errorResponse = {
    success: false,
    error: config.isProduction 
      ? 'Internal server error'
      : err.message,
  };
  
  if (!config.isProduction) {
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// ============ Server Startup ============

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // Sync models (only in development)
    if (config.isDevelopment) {
      await syncDatabase({ alter: true });
    }
    
    // Start listening
    const server = app.listen(config.port, () => {
      logger.info(`
========================================
  ARTISAN APPAREL BACKEND SERVER
========================================
  Environment: ${config.nodeEnv}
  Port: ${config.port}
  API Version: ${config.apiVersion}
  Frontend URL: ${config.urls.frontend}
========================================
  Server is ready to accept requests
========================================
      `);
    });
    
    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connection
        const { closeConnection } = require('./src/config/database');
        await closeConnection();
        
        process.exit(0);
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Server startup failed', { error: error.message });
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app; // For testing
