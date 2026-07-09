import { Request, Response } from 'express';
import { ControllerBase } from './controller.base';
import { HealthApplicationService } from '@application/services/health.application.service';
import { asyncHandler } from '@api/index';

/**
 * Health Controller
 * No business logic here!
 * Only: validate, call service, return response
 */
export class HealthController extends ControllerBase {
  private readonly healthService: HealthApplicationService;

  constructor() {
    super('HealthController');
    this.healthService = new HealthApplicationService();
  }

  /**
   * GET /health
   * Get full health status
   */
  getHealth = asyncHandler(async (req: Request, res: Response) => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/health', { traceId });

    try {
      const health = await this.healthService.getHealth();
      this.success(res, health, traceId);
    } catch (error) {
      this.logRequestError('GET', '/health', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /health/live
   * Liveness probe for Kubernetes
   */
  liveness = asyncHandler(async (req: Request, res: Response) => {
    const traceId = this.getTraceId(req);

    try {
      const alive = await this.healthService.liveness();
      res.status(alive ? 200 : 503).json({ status: alive ? 'UP' : 'DOWN' });
    } catch (error) {
      res.status(503).json({ status: 'DOWN' });
    }
  });

  /**
   * GET /health/ready
   * Readiness probe for Kubernetes
   */
  readiness = asyncHandler(async (req: Request, res: Response) => {
    const traceId = this.getTraceId(req);

    try {
      const ready = await this.healthService.readiness();
      res.status(ready ? 200 : 503).json({ status: ready ? 'READY' : 'NOT_READY' });
    } catch (error) {
      res.status(503).json({ status: 'NOT_READY' });
    }
  });
}
