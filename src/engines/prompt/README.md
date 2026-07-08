# Prompt Engine

The **Prompt Engine** is responsible for constructing production-ready prompts
for any LLM provider. It is **completely independent** from OpenAI, Claude,
Gemini, or any other AI model.

Its only responsibility is to **build prompts**, never to **call LLMs**.

---

## Core Responsibility

> The Prompt Engine receives a `ConversationContextDTO` and produces a
> `PromptPackage` containing system, developer, and user prompts. It never
> reaches to the database, never calls services, and never touches any LLM API.

---

## Responsibilities

### Prompt Construction
- Build system prompts (instructions for the model)
- Build developer prompts (implementation guidance)
- Build user prompts (user input + context)

### Context Injection
- Inject world context (scene, weather, time of day, mood)
- Inject companion context (state, mood, location, availability)
- Inject user context (username, preferences, language)
- Inject relationship context (level, affection, trust)
- Inject memory context (critical memories ranked by importance)
- Inject moments context (recent shared moments)
- Inject conversation context (conversation history)

### Rules & Safety
- Enforce product rules (feature gates, restrictions)
- Apply safety rules (content filters, harm prevention)
- Apply personality rules (voice, tone, character traits)
- Apply communication style (formal, casual, empathetic)
- Validate compliance before returning

### Token Management
- Apply token budgeting (respect max_tokens parameter)
- Compress prompts when necessary (multiple levels)
- Track token counts per segment
- Provide compression statistics

### Versioning & Caching
- Support multiple prompt template versions (A/B testing)
- Cache compiled prompts (avoid recomputation)
- Track cache hits/misses
- Provide metrics for optimization

---

## Diagram 1 — Prompt Engine in the system

```mermaid
flowchart TD
    CONV["Conversation Engine<br/>(future)"]
    CTX["Context Engine"]
    PROMPT["🔤 Prompt Engine"]
    LLM["LLM Provider<br/>(future)<br/>OpenAI, Claude, etc."]

    CTX -->|"ConversationContextDTO"| PROMPT
    PROMPT -->|"PromptPackage"| CONV
    CONV -->|"build prompt via"| PROMPT
    CONV -->|"send prompt to"| LLM

    PROMPT -. "NEVER calls" .-> LLM
    PROMPT -. "NEVER accesses" .-> DB["Database"]
    PROMPT -. "NEVER calls" .-> SVC["Services"]

    classDef engine fill:#4a90e2,stroke:#2c5aa0,color:#fff
    classDef forbidden fill:#c0392b,stroke:#8b0000,color:#fff
    class PROMPT engine
    class LLM,DB,SVC forbidden
```

---

## Diagram 2 — Prompt building pipeline

```mermaid
sequenceDiagram
    participant App as Conversation Engine
    participant Engine as PromptEngine
    participant Builder as PromptBuilder
    participant Templates as Template Loader
    participant Rules as Rule Engine
    participant Validator as Validator
    participant Compressor as Compressor
    participant Cache as Cache

    App->>Engine: buildPrompt(context)
    Engine->>Cache: getCachedPrompt(key)
    Cache-->>Engine: cached PromptPackage (if hit)
    
    alt Cache Miss
        Engine->>Builder: build(context)
        
        Builder->>Templates: loadTemplate(type)
        Templates-->>Builder: PromptTemplate
        
        Builder->>Builder: injectContext(template, context)
        
        Builder->>Rules: compileRules(context)
        Rules-->>Builder: CompiledRule[]
        
        Builder->>Builder: insertRules(segments)
        
        Builder->>Validator: validate(prompt)
        Validator-->>Builder: ValidationResult
        
        alt Needs Compression
            Builder->>Compressor: compress(prompt, maxTokens)
            Compressor-->>Builder: compressed PromptPackage
        end
        
        Builder->>Cache: set(key, prompt)
        Builder-->>Engine: PromptPackage
    end
    
    Engine-->>App: PromptPackage
```

---

## Diagram 3 — Prompt Engine architecture

