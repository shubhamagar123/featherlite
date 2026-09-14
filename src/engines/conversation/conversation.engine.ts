import { Result } from '@services/types/result.type';
import type { IResult } from '@services/types/result.type';
import type { IContextEngine } from '@engines/context/interfaces/context-engine.interface';
import type { InteractionContextDTO } from '@engines/context/dtos/conversation-context.dto';
import type { IPromptOrchestrator } from '@engines/prompt/interfaces/prompt-orchestrator.interface';
import { PromptType, PromptStrategy } from '@engines/prompt/enums/prompt.enums';
import type { PromptPayload } from '@engines/prompt/dtos/prompt.dtos';
import type { ILLMGateway } from '@engines/llm-gateway/interfaces/llm-gateway.interface';
import { LLMRequestMode, LLMRequestPriority } from '@engines/llm-gateway';
import type { LLMMessage } from '@engines/llm-gateway';
import type { IMemoryExtractionEngine } from '@engines/memory-extraction/interfaces/memory-extraction-engine.interface';
import type { MemoryExtractionResultDTO } from '@engines/memory-extraction/dtos/memory-extraction.dtos';
import type { IMemoryService } from '@services/memory/memory.service.interface';
import { v4 as uuid } from 'uuid';
import type { IConversationEngine } from './interfaces/conversation-engine.interface';
import type { ConversationTurnInput, ConversationTurnResult, ConsentResolution } from './dtos/conversation.dtos';
import {
  getConversationEventBus,
  ConversationEventBus,
} from '@services/realtime/conversation-event-bus.service';

/** A candidate this engine has proposed and is waiting on the user to confirm. */
interface PendingConsentRequest {
  candidate: MemoryExtractionResultDTO;
  askedAt: Date;
}

const AFFIRMATIVE_REPLY = /^\s*(y|yes|yeah|yep|yup|sure|please\s*do|go ahead|remember it|do it|ok(ay)?)\b/i;

export interface ConversationEngineDeps {
  contextEngine: IContextEngine;
  promptOrchestrator: IPromptOrchestrator;
  llmGateway: ILLMGateway;
  memoryExtractionEngine: IMemoryExtractionEngine;
  memoryService: IMemoryService;
  /**
   * Live conversation-state event bus (kai:speaking_start/end,
   * video:state_change), consumed by the SSE endpoint at
   * GET /api/v1/conversations/:id/events. Optional so existing callers/tests
   * that construct this engine directly keep compiling — defaults to the
   * shared singleton bus.
   */
  eventBus?: ConversationEventBus;
}

/**
 * ConversationEngine — the one place a user-companion turn actually happens.
 *
 * Rules this class exists to enforce:
 * 1. The only engine it asks for conversational state is the Context
 *    Engine — never World/Companion/Relationship/Memory directly.
 * 2. It never touches Prisma or a repository. Persistence only ever
 *    happens through `IMemoryService.persistMemoryCandidate`, and only
 *    with an explicit, matching, granted ConsentEvent.
 * 3. A memory candidate flagged by the Memory Extraction Engine is NEVER
 *    saved automatically. It is turned into an in-character consent
 *    question appended to this turn's reply, and only persisted if the
 *    user affirms it on their very next message.
 *
 * `pendingConsentByConversation` is transient, in-process, per-conversation
 * orchestration state — "we asked a question and are waiting on an answer."
 * It is NOT a memory store: it is never written to a database, holds no
 * "pending memories" table, and a withheld or ambiguous answer causes the
 * entry to simply be dropped, not archived anywhere.
 */
export class ConversationEngine implements IConversationEngine {
  private readonly pendingConsentByConversation = new Map<string, PendingConsentRequest>();
  private readonly eventBus: ConversationEventBus;

  constructor(private readonly deps: ConversationEngineDeps) {
    this.eventBus = deps.eventBus ?? getConversationEventBus();
  }

  async sendMessage(input: ConversationTurnInput): Promise<IResult<ConversationTurnResult>> {
    return Result.tryAsync(async () => {
      const conversationKey = this.conversationKey(input);

      const consentResolution = await this.resolvePendingConsent(conversationKey, input.message);

      const context = await this.assembleContext(input);
      const prompt = await this.buildPrompt(input, context);

      this.eventBus.publish(conversationKey, { type: 'kai:speaking_start', data: {} });
      this.eventBus.publish(conversationKey, {
        type: 'video:state_change',
        data: { state: 'speaking' },
      });

      let reply: string;
      try {
        reply = await this.completeWithLLM(input, prompt);
      } finally {
        this.eventBus.publish(conversationKey, { type: 'kai:speaking_end', data: {} });
        this.eventBus.publish(conversationKey, {
          type: 'video:state_change',
          data: { state: 'idle' },
        });
      }

      const { reply: finalReply, consentQuestionAsked } = this.appendConsentQuestionIfFlagged(
        conversationKey,
        input,
        reply
      );
      reply = finalReply;

      const result: ConversationTurnResult = {
        reply,
        consentQuestionAsked,
      };
      if (consentResolution) {
        result.consentResolution = consentResolution;
      }
      return result;
    });
  }

