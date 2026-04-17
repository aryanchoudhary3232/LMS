/**
 * Custom Request Logger Middleware
 * Logs additional information beyond what morgan provides
 */

const { recordSlowRequest } = require("../config/metrics");

// Log request details with user info
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override res.end to log after response
  res.end = function(...args) {
    const duration = Date.now() - start; 
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?._id || 'anonymous',
      userRole: req.user?.role || 'guest',
    };
    
    // Log errors (status >= 400) with more details
    if (res.statusCode >= 400) {
      console.error('❌ ERROR REQUEST:', JSON.stringify(logData, null, 2));
    } else if (process.env.NODE_ENV === 'development') {
      console.log('✅ REQUEST:', JSON.stringify(logData, null, 2));
    }
    
    // Call original end function
    originalEnd.apply(res, args);
  };
  
  next();
};

// Log only errors in production
const errorOnlyLogger = (req, res, next) => {
  const start = Date.now();
  
  const originalEnd = res.end;
  res.end = function(...args) {
    if (res.statusCode >= 400) {
      const duration = Date.now() - start;
      console.error('❌ ERROR:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?._id,
        userRole: req.user?.role,
      });
    }
    originalEnd.apply(res, args);
  };
  
  next();
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
    
    // Warn if request takes longer than 1 second
    if (duration > 1000) {
      recordSlowRequest({
        method: req.method,
        route: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
      });

      console.warn('⚠️ SLOW REQUEST:', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
      });
    }
  });
  
  next();
};

// API rate limit info logger
const rateLimitLogger = (req, res, next) => {
  if (req.rateLimit) {
    console.log('📊 RATE LIMIT:', {
      ip: req.ip,
      remaining: req.rateLimit.remaining,
      limit: req.rateLimit.limit,
      resetTime: new Date(req.rateLimit.resetTime),
    });
  }
  next();
};

module.exports = {
  requestLogger,
  errorOnlyLogger,
  performanceMonitor,
  rateLimitLogger,
};
