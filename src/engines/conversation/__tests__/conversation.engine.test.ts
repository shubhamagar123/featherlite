import { describe, it, expect, jest } from '@jest/globals';
import { Result } from '@services/types/result.type';
import { ConversationEngine } from '../conversation.engine';
import type { IContextEngine } from '@engines/context/interfaces/context-engine.interface';
import type { InteractionContextDTO } from '@engines/context/dtos/conversation-context.dto';
import type { IPromptOrchestrator } from '@engines/prompt/interfaces/prompt-orchestrator.interface';
import type { PromptPayload } from '@engines/prompt/dtos/prompt.dtos';
import { PromptType, PromptStrategy, PromptRole, PromptStatus } from '@engines/prompt/enums/prompt.enums';
import type { ILLMGateway } from '@engines/llm-gateway/interfaces/llm-gateway.interface';
import { LLMResponseStatus, LLMFinishReason, LLMProviderType } from '@engines/llm-gateway';
import type { LLMResponse } from '@engines/llm-gateway';
import type { IMemoryExtractionEngine } from '@engines/memory-extraction/interfaces/memory-extraction-engine.interface';
import type { MemoryExtractionResultDTO } from '@engines/memory-extraction/dtos/memory-extraction.dtos';
import { MemoryType } from '@engines/memory/enums/memory.enums';
import type { IMemoryService } from '@services/memory/memory.service.interface';
import type { MemoryDTO } from '@services/dtos/memory.dto';

const USER_ID = 'user-1';
const COMPANION_ID = 'companion-1';

function makeContext(): InteractionContextDTO {
  return {
    requestId: 'req-1',
    userId: USER_ID,
    companionId: COMPANION_ID,
    generatedAt: new Date().toISOString(),
    user: { available: true, id: USER_ID },
    companion: { available: true },
    world: { available: true },
    relationship: { available: false },
    memories: { available: true, count: 0, items: [] },
    moments: { available: true, count: 0, items: [] },
    meta: {
      timezone: 'UTC',
      referenceDate: new Date().toISOString(),
      degraded: [],
      providers: [],
      buildDurationMs: 0,
    },
  };
}

function makePrompt(): PromptPayload {
  const now = new Date();
  return {
    id: 'prompt-1',
    requestId: 'req-1',
    type: PromptType.CONVERSATION,
    strategy: PromptStrategy.STANDARD,
    status: PromptStatus.READY,
    systemPrompt: { id: 'seg-sys', role: PromptRole.SYSTEM, content: 'You are Kai.', order: 1, version: '1.0.0' },
    userPrompt: { id: 'seg-usr', role: PromptRole.USER, content: 'Current user message', order: 2, version: '1.0.0' },
    totalTokens: 10,
    segmentCount: 2,
    rules: [],
    version: '1.0.0',
    validation: { isValid: true, errors: [], warnings: [], rulesViolated: [] },
    analytics: {
      templateId: 'sys.conversation.v1',
      strategy: PromptStrategy.STANDARD,
      originalTokens: 10,
      finalTokens: 10,
      compressionRatio: 1,
      segmentCount: 2,
      rulesInjected: 0,
      buildDurationMs: 1,
      timestamp: now,
    },
    cached: false,
    builtAt: now,
  };
}

function makeLLMResponse(content: string): LLMResponse {
  return {
    requestId: 'req-1',
    provider: LLMProviderType.CLAUDE,
    model: 'claude-test',
    status: LLMResponseStatus.SUCCESS,
    content,
    finishReason: LLMFinishReason.STOP,
    usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
    cost: { promptCostUsd: 0, completionCostUsd: 0, totalCostUsd: 0 },
    latencyMs: 5,
    cached: false,
    attempt: 1,
    fallbacksUsed: [],
    createdAt: new Date(),
  };
}

function makeCandidate(overrides: Partial<MemoryExtractionResultDTO> = {}): MemoryExtractionResultDTO {
  return {
    sourceMessageId: 'msg-1',
    userId: USER_ID,
    companionId: COMPANION_ID,
    memoryType: MemoryType.PREFERENCE,
    content: 'Loves hiking on weekends.',
    importance: 0.6,
    confidence: 0.8,
    entities: [],
    extractedAt: new Date(),
    ...overrides,
  };
}

function makeFakeContextEngine(): IContextEngine {
  return {
    assembleContext: jest.fn(async () => Result.success(makeContext())),
    providerKeys: jest.fn(() => []),
  } as unknown as IContextEngine;
}

function makeFakePromptOrchestrator(): IPromptOrchestrator {
  return {
    buildPrompt: jest.fn(async () => Result.success(makePrompt())),
    getCachedPrompt: jest.fn(async () => Result.success(null)),
    getAnalytics: jest.fn(async () => Result.success([])),
  } as unknown as IPromptOrchestrator;
}

function makeFakeLLMGateway(reply = 'Hi there!'): ILLMGateway {
  return {
    complete: jest.fn(async () => Result.success(makeLLMResponse(reply))),
    stream: jest.fn(),
    selectProvider: jest.fn(),
    getHealth: jest.fn(async () => Result.success([])),
    getUsage: jest.fn(() => Result.success([])),
    registerProvider: jest.fn(() => Result.success(undefined)),
    resetMetrics: jest.fn(),
  } as unknown as ILLMGateway;
}

