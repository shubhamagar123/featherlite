/**
 * ContextBuilder — the assembly mechanism.
 *
 * Runs every provider in parallel, times each, and applies the degradation
 * policy: a REQUIRED provider's failure aborts the whole build, while an
 * OPTIONAL provider's failure falls back to its empty slice and is recorded in
 * `meta.degraded`. The builder holds no source-specific knowledge.
 */

import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';
import { type Clock, SystemClock } from '@engines/world';

import {
  ContextMeta,
  ContextProviderReport,
  ContextRequest,
  ConversationContextDTO,
} from '../dtos/conversation-context.dto';
import { IContextBuilder, ContextProviderSet } from '../interfaces/context-builder.interface';
import { IContextProvider } from '../interfaces/context-provider.interface';

/** The timed outcome of a single provider run. */
interface ProviderRun<T> {
  provider: IContextProvider<T>;
  result: IResult<T>;
  durationMs: number;
}

export class ContextBuilder implements IContextBuilder {
  private readonly logger: Logger;

  constructor(
    private readonly providers: ContextProviderSet,
    private readonly clock: Clock = new SystemClock()
  ) {
    this.logger = createLogger('ContextBuilder');
  }

  async build(request: ContextRequest): Promise<IResult<ConversationContextDTO>> {
    const startedAt = Date.now();
    const referenceDate = request.referenceDate ?? this.clock.now();
    const timezone = request.timezone ?? request.world?.timezone ?? 'UTC';

    // Providers are independent — run them concurrently.
    const [userRun, companionRun, worldRun, relationshipRun, memoryRun, momentsRun] =
      await Promise.all([
        this.run(this.providers.user, request),
        this.run(this.providers.companion, request),
        this.run(this.providers.world, request),
        this.run(this.providers.relationship, request),
        this.run(this.providers.memory, request),
        this.run(this.providers.moments, request),
      ]);

    // Abort early if any REQUIRED provider failed.
    const requiredRuns: ProviderRun<unknown>[] = [userRun, companionRun, worldRun];
    for (const run of requiredRuns) {
      if (!run.result.isSuccess || run.result.value === undefined) {
        this.logger.error(
          { provider: run.provider.key, err: run.result.error },
          'Required context provider failed; aborting build'
        );
        return Result.failure(
          run.result.error ?? new Error(`Required context provider '${run.provider.key}' failed`)
        );
      }
    }

    const reports: ContextProviderReport[] = [];
    const degraded: string[] = [];

    const context: ConversationContextDTO = {
      requestId: `ctx_${request.userId}_${request.companionId}_${referenceDate.getTime()}`,
      userId: request.userId,
      companionId: request.companionId,
      generatedAt: new Date().toISOString(),
      user: this.resolveSlice(userRun, reports, degraded),
      companion: this.resolveSlice(companionRun, reports, degraded),
      world: this.resolveSlice(worldRun, reports, degraded),
      relationship: this.resolveSlice(relationshipRun, reports, degraded),
      memories: this.resolveSlice(memoryRun, reports, degraded),
      moments: this.resolveSlice(momentsRun, reports, degraded),
      meta: this.buildMeta(timezone, referenceDate, degraded, reports, startedAt),
    };

    if (degraded.length > 0) {
      this.logger.warn({ degraded }, 'Assembled context with degraded optional providers');
    }

    return Result.success(context);
  }

  /** Time a single provider, converting a thrown error into a failure result. */
  private async run<T>(
    provider: IContextProvider<T>,
    request: ContextRequest
  ): Promise<ProviderRun<T>> {
    const start = Date.now();
    try {
      const result = await provider.provide(request);
      return { provider, result, durationMs: Date.now() - start };
    } catch (error) {
      return {
        provider,
        result: Result.failure(error instanceof Error ? error : new Error(String(error))),
        durationMs: Date.now() - start,
      };
    }
  }

  /**
   * Extract a provider's slice, recording a report. On success uses the value;
   * otherwise (only reachable for optional providers, since required failures
   * already aborted) falls back to the empty slice and marks degradation.
   */
  private resolveSlice<T>(
    run: ProviderRun<T>,
    reports: ContextProviderReport[],
    degraded: string[]
  ): T {
    if (run.result.isSuccess && run.result.value !== undefined) {
      reports.push({
        key: run.provider.key,
        ok: true,
        required: run.provider.required,
        degraded: false,
        durationMs: run.durationMs,
      });
      return run.result.value;
    }

    reports.push({
      key: run.provider.key,
      ok: false,
      required: run.provider.required,
      degraded: true,
      durationMs: run.durationMs,
      error: run.result.error?.message,
    });
    degraded.push(run.provider.key);
    return run.provider.emptySlice();
  }

  private buildMeta(
    timezone: string,
    referenceDate: Date,
    degraded: string[],
    providers: ContextProviderReport[],
    startedAt: number
  ): ContextMeta {
    return {
      timezone,
      referenceDate: referenceDate.toISOString(),
      degraded,
      providers,
      buildDurationMs: Date.now() - startedAt,
    };
  }
}
