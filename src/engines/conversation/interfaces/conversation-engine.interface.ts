import type { IResult } from '@services/types/result.type';
import type { ConversationTurnInput, ConversationTurnResult } from '../dtos/conversation.dtos';

/**
 * IConversationEngine — orchestrates a single user-companion turn:
 * context assembly, prompt building, the LLM call, and the
 * extraction-propose / consent-gate-persist memory flow.
 *
 * Boundary: this engine's only source of conversational state is the
 * Context Engine (never World/Companion/Relationship/Memory directly). It
 * additionally depends on the Prompt Engine (to build prompts), the LLM
 * Gateway (to get a completion), the Memory Extraction Engine (to propose
 * candidates — never to persist them), and the Memory Service's public
 * interface (to persist, gated by an explicit consent event). It never
 * touches Prisma or a repository directly.
 */
export interface IConversationEngine {
  sendMessage(input: ConversationTurnInput): Promise<IResult<ConversationTurnResult>>;
}