```mermaid
flowchart TD
    CONTEXT["ConversationContextDTO<br/>(from Context Engine)"]
    
    CONTEXT -->|"PromptBuildContext"| BUILDER["PromptBuilder"]
    
    BUILDER --> LOADER["Template Loader"]
    BUILDER --> INJECTOR["Context Injector"]
    BUILDER --> RULES["Rule Engine"]
    BUILDER --> VALIDATOR["Validator"]
    BUILDER --> COMPRESSOR["Compressor"]
    BUILDER --> CACHE["Cache"]
    
    LOADER --> TEMPLATES["Template Store<br/>(in-memory)"]
    TEMPLATES --> POOL["Template Pool<br/>Conversation<br/>Memory Extract<br/>Relationship Update<br/>etc."]
    
    INJECTOR --> VARS["Variable Resolver<br/>- User<br/>- Companion<br/>- World<br/>- Relationship<br/>- Memory<br/>- Moments"]
    
    RULES --> SAFETY["Safety Rules"]
    RULES --> PERSONALITY["Personality Rules"]
    RULES --> PRODUCT["Product Rules"]
    RULES --> COMSTYLE["Communication Style"]
    RULES --> LEGAL["Legal Rules"]
    
    VALIDATOR --> VCK1["Completeness Check"]
    VALIDATOR --> VCK2["Safety Check"]
    VALIDATOR --> VCK3["Compliance Check"]
    
    COMPRESSOR --> TECH1["Remove Redundancy"]
    COMPRESSOR --> TECH2["Summarize"]
    COMPRESSOR --> TECH3["Prioritize"]
    COMPRESSOR --> TECH4["Truncate"]
    
    CACHE --> INMEM["In-Memory Cache<br/>TTL-based expiry"]
    
    BUILDER -->|"PromptPackage"| OUT["Output"]
```

---

## Interfaces

### IPromptEngine

```typescript
interface IPromptEngine {
  buildPrompt(context: PromptBuildContext): Promise<IResult<PromptPackage>>;
  getCachedPrompt(cacheKey: string): Promise<IResult<PromptPackage | null>>;
  getMetrics(templateId: string): Promise<IResult<PromptMetrics[]>>;
}
```

### IPromptBuilder

Orchestrates the entire prompt construction pipeline:
1. Load template
2. Inject context (world, companion, relationship, memory, moments, user)
3. Apply rules (safety, personality, product, style)
4. Validate completeness and compliance
5. Compress if needed
6. Cache the result

### IPromptValidator

Validates:
- All required context is present
- No safety rule violations
- Compliance with product rules
- Correct role assignment

### IPromptCompressor

Compresses using strategies:
- **NONE**: No compression
- **LIGHT**: Remove redundancy, deduplicate
- **MODERATE**: Summarize non-critical sections
- **AGGRESSIVE**: Prioritize by importance, truncate

### IPromptCache

In-memory cache with TTL:
- Get/set/invalidate
- Track hits/misses
- Automatic expiry

---

## Data Flow

```
ConversationContextDTO
    ↓
PromptBuildContext
    ↓
PromptBuilder.build()
    ├─→ PromptTemplate (from loader)
    ├─→ Inject Context (user, companion, world, relationship, memory, moments)
    ├─→ Apply Rules (safety, personality, product, style)
    ├─→ Validate (completeness, safety, compliance)
    ├─→ Compress (if token budget exceeded)
    └─→ Cache (store compiled result)
    ↓
PromptPackage
    ├── systemPrompt: PromptSegment
    ├── developerPrompt?: PromptSegment
    ├── userPrompt: PromptSegment
    ├── rules: CompiledRule[]
    ├── validation: ValidationResult
    ├── metrics: PromptMetrics
    └── cached: boolean
    ↓
Ready to send to LLM provider
```

---

## Enums

### PromptRole
- SYSTEM — System/instruction prompt
- DEVELOPER — Implementation guidance
- USER — User input + context
- ASSISTANT — (For multi-turn, future)

### PromptType
- CONVERSATION — Main conversation
- MEMORY_EXTRACTION — Extract memories from events
- RELATIONSHIP_UPDATE — Relationship progression
- RECOMMENDATION — Generate recommendations
- MOMENT_CREATION — Create shared moments
- COMPANION_RESPONSE — Generate companion reply
- SAFETY_CHECK — Content safety validation

### PromptStrategy
- STANDARD — Balanced, default approach
- DETAILED — Comprehensive, include all context
- CONCISE — Minimal, only essentials
- EMOTIONAL — Emphasize feelings and personality
- ANALYTICAL — Logical, data-driven

### RuleCategory
- SAFETY — Content safety, harm prevention
- PERSONALITY — Character traits, voice, tone
- COMMUNICATION_STYLE — Formal, casual, empathetic
- PRODUCT — Feature gates, restrictions
- LEGAL — Privacy, legal disclaimers

### CompressionLevel
- NONE → No compression
- LIGHT → Remove redundancy
- MODERATE → Summarize non-critical
- AGGRESSIVE → Prioritize by importance

---

## Folder Structure

