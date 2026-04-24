import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom logger middleware using morgan
 * Logs HTTP requests to console and optionally to file
 */

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file stream
const logFileStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Custom token for response time
morgan.token('response-time-ms', (req, res) => {
  return res.responseTime ? `${res.responseTime.toFixed(2)} ms` : '-';
});

// Custom token for user ID (if authenticated)
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

// Development format - colored and detailed
const devFormat = ':method :url :status :response-time-ms - :res[content-length] :user-id';

// Production format - concise
const prodFormat = ':remote-addr - :method :url :status :response-time-ms';

// Combined format for file logging
const fileFormat = ':date[iso] | :method :url | :status | :response-time-ms | :user-id | :res[content-length] bytes';

/**
 * Console logger middleware
 * Use development format in dev mode, production in prod
 */
const consoleLogger = morgan(
  process.env.NODE_ENV === 'development' ? devFormat : prodFormat,
  {
    stream: {
      write: (message) => {
        const coloredMessage = process.env.NODE_ENV === 'development'
          ? message // Could add colors here if needed
          : message;
        console.log(coloredMessage.trim());
      }
    }
  }
);

/**
 * File logger middleware
 * Always logs to file in combined format
 */
const fileLogger = morgan(fileFormat, { stream: logFileStream });

/**
 * Combined logger - both console and file
 * Use this in app.js
 */
const logger = (req, res, next) => {
  // Track response time
  const start = Date.now();
  res.on('finish', () => {
    res.responseTime = Date.now() - start;
  });
  
  consoleLogger(req, res, () => {
    fileLogger(req, res, next);
  });
};

/**
 * Custom request logger (manual logging)
 * Use for logging specific events
 */
const logRequest = (message, req) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message: message,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id || 'anonymous',
    ip: req.ip
  };
  
  console.log('[LOG]', JSON.stringify(logEntry));
  
  // Write to log file
  logFileStream.write(JSON.stringify(logEntry) + '\n');
};

export { logger, logRequest };
