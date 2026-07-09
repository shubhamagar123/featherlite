import { Queue, Worker, Job } from 'bullmq';
import { IResult, Result } from '@services/types/result.type';
import { IEventDispatcher, IEventRegistry } from '../interfaces/event-bus.interface';
import { EventEnvelope, DomainEventPayload, EventRetryPolicy } from '../dto/event.dto';
import { EventDispatchMode } from '../enums/event.enums';
import { createLogger } from '@utils/logger';
import { redisProvider } from '@infra/redis/redis.provider';
import type { Logger } from 'pino';

interface JobData {
  envelope: EventEnvelope<any>;
  handlerIds: string[];
}

/**
 * BullMQ-based event dispatcher for asynchronous event processing via Redis.
 * Routes ASYNC events to a Redis-backed queue with configurable concurrency.
 * Falls back to sync dispatch for SYNC mode events.
 */
export class BullMQDispatcher implements IEventDispatcher {
  private readonly logger: Logger;
  private readonly registry: IEventRegistry;
  private readonly retryPolicy: EventRetryPolicy;
  private queue: Queue<JobData> | null = null;
  private worker: Worker<JobData> | null = null;
  private isWorkerRunning: boolean = false;

  constructor(
    registry: IEventRegistry,
    retryPolicy: EventRetryPolicy = {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      backoffJitter: true,
    }
  ) {
    this.logger = createLogger('BullMQDispatcher');
    this.registry = registry;
    this.retryPolicy = retryPolicy;
  }

  private getQueue(): Queue<JobData> {
    if (!this.queue) {
      try {
        const redisClient = redisProvider.getClient();
        this.queue = new Queue<JobData>('event-processing', {
          connection: redisClient as any,
          defaultJobOptions: {
            attempts: this.retryPolicy.maxAttempts,
            backoff: {
              type: 'exponential',
              delay: this.retryPolicy.initialDelayMs,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        });
      } catch (error) {
        this.logger.error({ error }, 'Failed to initialize BullMQ queue');
        throw error;
      }
    }
    return this.queue;
  }

  async dispatch<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    mode: EventDispatchMode
  ): Promise<IResult<void>> {
    return Result.tryAsync(async () => {
      const handlers = this.registry.getHandlers(envelope.metadata.eventType);

      if (handlers.length === 0) {
        this.logger.warn(
          { eventType: envelope.metadata.eventType, eventId: envelope.metadata.eventId },
          'No handlers found for event'
        );
        return;
      }

      if (mode === EventDispatchMode.SYNC) {
        await this.dispatchSync(envelope, handlers);
      } else {
        await this.dispatchAsync(envelope, handlers);
      }
    });
  }

  /**
   * Start the worker to consume jobs from the queue.
   * Must be called once during application startup.
   */
  async startWorker(concurrency: number = 5): Promise<void> {
    if (this.isWorkerRunning) {
      this.logger.warn('Worker is already running');
      return;
    }

    try {
      const redisClient = redisProvider.getClient();
      this.worker = new Worker<JobData>(
        'event-processing',
        async (job: Job<JobData>) => {
          await this.processJob(job);
        },
        {
          connection: redisClient as any,
          concurrency,
        }
      );

      this.worker.on('failed', (job: Job<JobData> | undefined, err: Error) => {
        this.logger.error(
          {
            jobId: job?.id,
            eventId: job?.data.envelope.metadata.eventId,
            error: err.message,
          },
          'Job processing failed'
        );
      });

      this.worker.on('completed', (job: Job<JobData>) => {
        this.logger.debug(
          {
            jobId: job.id,
            eventId: job.data.envelope.metadata.eventId,
          },
          'Job processed successfully'
        );
      });

      this.isWorkerRunning = true;
      this.logger.info('Event processing worker started');
    } catch (error) {
      this.logger.error({ error }, 'Failed to start event processing worker');
      throw error;
    }
  }

  /**
   * Stop the worker gracefully.
   */
  async stopWorker(): Promise<void> {
    if (!this.worker) {
      return;
    }

    await this.worker.close();
    this.isWorkerRunning = false;
    this.logger.info('Event processing worker stopped');
  }

  /**
   * Close the queue and clean up resources.
   */
  async close(): Promise<void> {
    await this.stopWorker();
    if (this.queue) {
      await this.queue.close();
    }
    this.logger.info('BullMQ dispatcher closed');
  }

  private async dispatchSync<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    handlers: Array<{ handler: any; priority: number }>
  ): Promise<void> {
    const errors: Error[] = [];

    for (const { handler } of handlers) {
      if (!handler.canHandle(envelope)) {
        continue;
      }

      try {
        const result = await this.executeWithRetry(envelope, handler);
        if (result.isFailure) {
          this.logger.error(
            {
              eventId: envelope.metadata.eventId,
              handlerId: handler.getMetadata().handlerId,
              error: result.error?.message,
            },
            'Handler failed'
          );
          errors.push(result.error || new Error('Unknown handler error'));
          await handler.onError(envelope, result.error || new Error('Unknown handler error'));
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          {
            eventId: envelope.metadata.eventId,
            handlerId: handler.getMetadata().handlerId,
            error: err.message,
          },
          'Unexpected error in handler'
        );
        errors.push(err);
        await handler.onError(envelope, err);
      }
    }

    if (errors.length > 0) {
      throw errors[0];
    }
  }

