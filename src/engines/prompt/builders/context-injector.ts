import type { InteractionContextDTO } from '@engines/context';
import { PromptTemplate, PromptBuildContext } from '../dtos/prompt.dtos';

/**
 * Substitutes template placeholders like {{USER_NAME}} with values pulled from
 * the InteractionContextDTO. Unknown placeholders resolve to the template's
 * declared default (or a friendly '(unavailable)' marker when none exists),
 * so a missing slice never produces a broken prompt.
 */
export class ContextInjector {
  inject(
    template: PromptTemplate,
    build: PromptBuildContext,
    extraTokens: Record<string, string> = {}
  ): string {
    const dictionary = this.buildDictionary(build.conversationContext);
    Object.assign(dictionary, extraTokens);

    return template.content.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key: string) => {
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
        return dictionary[key] ?? '';
      }
      const declared = template.variables.find((v) => v.name === key);
      if (declared?.defaultValue !== undefined) return declared.defaultValue;
      return '(unavailable)';
    });
  }

  private buildDictionary(ctx: InteractionContextDTO): Record<string, string> {
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

    // Memories
    dict.MEMORIES = ctx.memories.items.length
      ? ctx.memories.items
          .map((m, i) => `${i + 1}. [${m.type}][${m.importance}] ${m.content}`)
          .join('\n')
      : '(no relevant memories)';
    dict.MEMORY_COUNT = String(ctx.memories.count);

    // Moments
    dict.MOMENTS = ctx.moments.items.length
      ? ctx.moments.items
          .map(
            (m, i) =>
              `${i + 1}. ${m.title}${m.description ? ` — ${m.description}` : ''} (${m.occurredAt})`
          )
          .join('\n')
      : '(no recent moments)';
    dict.MOMENT_COUNT = String(ctx.moments.count);

    return dict;
  }

  private formatScore(score?: number): string {
    if (score === undefined) return '0.5';
    return score.toFixed(2);
  }
}
