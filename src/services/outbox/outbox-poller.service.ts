import { BaseService } from '@services/base/base.service';
import { OutboxRepository } from '@database/repositories/outbox.repository';
import { OutboxService } from './outbox.service';
import type { IEventBus } from '@engines/event/interfaces/event-bus.interface';

/**
 * OutboxPoller continuously polls the Outbox table for pending events and
 * publishes them via the event bus.
 *
 * This service runs independently (e.g., in a background worker or as a
 * separate process) and guarantees that events written to Outbox are
 * eventually published, even if the main process crashes.
 *
 * Polling strategy:
 * - Poll interval: 500ms (configurable)
 * - Batch size: 100 entries per poll
 * - Failure handling: Mark failed, schedule retry with exponential backoff
 * - Cleanup: Archive published entries older than 7 days
 */
export class OutboxPollerService extends BaseService {
  protected readonly loggerName = 'OutboxPoller';
  private readonly outboxRepository: OutboxRepository;
  private readonly outboxService: OutboxService;
  private readonly eventBus: IEventBus;
  private pollIntervalMs: number;
  private batchSize: number;
  private isRunning: boolean = false;

  constructor(eventBus: IEventBus, pollIntervalMs: number = 500, batchSize: number = 100) {
    super();
    this.outboxRepository = new OutboxRepository();
    this.outboxService = new OutboxService();
    this.eventBus = eventBus;
    this.pollIntervalMs = pollIntervalMs;
    this.batchSize = batchSize;
  }

  /**
   * Start polling. This runs indefinitely until stop() is called.
   */
  start(): void {
    if (this.isRunning) {
      this.logWarn('OutboxPoller is already running');
      return;
    }

    this.isRunning = true;
    this.logInfo('OutboxPoller started', { pollIntervalMs: this.pollIntervalMs, batchSize: this.batchSize });

    // Start polling in background without awaiting
    void this.poll();
  }

  /**
   * Stop polling gracefully.
   */
  stop(): void {
    this.isRunning = false;
    this.logInfo('OutboxPoller stop requested');
  }

  /**
   * Main polling loop.
   */
  private async poll(): Promise<void> {
    let cleanupCountdown = 1000; // Cleanup every 1000 polls

    while (this.isRunning) {
      try {
        // Poll for pending events
        const pendingEvents = await this.outboxRepository.findPending(this.batchSize);

        if (pendingEvents.length > 0) {
          this.logDebug(
            `Found ${pendingEvents.length} pending outbox entries`,
            { count: pendingEvents.length }
          );

          // Publish each entry
          for (const entry of pendingEvents) {
            try {
              await this.outboxService.publishById(entry.id, this.eventBus);
            } catch (error) {
              this.logError(
                error instanceof Error ? error : new Error(String(error)),
                `Failed to publish outbox entry ${entry.id}`
              );
            }
          }
        }

        // Periodically cleanup old published entries
        if (--cleanupCountdown <= 0) {
          try {
            const purgeResult = await this.outboxService.purgePublishedBefore(7);
            if (purgeResult.isSuccess) {
              this.logDebug('Purged old outbox entries', {
                purgedCount: purgeResult.value?.purgedCount,
              });
            }
          } catch (error) {
            this.logWarn(
              'Failed to purge old outbox entries',
              { error: error instanceof Error ? error.message : String(error) }
            );
          }
          cleanupCountdown = 1000;
        }
      } catch (error) {
        this.logError(
          error instanceof Error ? error : new Error(String(error)),
          'Error in outbox polling loop'
        );
      }

      // Sleep before next poll
      await this.sleep(this.pollIntervalMs);
    }

    this.logInfo('OutboxPoller stopped');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Run polling until either `until()` returns true or timeout expires.
   * Used for tests.
   */
  async pollUntil(condition: () => boolean, timeoutMs: number = 5000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const pendingEvents = await this.outboxRepository.findPending(this.batchSize);

      for (const entry of pendingEvents) {
        try {
          await this.outboxService.publishById(entry.id, this.eventBus);
        } catch (error) {
          // Swallow errors during test polling
        }
      }

      if (condition()) {
        return;
      }

      await this.sleep(100);
    }

    throw new Error(`Polling condition not met within ${timeoutMs}ms`);
  }
}