```
src/engines/prompt/
├── interfaces/
│   ├── prompt-engine.interface.ts       # IPromptEngine
│   ├── prompt-builder.interface.ts      # IPromptBuilder
│   ├── prompt-strategy.interface.ts     # IPromptStrategy
│   ├── prompt-validator.interface.ts    # IPromptValidator
│   ├── prompt-compressor.interface.ts   # IPromptCompressor
│   └── prompt-cache.interface.ts        # IPromptCache
├── dtos/
│   └── prompt.dtos.ts                   # All DTOs
├── enums/
│   └── prompt.enums.ts                  # All enums
├── templates/
│   ├── conversation.template.ts         # Conversation prompt template
│   ├── memory-extraction.template.ts    # Memory extraction template
│   ├── relationship.template.ts         # Relationship update template
│   └── ...
├── rules/
│   ├── safety.rules.ts                  # Safety rules definitions
│   ├── personality.rules.ts             # Personality rules
│   ├── product.rules.ts                 # Product rules
│   ├── communication-style.rules.ts     # Communication style
│   └── rule-engine.ts                   # Rule compilation & injection
├── strategies/
│   ├── standard.strategy.ts             # Standard strategy
│   ├── detailed.strategy.ts             # Detailed strategy
│   ├── concise.strategy.ts              # Concise strategy
│   └── ...
├── builders/
│   ├── prompt.builder.ts                # Main builder
│   ├── template-loader.ts               # Template loading
│   └── context-injector.ts              # Context injection
├── compressor/
│   └── prompt-compressor.ts             # Compression logic
├── validator/
│   └── prompt-validator.ts              # Validation logic
├── cache/
│   └── prompt-cache.ts                  # In-memory cache
├── prompt.engine.ts                     # Main engine class
├── prompt.factory.ts                    # DI factory
├── index.ts                             # Barrel exports
└── README.md
```

---

## Usage Example

```typescript
import { getPromptEngine } from '@engines/prompt';
import { PromptType, PromptStrategy } from '@engines/prompt';

const promptEngine = getPromptEngine();

// Build a prompt from conversation context
const result = await promptEngine.buildPrompt({
  conversationContext: contextDTO,
  promptType: PromptType.CONVERSATION,
  strategy: PromptStrategy.DETAILED,
  maxTokens: 2000,
  compressionLevel: CompressionLevel.MODERATE,
});

if (result.isSuccess) {
  const promptPackage = result.value;
  
  // promptPackage contains:
  // - systemPrompt: PromptSegment (instructions)
  // - developerPrompt?: PromptSegment (optional implementation guidance)
  // - userPrompt: PromptSegment (user input + injected context)
  // - rules: CompiledRule[] (safety, personality, product rules)
  // - validation: ValidationResult (pass/fail + errors)
  // - metrics: PromptMetrics (tracking for monitoring)
  
  // Now ready to send to LLM:
  // const response = await openai.chat.completions.create({
  //   messages: [
  //     { role: 'system', content: promptPackage.systemPrompt.content },
  //     { role: 'user', content: promptPackage.userPrompt.content },
  //   ],
  //   max_tokens: promptPackage.totalTokens,
  // });
}
```

---

## Design Principles

### 1. **LLM Provider Independence**
The Prompt Engine produces prompt structure only. It never calls OpenAI, Claude,
Gemini, or any other LLM. The caller (future Conversation Engine) is responsible
for sending the prompt to the chosen provider.

### 2. **Context-Only Consumption**
Receives only `ConversationContextDTO`. Never accesses repositories, services,
databases, or other engines. Pure function of context.

### 3. **Composable Segments**
Prompts are built as modular segments (system, developer, user), each with:
- Content
- Role
- Order
- Token count
- Compression flag

### 4. **Declarative Rules**
Rules are defined declaratively (category, severity, statement) and compiled
before injection. New rule types can be added without code changes.

### 5. **Token-Aware**
Every segment tracks token count. Compression respects budget constraints and
reports compression ratio + technique used.

### 6. **Observable**
Every build produces metrics (template ID, strategy, tokens, rules, duration).
Enables A/B testing, monitoring, and optimization.

---

## Future Work

1. **Implement template library** — Conversation, Memory Extraction, Relationship, etc.
2. **Implement rule engine** — Compile and inject safety, personality, product rules
3. **Implement compressor** — Multiple compression strategies
4. **Implement validator** — Completeness, safety, compliance checks
5. **Connect to Conversation Engine** — Receive context, send PromptPackage
6. **Telemetry** — Track metrics for A/B testing and optimization
