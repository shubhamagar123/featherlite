import { Result } from '../../../services/types/result.type';
import { Memory } from '../../../engines/memory/dto/memory.dto';
import { IMemoryContextMatcher } from '../interfaces/memory-query.interfaces';

export class MemoryContextMatcher implements IMemoryContextMatcher {
  matchContext(memories: Memory[], context: any): Result<number[]> {
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

  private isContextMatch(memory: Memory, context: any): boolean {
    if (this.matchesActivity(memory, context)) return true;
    if (this.matchesScene(memory, context)) return true;
    if (this.matchesMood(memory, context)) return true;
    if (this.matchesEntities(memory, context)) return true;

    return false;
  }

  private matchesActivity(memory: Memory, context: any): boolean {
    if (!context.currentActivity) return false;

    const activityTokens = context.currentActivity.toLowerCase().split(/\s+/);
    const memoryText = `${memory.content} ${memory.metadata?.activity || ''}`.toLowerCase();
    const memoryTokens = memoryText.split(/\s+/);

    const matches = activityTokens.filter((token) =>
      memoryTokens.some((mt) => mt.includes(token))
    ).length;

    return matches > 0;
  }

  private matchesScene(memory: Memory, context: any): boolean {
    if (!context.currentScene) return false;

    const sceneTokens = context.currentScene.toLowerCase().split(/\s+/);
    const memoryLocation = `${memory.metadata?.location || ''}`.toLowerCase();

    return sceneTokens.some((token) => memoryLocation.includes(token));
  }

  private matchesMood(memory: Memory, context: any): boolean {
    if (!context.currentMood) return false;

    const moodTokens = context.currentMood.toLowerCase().split(/\s+/);
    const memoryMood = `${memory.metadata?.mood || ''}`.toLowerCase();

    return moodTokens.some((token) => memoryMood.includes(token));
  }

  private matchesEntities(memory: Memory, context: any): boolean {
    if (!context.recentEntities || context.recentEntities.length === 0) {
      return false;
    }

    const contextEntities = new Set(
      context.recentEntities.map((e: string) => e.toLowerCase())
    );
    const memoryEntities = new Set(
      (memory.entities || []).map((e) => e.name.toLowerCase())
    );

    const matches = Array.from(contextEntities).filter((e) => memoryEntities.has(e));
    return matches.length > 0;
  }
}
