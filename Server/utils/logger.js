// utils/logger.js - Professional logging utility

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  constructor() {
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    this.currentLevel = process.env.LOG_LEVEL || 'INFO';
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(filename, message) {
    const filePath = path.join(logsDir, filename);
    fs.appendFileSync(filePath, message + '\n');
  }

  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.currentLevel];
  }

  error(message, meta = {}) {
    if (!this.shouldLog('ERROR')) return;
    
    const formattedMessage = this.formatMessage('ERROR', message, meta);
    console.error('\x1b[31m%s\x1b[0m', formattedMessage); // Red color
    this.writeToFile('error.log', formattedMessage);
    this.writeToFile('combined.log', formattedMessage);
  }

  warn(message, meta = {}) {
    if (!this.shouldLog('WARN')) return;
    
    const formattedMessage = this.formatMessage('WARN', message, meta);
    console.warn('\x1b[33m%s\x1b[0m', formattedMessage); // Yellow color
    this.writeToFile('combined.log', formattedMessage);
  }

  info(message, meta = {}) {
    if (!this.shouldLog('INFO')) return;
    
    const formattedMessage = this.formatMessage('INFO', message, meta);
    console.log('\x1b[36m%s\x1b[0m', formattedMessage); // Cyan color
    this.writeToFile('combined.log', formattedMessage);
  }

  debug(message, meta = {}) {
    if (!this.shouldLog('DEBUG')) return;
    
    const formattedMessage = this.formatMessage('DEBUG', message, meta);
    console.log('\x1b[37m%s\x1b[0m', formattedMessage); // White color
    this.writeToFile('debug.log', formattedMessage);
    this.writeToFile('combined.log', formattedMessage);
  }

  // Security logging for authentication and authorization events
  security(message, meta = {}) {
    const formattedMessage = this.formatMessage('SECURITY', message, {
      ...meta,
      security: true
    });
    console.log('\x1b[35m%s\x1b[0m', formattedMessage); // Magenta color
    this.writeToFile('security.log', formattedMessage);
    this.writeToFile('combined.log', formattedMessage);
  }

  // Audit logging for critical operations (file uploads, deletions, authentication)
  audit(action, meta = {}) {
    const formattedMessage = this.formatMessage('AUDIT', action, {
      ...meta,
      audit: true,
      timestamp: new Date().toISOString()
    });
    console.log('\x1b[95m%s\x1b[0m', formattedMessage); // Bright magenta color
    this.writeToFile('audit.log', formattedMessage);
    this.writeToFile('combined.log', formattedMessage);
  }

  // Performance logging
  performance(message, meta = {}) {
    const formattedMessage = this.formatMessage('PERFORMANCE', message, {
      ...meta,
      performance: true
    });
    console.log('\x1b[32m%s\x1b[0m', formattedMessage); // Green color
    this.writeToFile('performance.log', formattedMessage);
  }
}

// Create singleton instance
const logger = new Logger();

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id || Date.now().toString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.id || Date.now().toString()
    });

    if (duration > 1000) {
      logger.performance('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`
      });
    }

    originalEnd.apply(this, args);
  };

  next();
};

module.exports = {
  logger,
  requestLogger
};