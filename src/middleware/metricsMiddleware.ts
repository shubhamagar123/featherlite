import type { Request, Response, NextFunction } from 'express';
import { MetricsCollector } from '@infra/observability/metrics';

declare global {
  namespace Express {
    interface Request {
      startTimeMs?: number;
    }
  }
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.startTimeMs = Date.now();

  const originalJson = res.json;
  res.json = function (data: unknown) {
    const durationMs = Date.now() - (req.startTimeMs || Date.now());

    MetricsCollector.recordHttpRequest(req.method, req.path, res.statusCode, durationMs);

    return originalJson.call(this, data);
  };

  next();
}
