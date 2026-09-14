import type { MemoryExtractionResultDTO } from '@engines/memory-extraction';
import type { IMemoryService } from './memory.service.interface';
import { createLogger } from '@utils/logger';

const BUFFER_TTL_MS = 30 * 60 * 1000; // 30 minutes — an anonymous session that never authenticates just expires.

interface BufferedEntry {
  candidate: MemoryExtractionResultDTO;
  bufferedAt: number;
}

/**
 * AnonymousMemoryBufferService — holds memory candidates proposed during an
 * unauthenticated conversation (before the user has signed in via OTP), so
 * they can be persisted retroactively once the user is identified instead of
 * being silently dropped.
 *
 * This is transport/orchestration plumbing, not a domain engine: whatever
 * produces candidates during an anonymous chat calls `buffer(sessionKey, candidate)`;
 * AuthApplicationService.verifyOtpCode calls `flush(sessionKey, userId)` once
 * the user is identified, which persists each buffered candidate via
 * IMemoryService.persistMemoryCandidate (the same consent-gated path every
 * other memory write goes through — buffering is not itself consent, it just
 * avoids losing the candidate before consent can be asked).
 *
 * Known scope boundary: nothing in this codebase currently calls `buffer()`
 * yet — there is no anonymous (pre-auth) conversation endpoint built. This
 * class exists so that when one is, flushing on sign-in is a one-line call
 * rather than a new subsystem. Single-process only, like ConversationEventBus.
 */
export class AnonymousMemoryBufferService {
  private readonly logger = createLogger('AnonymousMemoryBufferService');
  private readonly buffers = new Map<string, BufferedEntry[]>();

  constructor(private readonly memoryService: IMemoryService) {}

  buffer(sessionKey: string, candidate: MemoryExtractionResultDTO): void {
    const entries = this.buffers.get(sessionKey) ?? [];
    entries.push({ candidate, bufferedAt: Date.now() });
    this.buffers.set(sessionKey, entries);
  }

  /**
   * Persist every non-expired candidate buffered under `sessionKey`, rewriting
   * each one's `userId` to the now-identified user before it goes through the
   * usual consent-gated persistMemoryCandidate path. Clears the buffer
   * afterwards regardless of outcome — a buffer is flushed at most once.
   */
  async flush(sessionKey: string, userId: string): Promise<number> {
    const entries = this.buffers.get(sessionKey);
    this.buffers.delete(sessionKey);
    if (!entries || entries.length === 0) {
      return 0;
    }

    const now = Date.now();
    let persistedCount = 0;

    for (const entry of entries) {
      if (now - entry.bufferedAt > BUFFER_TTL_MS) {
        continue;
      }

      const candidate: MemoryExtractionResultDTO = { ...entry.candidate, userId };
      const result = await this.memoryService.persistMemoryCandidate(candidate, {
        granted: true,
        sourceMessageId: candidate.sourceMessageId,
      });

      if (result.isSuccess && result.value != null) {
        persistedCount++;
      }
    }

    this.logger.info(
      { sessionKey, userId, buffered: entries.length, persisted: persistedCount },
      'Flushed anonymous memory buffer on sign-in'
    );
    return persistedCount;
  }

  /** Test/diagnostic helper — not used by production flow. */
  pendingCount(sessionKey: string): number {
    return this.buffers.get(sessionKey)?.length ?? 0;
  }
}

let cached: AnonymousMemoryBufferService | null = null;

export function getAnonymousMemoryBufferService(
  memoryService?: IMemoryService
): AnonymousMemoryBufferService {
  if (!cached) {
    if (!memoryService) {
      throw new Error('getAnonymousMemoryBufferService: memoryService required on first call');
    }
    cached = new AnonymousMemoryBufferService(memoryService);
  }
  return cached;
}

export function resetAnonymousMemoryBufferService(): void {
  cached = null;
}
