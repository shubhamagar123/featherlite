import type { InteractionContextDTO, MemoryContextItem } from '@engines/context';
import { PromptTemplate, PromptBuildContext } from '../dtos/prompt.dtos';
import { LLMRequestPriority } from '@engines/llm-gateway';

/**
 * Substitutes template placeholders like {{USER_NAME}} with values pulled from
 * the InteractionContextDTO. Unknown placeholders resolve to the template's
 * declared default (or a friendly '(unavailable)' marker when none exists),
 * so a missing slice never produces a broken prompt.
 *
 * Implements tiered context injection based on request priority:
 * - CRITICAL: Full context (all memories, moments, detailed relationship data)
 * - HIGH: Full context with developer prompt included
 * - STANDARD: Reduced context (top-5 memories, top-3 moments) to minimize tokens
 */
export class ContextInjector {
  private static readonly PLACEHOLDER_PATTERN = /\{\{([A-Z0-9_]+)\}\}/g;

  inject(
    template: PromptTemplate,
    build: PromptBuildContext,
    extraTokens: Record<string, string> = {}
  ): string {
    const dictionary = this.buildDictionary(build.conversationContext, build.priority);
    Object.assign(dictionary, extraTokens);

    return template.content.replace(ContextInjector.PLACEHOLDER_PATTERN, (_, key: string) => {
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
        return dictionary[key] ?? '';
      }
      const declared = template.variables.find((v) => v.name === key);
      if (declared?.defaultValue !== undefined) return declared.defaultValue;
      return '(unavailable)';
    });
  }

  private buildDictionary(ctx: InteractionContextDTO, priority?: LLMRequestPriority): Record<string, string> {
    const dict: Record<string, string> = {};

    // User
    dict.USER_ID = ctx.user.id ?? '';
    dict.USER_NAME = ctx.user.displayName ?? ctx.user.username ?? '';
    dict.USER_TIMEZONE = ctx.user.timezone ?? 'UTC';
    dict.USER_LANGUAGE = ctx.user.preferredLanguage ?? 'en';

    // Companion
    dict.COMPANION_NAME = ctx.companion.displayName ?? ctx.companion.name ?? '';
    dict.COMPANION_PERSONA = String(ctx.companion.state ?? 'a supportive companion');
    dict.COMPANION_STATE = String(ctx.companion.state ?? '');
    dict.COMPANION_MOOD = String(ctx.companion.mood ?? '');
    dict.COMPANION_EXPRESSION = String(ctx.companion.expression ?? '');
    dict.COMPANION_GESTURE = String(ctx.companion.gesture ?? '');
    dict.COMPANION_LOCATION = String(ctx.companion.location ?? '');
    dict.COMPANION_OUTFIT = String(ctx.companion.outfit ?? '');
    dict.COMPANION_AVAILABILITY = String(ctx.companion.availability ?? '');

    // World
    dict.WORLD_SCENE = String(ctx.world.scene ?? '');
    dict.WORLD_TIME_OF_DAY = String(ctx.world.timeOfDay ?? '');
    dict.WORLD_SEASON = String(ctx.world.season ?? '');
    dict.WORLD_WEATHER = String(ctx.world.weather ?? '');
    dict.WORLD_ACTIVITY = String(ctx.world.activity ?? '');
    dict.WORLD_LIGHTING = String(ctx.world.lighting ?? '');
    dict.WORLD_AMBIENT_SOUND = String(ctx.world.ambientSound ?? '');
    dict.WORLD_MOOD = String(ctx.world.mood ?? '');

    // Relationship
    dict.RELATIONSHIP_STATUS = String(ctx.relationship.status ?? '');
    dict.RELATIONSHIP_LEVEL = String(ctx.relationship.level ?? '');
    dict.RELATIONSHIP_AFFECTION = this.formatScore(ctx.relationship.affectionScore);
    dict.RELATIONSHIP_TRUST = this.formatScore(ctx.relationship.trustScore);
    dict.RELATIONSHIP_FAMILIARITY = this.formatScore(ctx.relationship.familiarityScore);
    dict.RELATIONSHIP_INTERACTIONS = String(ctx.relationship.totalInteractions ?? 0);

    // Memories - tiered based on priority
    const memories = this.selectMemories(ctx.memories.items, priority);
    dict.MEMORIES = memories.length
      ? memories
          .map((m, i) => `${i + 1}. [${m.type}][${m.importance}] ${m.content}`)
          .join('\n')
      : '(no relevant memories)';
    dict.MEMORY_COUNT = String(memories.length);

    // Moments - tiered based on priority
    const moments = this.selectMoments(ctx.moments.items, priority);
    dict.MOMENTS = moments.length
      ? moments
          .map(
            (m, i) =>
              `${i + 1}. ${m.title}${m.description ? ` — ${m.description}` : ''} (${m.occurredAt})`
          )
          .join('\n')
      : '(no recent moments)';
    dict.MOMENT_COUNT = String(moments.length);

    return dict;
  }

  private selectMemories(items: MemoryContextItem[], priority?: LLMRequestPriority): MemoryContextItem[] {
    if (priority === LLMRequestPriority.STANDARD) {
      return items.slice(0, 5);
    }
    return items;
  }

  private selectMoments(items: any[], priority?: LLMRequestPriority): any[] {
    if (priority === LLMRequestPriority.STANDARD) {
      return items.slice(0, 3);
    }
    return items;
  }

  private formatScore(score?: number): string {
    if (score === undefined) return '0.5';
    return score.toFixed(2);
  }
}
