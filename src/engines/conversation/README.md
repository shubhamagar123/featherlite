# Conversation Engine

The **Conversation Engine** orchestrates a single user-companion turn: it
assembles context, builds a prompt, calls the LLM, and — critically — never
lets a proposed memory turn into a stored one without the user saying yes.

This is the "Conversation Engine (future)" from `ARCHITECTURE.md`, now
implemented.

---

## Boundary rules

1. **Context Engine, exclusively, for conversational state.** This engine
   never calls the World, Companion, Relationship, or Memory engines
   directly — only `IContextEngine.assembleContext()`. This mirrors the
   Interaction Engine's existing rule ("ONLY dependency: Context Engine")
   documented in `src/engines/README.md`.
2. **Prompt Engine for prompts.** `IPromptOrchestrator.buildPrompt()` is the
   only way this engine turns context into an LLM-ready prompt.
3. **Memory Extraction Engine proposes; it never persists.** Every user
   message is run through `IMemoryExtractionEngine.extract()`. If it
   returns a candidate, this engine appends an in-character consent
   question to the companion's reply — it does **not** call the Memory
   Service in that same turn.
4. **Memory Service, via its public interface, is the only path to a
   write — and only with consent.** On the *next* turn, if the user's
   reply reads as an affirmative, this engine calls
   `IMemoryService.persistMemoryCandidate(candidate, { granted: true,
   sourceMessageId })`. Anything else — an explicit "no", an unrelated
   reply, or no reply at all — means `persistMemoryCandidate` is never
   even called for that candidate. No row is written.
5. **No Prisma, no repositories.** This engine's only dependencies are
   Context Engine, Prompt Engine, the LLM Gateway, the Memory Extraction
   Engine, and the Memory Service's interface — all accessed through their
   public contracts.

## The consent loop

```
Turn N   (user: "My name is Alex and I love hiking.")
         -> ConversationEngine.sendMessage()
         -> Context Engine  : assemble context
         -> Prompt Engine   : build prompt
         -> LLM Gateway     : get a reply
         -> Memory Extraction Engine : extract(text of turn N)
              -> candidate found
         -> reply = "<companion's reply>\n\nBy the way — should I
                     remember that? (\"My name is Alex and I love
                     hiking.\")"
         -> pending consent recorded in-memory for this conversation
            (NOT written to any database — see below)

Turn N+1 (user: "yes")
         -> ConversationEngine.sendMessage()
         -> pending consent found for this conversation
         -> "yes" matches the affirmative pattern
         -> Memory Service.persistMemoryCandidate(candidate, {
                granted: true, sourceMessageId: <turn N's message id>
            })
         -> exactly one row written
         -> pending consent cleared
         -> turn N+1 continues normally (context/prompt/LLM as usual)

Turn N+1 (user: "no" / "let's talk about something else" / anything
          that isn't a clear yes)
         -> pending consent found, does not match affirmative pattern
         -> Memory Service is never called for this candidate
         -> zero rows written
         -> pending consent cleared (dropped, not archived anywhere)
```

### Why `pendingConsentByConversation` isn't "storing the candidate"

`ConversationEngine` keeps an in-process `Map` from conversation key to the
most recently proposed, not-yet-answered candidate. This is **not** the
"pending"/"rejected" table the Memory Extraction Engine's boundary rule
forbids:

- It is never written to the database — it's a plain JS `Map` living in
  the engine instance's memory, gone on process restart.
- It holds at most one entry per conversation, and only until the very
  next message resolves it (either way).
- It exists to answer one question — "are we mid-way through asking about
  this candidate?" — not to accumulate a durable record of proposals.

The actual memory content only ever reaches storage through
`MemoryService.persistMemoryCandidate`, gated by the real `ConsentEvent`,
exactly as required by `src/engines/memory-extraction/README.md`.

## Interpreting a consent reply

The scaffold does the simplest thing that satisfies "yes vs. not-yes,"
deliberately not building an intent classifier:

```typescript
const AFFIRMATIVE_REPLY = /^\s*(y|yes|yeah|yep|yup|sure|please\s*do|go ahead|remember it|do it|ok(ay)?)\b/i;
```

Anything that doesn't match is treated as "not granted." This is
intentionally conservative: an ambiguous reply must never accidentally
result in a write.

## Usage

```typescript
import { getConversationEngine } from '@engines/conversation';

const conversationEngine = getConversationEngine();

const turn1 = await conversationEngine.sendMessage({
  userId: 'user-1',
  companionId: 'companion-1',
  messageId: 'msg-1',
  message: 'My name is Alex and I love hiking every weekend.',
});
// turn1.value.consentQuestionAsked === true (if a candidate was found)

const turn2 = await conversationEngine.sendMessage({
  userId: 'user-1',
  companionId: 'companion-1',
  messageId: 'msg-2',
  message: 'yes',
});
// turn2.value.consentResolution === { granted: true, persisted: true }
```

## Dependencies

```typescript
export interface ConversationEngineDeps {
  contextEngine: IContextEngine;
  promptOrchestrator: IPromptOrchestrator;
  llmGateway: ILLMGateway;
  memoryExtractionEngine: IMemoryExtractionEngine;
  memoryService: IMemoryService;
}
```

All five are injected through their public interfaces — `getConversationEngine()`
wires the real singletons; tests supply fakes via
`ConversationEngineDepsOverride`.

## Testing

`__tests__/conversation.engine.test.ts` (mirrored, CI-executed copy at
`tests/unit/engines/conversation.engine.spec.ts`) mocks the Context Engine
and Prompt Engine and asserts:

- (a) a flagged candidate results in a consent question appended to the reply
- (b) a "yes" on the following turn produces exactly one Memory Service write
- (c) a "no" — or simply not answering — produces zero writes
