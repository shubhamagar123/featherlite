import { Result } from '@services/types/result.type';
import type {
  IEntityExtractor,
  IMemoryClassifier,
  IImportanceEvaluator,
} from '@engines/memory/interfaces/memory.interfaces';
import type { MemoryExtractionInput, MemoryExtractionResultDTO } from './dtos/memory-extraction.dtos';
import type { IMemoryExtractionEngine } from './interfaces/memory-extraction-engine.interface';

/** Candidates below this classification confidence are not worth proposing. */
const MIN_CONFIDENCE = 0.1;

/**
 * MemoryExtractionEngine — decides whether a piece of conversation text is
 * worth remembering and, if so, proposes a candidate.
 *
 * HARD BOUNDARY: this class has no dependency on a repository, a service, or
 * Prisma — not even by type. It cannot call a persistence method because it
 * is never given one. `extract()` only ever returns a value; it never has a
 * side effect. Turning a proposal into a stored memory is entirely the
 * caller's responsibility (see MemoryService.persistMemoryCandidate).
 *
 * Do not "helpfully" add a repository/service dependency to this class. If a
 * caller needs extraction-then-persist in one step, that orchestration
 * belongs in the caller (e.g. a future Conversation Engine), gated by an
 * explicit ConsentEvent — never inside this engine.
 */
export class MemoryExtractionEngine implements IMemoryExtractionEngine {
  constructor(
    private readonly entityExtractor: IEntityExtractor,
    private readonly classifier: IMemoryClassifier,
    private readonly importanceEvaluator: IImportanceEvaluator
  ) {}

  extract(input: MemoryExtractionInput): Result<MemoryExtractionResultDTO | null> {
    return Result.try(() => {
      const entityResult = this.entityExtractor.extract(input.text);
      if (!entityResult.isSuccess || !entityResult.value) {
        throw new Error(`Entity extraction failed: ${entityResult.error?.message ?? 'unknown'}`);
      }
      const entities = entityResult.value.entities;

      const classResult = this.classifier.classify(input.text, entities);
      if (!classResult.isSuccess || !classResult.value) {
        throw new Error(`Classification failed: ${classResult.error?.message ?? 'unknown'}`);
      }
      const { memoryType, confidence } = classResult.value;

      if (confidence < MIN_CONFIDENCE) {
        // Nothing worth proposing. Still not a persistence decision — just
        // an empty result.
        return null;
      }

      const importanceResult = this.importanceEvaluator.evaluate({
        memoryType,
        description: input.text,
        entities,
        confidence,
      });
      if (!importanceResult.isSuccess || !importanceResult.value) {
        throw new Error(
          `Importance evaluation failed: ${importanceResult.error?.message ?? 'unknown'}`
        );
      }

      const candidate: MemoryExtractionResultDTO = {
        sourceMessageId: input.sourceMessageId,
        userId: input.userId,
        companionId: input.companionId,
        memoryType,
        content: input.text,
        importance: importanceResult.value.importance,
        confidence,
        entities,
        extractedAt: new Date(),
      };

      return candidate;
    }) as Result<MemoryExtractionResultDTO | null>;
  }
}
