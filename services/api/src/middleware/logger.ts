import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Use a more stable path for the log file
const logFile = path.resolve(process.cwd(), 'debug_requests.log');

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, body, query } = req;

  const logEntry = (msg: string) => {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${msg}\n`;
    try {
      fs.appendFileSync(logFile, entry);
      console.log(entry.trim());
    } catch (e) {
      // Fallback to console if file logging fails
      console.error('Logging to file failed:', e);
      console.log(`[${timestamp}] ${msg}`);
    }
  };

  // Log request
  logEntry(`${method} ${url} STARTED`);
  console.log('Logger body state:', !!body, Object.keys(body || {}).length);
  
  if (query && Object.keys(query).length > 0) {
    logEntry(`Query: ${JSON.stringify(query)}`);
  }
  
  // Sensitive info filtering for body
  if (body && Object.keys(body).length > 0) {
    const bodyToLog = { ...body };
    const sensitiveFields = [
      'password', 'token', 'secret', 'public_token', 
      'access_token', 'credential', 'newPassword', 
      'currentPassword', 'otp', 'code'
    ];
    
    sensitiveFields.forEach(field => {
      if (bodyToLog[field]) bodyToLog[field] = '********';
    });
    
    logEntry(`Body: ${JSON.stringify(bodyToLog)}`);
  }

  // Capture response body for errors
  const oldSend = res.send;
  res.send = function(data: any): Response {
    if (res.statusCode >= 400) {
      try {
        const responseData = typeof data === 'string' ? data : JSON.stringify(data);
        logEntry(`ERROR RESPONSE: ${responseData}`);
      } catch (e) {
        logEntry(`ERROR RESPONSE: (could not stringify data)`);
      }
    }
    return oldSend.apply(res, arguments as any);
  };

  // Use finish event to log completion
  res.on('finish', () => {
    const duration = Date.now() - start;
    logEntry(`${method} ${url} FINISHED - Status: ${res.statusCode} (${duration}ms)`);
  });

  next();
};