  private async dispatchAsync<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    handlers: Array<{ handler: any; priority: number }>
  ): Promise<void> {
    const handlerIds = handlers.map(h => h.handler.getMetadata().handlerId);
    const queue = this.getQueue();

    await queue.add('process-event', {
      envelope,
      handlerIds,
    });

    this.logger.debug(
      {
        eventId: envelope.metadata.eventId,
        handlerCount: handlers.length,
      },
      'Event queued for async processing'
    );
  }

  private async processJob(job: Job<JobData>): Promise<void> {
    const { envelope, handlerIds } = job.data;
    const handlers = this.registry.getHandlers(envelope.metadata.eventType);

    for (const { handler } of handlers) {
      if (!handlerIds.includes(handler.getMetadata().handlerId)) {
        continue;
      }

      if (!handler.canHandle(envelope)) {
        continue;
      }

      try {
        const result = await this.executeWithRetry(envelope, handler);
        if (result.isFailure) {
          this.logger.error(
            {
              jobId: job.id,
              eventId: envelope.metadata.eventId,
              handlerId: handler.getMetadata().handlerId,
              error: result.error?.message,
            },
            'Handler failed in job processing'
          );
          await handler.onError(envelope, result.error || new Error('Unknown handler error'));
          throw result.error || new Error('Handler execution failed');
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          {
            jobId: job.id,
            eventId: envelope.metadata.eventId,
            handlerId: handler.getMetadata().handlerId,
            error: err.message,
          },
          'Unexpected error in job handler'
        );
        await handler.onError(envelope, err);
        throw err;
      }
    }
  }

  private async executeWithRetry<T extends DomainEventPayload>(
    envelope: EventEnvelope<T>,
    handler: any
  ): Promise<IResult<void>> {
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt < this.retryPolicy.maxAttempts) {
      try {
        const result = await handler.handle(envelope);

        if (result.isSuccess) {
          return result;
        }

        lastError = result.error;
        attempt++;

        if (attempt < this.retryPolicy.maxAttempts) {
          await this.delay(this.calculateBackoff(attempt));
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        if (attempt < this.retryPolicy.maxAttempts) {
          await this.delay(this.calculateBackoff(attempt));
        }
      }
    }

    return Result.failure(lastError || new Error('Max retries exceeded'));
  }

  private calculateBackoff(attempt: number): number {
    let delay = this.retryPolicy.initialDelayMs * Math.pow(this.retryPolicy.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, this.retryPolicy.maxDelayMs);

    if (this.retryPolicy.backoffJitter) {
      delay *= 0.5 + Math.random();
    }

    return Math.round(delay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
