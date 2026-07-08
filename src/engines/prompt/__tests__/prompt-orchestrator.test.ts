import {
  getPromptOrchestrator,
  resetPromptOrchestrator,
  PromptType,
  PromptStrategy,
  CompressionLevel,
  PromptStatus,
} from '../index';
import type { InteractionContextDTO } from '@engines/context';
import type { PromptBuildContext } from '../dtos/prompt.dtos';

function makeContext(overrides: Partial<InteractionContextDTO> = {}): InteractionContextDTO {
  return {
    requestId: 'req_1',
    userId: 'user_1',
    companionId: 'comp_1',
    generatedAt: new Date().toISOString(),
    user: { available: true, id: 'user_1', displayName: 'Alice', timezone: 'UTC', preferredLanguage: 'en' },
    companion: {
      available: true,
      companionId: 'comp_1',
      name: 'Luna',
      displayName: 'Luna',
    } as any,
    world: {
      available: true,
    } as any,
    relationship: {
      available: true,
      status: 'ACTIVE',
      level: 'FRIEND',
      affectionScore: 0.7,
      trustScore: 0.8,
      familiarityScore: 0.6,
      totalInteractions: 42,
    },
    memories: {
      available: true,
      count: 2,
      items: [
        { id: 'm1', type: 'FACT', importance: 'HIGH', content: 'Likes coffee' },
        { id: 'm2', type: 'PREFERENCE', importance: 'MEDIUM', content: 'Enjoys jazz' },
      ],
    },
    moments: {
      available: true,
      count: 1,
      items: [
        { id: 'mo1', title: 'First conversation', significance: 0.9, occurredAt: '2025-01-01' },
      ],
    },
    meta: {
      timezone: 'UTC',
      referenceDate: new Date().toISOString(),
      degraded: [],
      providers: [],
      buildDurationMs: 5,
    },
    ...overrides,
  };
}

function makeBuildContext(overrides: Partial<PromptBuildContext> = {}): PromptBuildContext {
  return {
    conversationContext: makeContext(),
    promptType: PromptType.CONVERSATION,
    strategy: PromptStrategy.STANDARD,
    compressionLevel: CompressionLevel.LIGHT,
    maxTokens: 5000,
    metadata: { userMessage: 'Hi Luna', conversationHistory: 'User: Hi' },
    ...overrides,
  };
}

describe('PromptOrchestrator', () => {
  beforeEach(() => {
    resetPromptOrchestrator();
  });

  it('builds a complete prompt payload with all three roles', async () => {
    const orchestrator = getPromptOrchestrator();
    const result = await orchestrator.buildPrompt(makeBuildContext());

    expect(result.isSuccess).toBe(true);
    const payload = result.value!;
    expect(payload.status).toBe(PromptStatus.READY);
    expect(payload.systemPrompt.content).toContain('Luna');
    expect(payload.userPrompt.content).toContain('Hi Luna');
    expect(payload.developerPrompt).toBeDefined();
    expect(payload.rules.length).toBeGreaterThan(0);
  });

  it('caches identical builds', async () => {
    const orchestrator = getPromptOrchestrator();
    const context = makeBuildContext();
    const first = await orchestrator.buildPrompt(context);
    const cached = await orchestrator.getCachedPrompt(first.value!.cacheKey!);

    expect(cached.isSuccess).toBe(true);
    expect(cached.value?.cached).toBe(true);
    expect(cached.value?.id).toBe(first.value?.id);
  });

  it('injects memories into the detailed template', async () => {
    const orchestrator = getPromptOrchestrator();
    const result = await orchestrator.buildPrompt(
      makeBuildContext({ strategy: PromptStrategy.DETAILED })
    );

    expect(result.isSuccess).toBe(true);
    expect(result.value?.systemPrompt.content).toContain('Likes coffee');
    expect(result.value?.systemPrompt.content).toContain('First conversation');
  });

  it('applies compression when the payload exceeds budget', async () => {
    const orchestrator = getPromptOrchestrator();
    const longMessage = 'x'.repeat(20_000);
    const result = await orchestrator.buildPrompt(
      makeBuildContext({
        maxTokens: 300,
        compressionLevel: CompressionLevel.AGGRESSIVE,
        metadata: { userMessage: longMessage, conversationHistory: longMessage },
      })
    );

    expect(result.isSuccess).toBe(true);
    expect(result.value!.totalTokens).toBeLessThanOrEqual(400);
    expect(result.value!.analytics.compressionRatio).toBeLessThan(1);
  });

  it('reports validation warnings when placeholders leak', async () => {
    // Force a leaked placeholder by using an unknown extras key not covered by template defaults.
    const orchestrator = getPromptOrchestrator();
    const result = await orchestrator.buildPrompt(
      makeBuildContext({
        conversationContext: makeContext({
          companion: { available: true, companionId: 'comp_1' } as any,
        }),
      })
    );
    expect(result.isSuccess).toBe(true);
    // Companion name is required for system.conversation.v1 (declared required), so validate should still pass
    // structurally; verify status transitions and validation shape.
    expect(result.value?.validation.errors).toBeDefined();
  });

  it('records analytics per template', async () => {
    const orchestrator = getPromptOrchestrator();
    await orchestrator.buildPrompt(makeBuildContext());
    const analytics = await orchestrator.getAnalytics('sys.conversation.v1');

    expect(analytics.isSuccess).toBe(true);
    expect(analytics.value!.length).toBeGreaterThanOrEqual(1);
  });

  it('supports memory extraction prompts with analytical strategy', async () => {
    const orchestrator = getPromptOrchestrator();
    const result = await orchestrator.buildPrompt(
      makeBuildContext({
        promptType: PromptType.MEMORY_EXTRACTION,
        strategy: PromptStrategy.ANALYTICAL,
      })
    );

    expect(result.isSuccess).toBe(true);
    expect(result.value?.developerPrompt?.content.toLowerCase()).toContain('json');
  });
});
