import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
      context: {
        requestId: string;
        userId?: string;
        userRole?: string;
        userEmail?: string;
        timestamp: number;
      };
    }
  }
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generate or use existing request ID
  req.id = req.headers['x-request-id'] as string | undefined || uuidv4();

  // Track request start time
  req.startTime = Date.now();

  // Initialize request context
  req.context = {
    requestId: req.id,
    timestamp: req.startTime,
  };

  // Hook into response to log duration
  const originalSend = res.send.bind(res);
  res.send = function send(data) {
    const duration = Date.now() - req.startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
    return originalSend(data);
  };

  next();
}

export function setUserContext(
  req: Request,
  userId: string,
  userRole?: string,
  userEmail?: string
): void {
  req.context.userId = userId;
  req.context.userRole = userRole;
  req.context.userEmail = userEmail;
}

export function getUserContext(req: Request): { userId?: string; userRole?: string; userEmail?: string } {
  return {
    userId: req.context.userId,
    userRole: req.context.userRole,
    userEmail: req.context.userEmail,
  };
}
