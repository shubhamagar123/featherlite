import { Result } from '../../../services/types/result.type';
import { Memory } from '@engines/memory/dtos/memory.dto';
import { IMemoryContextMatcher } from '../interfaces/memory-query.interfaces';

interface MatcherContext {
  currentActivity?: string;
  currentScene?: string;
  currentMood?: string;
  recentEntities?: string[];
}

export class MemoryContextMatcher implements IMemoryContextMatcher {
  matchContext(memories: Memory[], context: MatcherContext | null | undefined): Result<number[]> {
    return Result.try(() => {
      const matches: number[] = [];

      if (!context) {
        return memories.map((_, i) => i);
      }

      for (let i = 0; i < memories.length; i++) {
        const memory = memories[i];

        if (this.isContextMatch(memory, context)) {
          matches.push(i);
        }
      }

      return matches;
    });
  }

  private isContextMatch(memory: Memory, context: MatcherContext): boolean {
    if (this.matchesActivity(memory, context)) return true;
    if (this.matchesScene(memory, context)) return true;
    if (this.matchesMood(memory, context)) return true;
    if (this.matchesEntities(memory, context)) return true;

    return false;
  }

  private matchesActivity(memory: Memory, context: MatcherContext): boolean {
    if (!context.currentActivity) return false;

    const activityTokens: string[] = context.currentActivity.toLowerCase().split(/\s+/);
    const memoryText = `${memory.description} ${String(memory.metadata?.activity ?? '')}`.toLowerCase();
    const memoryTokens: string[] = memoryText.split(/\s+/);

    const matches = activityTokens.filter((token: string) =>
      memoryTokens.some((mt: string) => mt.includes(token))
    ).length;

    return matches > 0;
  }

  private matchesScene(memory: Memory, context: MatcherContext): boolean {
    if (!context.currentScene) return false;

    const sceneTokens: string[] = context.currentScene.toLowerCase().split(/\s+/);
    const memoryLocation = String(memory.metadata?.location ?? '').toLowerCase();

    return sceneTokens.some((token: string) => memoryLocation.includes(token));
  }

  private matchesMood(memory: Memory, context: MatcherContext): boolean {
    if (!context.currentMood) return false;

    const moodTokens: string[] = context.currentMood.toLowerCase().split(/\s+/);
    const memoryMood = String(memory.metadata?.mood ?? '').toLowerCase();

    return moodTokens.some((token: string) => memoryMood.includes(token));
  }

  private matchesEntities(memory: Memory, context: MatcherContext): boolean {
    if (!context.recentEntities || context.recentEntities.length === 0) {
      return false;
    }

    const contextEntities = new Set<string>(
      context.recentEntities.map((e: string) => e.toLowerCase())
    );
    const memoryEntities = new Set<string>(
      (memory.entities || []).map((e) => e.name.toLowerCase())
    );

    const matches = Array.from(contextEntities).filter((e: string) => memoryEntities.has(e));
    return matches.length > 0;
  }
}
