import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { environment } from '@config/environment';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  frameguard: {
    action: 'deny',
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

const corsOrigin =
  environment.NODE_ENV === 'development'
    ? [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3001',
      ]
    : environment.SOCKET_CORS_ORIGIN?.split(',').map((o) => o.trim()) || [];

export const corsMiddleware = cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400,
});

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] || req.id;
  req.id = String(requestId);
  res.setHeader('X-Request-ID', req.id);
  next();
}