function makeFakeMemoryService(): { service: IMemoryService; persistSpy: jest.Mock } {
  const persistSpy = jest.fn(async () =>
    Result.success<MemoryDTO>({
      id: 'mem-1',
      userId: USER_ID,
      companionId: COMPANION_ID,
      type: 'PREFERENCE',
      importance: 'SIGNIFICANT',
      content: 'Loves hiking on weekends.',
      accessCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
  const service = {
    createMemory: jest.fn(),
    getMemoryById: jest.fn(),
    getMemoriesByCompanionId: jest.fn(),
    getCriticalMemories: jest.fn(),
    updateMemory: jest.fn(),
    deleteMemory: jest.fn(),
    incrementAccessCount: jest.fn(),
    persistMemoryCandidate: persistSpy,
  } as unknown as IMemoryService;
  return { service, persistSpy };
}

function makeFakeExtractionEngine(
  ...results: Array<MemoryExtractionResultDTO | null>
): IMemoryExtractionEngine {
  const extract = jest.fn();
  for (const r of results) {
    extract.mockReturnValueOnce(Result.success(r));
  }
  extract.mockReturnValue(Result.success(null));
  return { extract } as unknown as IMemoryExtractionEngine;
}

describe('ConversationEngine', () => {
  it('(a) appends a consent question when the Memory Extraction Engine flags a candidate, without writing anything', async () => {
    const candidate = makeCandidate();
    const { service: memoryService, persistSpy } = makeFakeMemoryService();

    const engine = new ConversationEngine({
      contextEngine: makeFakeContextEngine(),
      promptOrchestrator: makeFakePromptOrchestrator(),
      llmGateway: makeFakeLLMGateway('Hi there!'),
      memoryExtractionEngine: makeFakeExtractionEngine(candidate),
      memoryService,
    });

    const result = await engine.sendMessage({
      userId: USER_ID,
      companionId: COMPANION_ID,
      messageId: 'msg-1',
      message: 'My name is Alex and I love hiking every weekend.',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value?.consentQuestionAsked).toBe(true);
    expect(result.value?.reply).toContain(candidate.content);
    expect(persistSpy).not.toHaveBeenCalled();
  });

  it('(b) "yes" on the next turn produces exactly one Memory Service write', async () => {
    const candidate = makeCandidate();
    const { service: memoryService, persistSpy } = makeFakeMemoryService();

    const engine = new ConversationEngine({
      contextEngine: makeFakeContextEngine(),
      promptOrchestrator: makeFakePromptOrchestrator(),
      llmGateway: makeFakeLLMGateway(),
      memoryExtractionEngine: makeFakeExtractionEngine(candidate, null),
      memoryService,
    });

    await engine.sendMessage({
      userId: USER_ID,
      companionId: COMPANION_ID,
      messageId: 'msg-1',
      message: 'My name is Alex and I love hiking every weekend.',
    });
    const turn2 = await engine.sendMessage({
      userId: USER_ID,
      companionId: COMPANION_ID,
      messageId: 'msg-2',
      message: 'yes',
    });

    expect(turn2.value?.consentResolution).toEqual({ granted: true, persisted: true });
    expect(persistSpy).toHaveBeenCalledTimes(1);
  });

  it('(c) "no" (or no follow-up at all) produces zero Memory Service writes', async () => {
    const candidate = makeCandidate();
    const { service: memoryService, persistSpy } = makeFakeMemoryService();

    const engine = new ConversationEngine({
      contextEngine: makeFakeContextEngine(),
      promptOrchestrator: makeFakePromptOrchestrator(),
      llmGateway: makeFakeLLMGateway(),
      memoryExtractionEngine: makeFakeExtractionEngine(candidate, null),
      memoryService,
    });

    await engine.sendMessage({
      userId: USER_ID,
      companionId: COMPANION_ID,
      messageId: 'msg-1',
      message: 'My name is Alex and I love hiking every weekend.',
    });
    const turn2 = await engine.sendMessage({
      userId: USER_ID,
      companionId: COMPANION_ID,
      messageId: 'msg-2',
      message: 'no thanks',
    });

    expect(turn2.value?.consentResolution).toEqual({ granted: false, persisted: false });
    expect(persistSpy).not.toHaveBeenCalled();
  });

  it('(c) proposing a candidate and never following up also produces zero writes', async () => {
    const { service: memoryService, persistSpy } = makeFakeMemoryService();

    const engine = new ConversationEngine({
      contextEngine: makeFakeContextEngine(),
      promptOrchestrator: makeFakePromptOrchestrator(),
      llmGateway: makeFakeLLMGateway(),
      memoryExtractionEngine: makeFakeExtractionEngine(makeCandidate()),
      memoryService,
    });

    await engine.sendMessage({
      userId: USER_ID,
      companionId: COMPANION_ID,
      messageId: 'msg-1',
      message: 'My name is Alex and I love hiking every weekend.',
    });

    expect(persistSpy).not.toHaveBeenCalled();
  });
});