  // --------------------------------------------------------------------
  // Step 1: resolve any consent question asked on the previous turn.
  // --------------------------------------------------------------------

  private async resolvePendingConsent(
    conversationKey: string,
    incomingMessage: string
  ): Promise<ConsentResolution | undefined> {
    const pending = this.pendingConsentByConversation.get(conversationKey);
    if (!pending) return undefined;

    // Whatever the answer, this question is resolved — one way or another,
    // it does not carry forward to a third turn.
    this.pendingConsentByConversation.delete(conversationKey);

    if (!AFFIRMATIVE_REPLY.test(incomingMessage.trim())) {
      // "no", an ambiguous reply, or anything that isn't a clear yes: no
      // ConsentEvent is even constructed, so there is no write path here at
      // all — not even a "discarded" call to the Memory Service.
      return { granted: false, persisted: false };
    }

    const persistResult = await this.deps.memoryService.persistMemoryCandidate(pending.candidate, {
      granted: true,
      sourceMessageId: pending.candidate.sourceMessageId,
    });

    return {
      granted: true,
      persisted: persistResult.isSuccess && persistResult.value != null,
    };
  }

  // --------------------------------------------------------------------
  // Step 2: context (Context Engine only) + prompt (Prompt Engine).
  // --------------------------------------------------------------------

  private async assembleContext(input: ConversationTurnInput): Promise<InteractionContextDTO> {
    const contextResult = await this.deps.contextEngine.assembleContext({
      userId: input.userId,
      companionId: input.companionId,
      referenceDate: new Date(),
      timezone: input.timezone,
    });
    if (!contextResult.isSuccess || !contextResult.value) {
      throw contextResult.error ?? new Error('Failed to assemble conversation context');
    }
    return contextResult.value;
  }

  private async buildPrompt(
    input: ConversationTurnInput,
    context: InteractionContextDTO
  ): Promise<PromptPayload> {
    const promptResult = await this.deps.promptOrchestrator.buildPrompt({
      conversationContext: context,
      promptType: PromptType.CONVERSATION,
      strategy: PromptStrategy.STANDARD,
      priority: LLMRequestPriority.CRITICAL,
      metadata: {
        userMessage: input.message,
        conversationHistory: input.conversationHistory ?? '(no history)',
      },
    });
    if (!promptResult.isSuccess || !promptResult.value) {
      throw promptResult.error ?? new Error('Failed to build prompt');
    }
    return promptResult.value;
  }

  // --------------------------------------------------------------------
  // Step 3: the LLM call.
  // --------------------------------------------------------------------

  private async completeWithLLM(input: ConversationTurnInput, prompt: PromptPayload): Promise<string> {
    const llmResult = await this.deps.llmGateway.complete({
      requestId: uuid(),
      userId: input.userId,
      companionId: input.companionId,
      messages: this.toLLMMessages(prompt),
      mode: LLMRequestMode.COMPLETION,
      priority: LLMRequestPriority.CRITICAL,
    });
    if (!llmResult.isSuccess || !llmResult.value) {
      throw llmResult.error ?? new Error('LLM completion failed');
    }
    return llmResult.value.content;
  }

  private toLLMMessages(prompt: PromptPayload): LLMMessage[] {
    const messages: LLMMessage[] = [{ role: 'system', content: prompt.systemPrompt.content }];
    if (prompt.developerPrompt) {
      messages.push({ role: 'developer', content: prompt.developerPrompt.content });
    }
    messages.push({ role: 'user', content: prompt.userPrompt.content });
    return messages;
  }

  // --------------------------------------------------------------------
  // Step 4: propose (never persist) a memory candidate for THIS turn.
  // --------------------------------------------------------------------

  private appendConsentQuestionIfFlagged(
    conversationKey: string,
    input: ConversationTurnInput,
    reply: string
  ): { reply: string; consentQuestionAsked: boolean } {
    const extractionResult = this.deps.memoryExtractionEngine.extract({
      userId: input.userId,
      companionId: input.companionId,
      sourceMessageId: input.messageId,
      text: input.message,
    });

    if (!extractionResult.isSuccess || !extractionResult.value) {
      return { reply, consentQuestionAsked: false };
    }

    const candidate = extractionResult.value;
    this.pendingConsentByConversation.set(conversationKey, { candidate, askedAt: new Date() });

    return {
      reply: `${reply}\n\n${this.buildConsentQuestion(candidate)}`,
      consentQuestionAsked: true,
    };
  }

  private buildConsentQuestion(candidate: MemoryExtractionResultDTO): string {
    return `By the way — should I remember that? ("${candidate.content}")`;
  }

  private conversationKey(input: ConversationTurnInput): string {
    return input.sessionId ?? `${input.userId}:${input.companionId}`;
  }
}
