# Memory Engine

The Memory Engine is a sophisticated knowledge management system that transforms conversations, interactions, and events into structured, searchable, long-term memories. Unlike a simple conversation logger, this engine intelligently extracts, classifies, merges, and ranks memories to build a comprehensive understanding of relationships and contexts.

## Overview

The Memory Engine operates on several key principles:

1. **Intelligent Extraction**: Automatically identifies important information from unstructured conversation data
2. **Semantic Classification**: Categorizes memories into 15 different types (PERSON, RELATIONSHIP, PREFERENCE, ROUTINE, etc.)
3. **Conflict Resolution**: Handles contradictory information gracefully through intelligent merging strategies
4. **Temporal Understanding**: Maintains chronological timelines and supports time-based searches
5. **Relationship-Scoped Context**: Tracks memories within specific relationship contexts
6. **Importance Evaluation**: Scores memories based on emotional content, type, and entity relationships
7. **Expiry Management**: Automatically manages memory lifecycle based on importance and type

## Core Responsibilities

- **Extracting memories** from conversations and events
- **Updating** existing memories with new information
- **Merging** duplicate or related memories
- **Resolving conflicts** between contradictory memories
- **Searching** memories by multiple strategies
- **Expiring** old memories based on retention policies
- **Archiving** memories for long-term storage
- **Ranking** memories by relevance and importance
- **Building snapshots** of memory state at a point in time
- **Maintaining timelines** of chronological memory ordering

## Architecture Components

### Extractors
- **EntityExtractor**: Identifies people, places, dates, organizations, and concepts
- **MemoryClassifier**: Auto-categorizes memories into 15 semantic types
- **ImportanceEvaluator**: Scores memory significance (0-1)
- **ExpiryEvaluator**: Determines retention based on type and importance

### Processors
- **ConflictResolver**: Handles contradictory memories via similarity analysis
- **MemoryMerger**: Combines related memories intelligently
- **MemoryIndexer**: Builds keyword, entity, type, and tag indexes

### Searchers
- **MemorySearcher**: Supports keyword, semantic, entity, timeline, and recent searches

### Strategies
- **MemoryRankingStrategy**: Scores memories by recency, importance, confidence, relevance
- **MemoryRetentionStrategy**: Decides which memories to keep based on priority

### Support
- **MemoryTimeline**: Maintains chronological ordering
- **MemorySnapshotBuilder**: Generates aggregate memory statistics

## Usage Examples

### Creating Memories
```typescript
const engine = getMemoryEngine();

const result = engine.create(
  'user-1',
  MemoryType.CONTEXT,
  'Met John',
  'I met John at the coffee shop. He works at TechCorp.'
);

if (result.isSuccess) {
  const memory = result.value;
  console.log(memory.memoryType);  // AUTO-CLASSIFIED
  console.log(memory.importance);  // 0-1 score
  console.log(memory.entities);    // John, TechCorp
  console.log(memory.confidence);  // Extraction quality
}
```

### Searching Memories
```typescript
// Keyword search
const results = engine.search({
  searchType: SearchType.KEYWORD,
  query: 'coffee shop',
  userId: 'user-1',
  limit: 10
});

// Semantic search
const results = engine.search({
  searchType: SearchType.SEMANTIC,
  query: 'work colleagues',
  userId: 'user-1',
  memoryType: MemoryType.PERSON
});

// Timeline search
const results = engine.search({
  searchType: SearchType.TIMELINE,
  query: '',
  userId: 'user-1',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});
```

### Memory Lifecycle
```typescript
// Update memory
const updated = { ...memory, tags: ['important'] };
engine.update(updated);

// Merge related memories
const mergeResult = engine.merge([id1, id2]);

// Resolve conflicts
const resolution = engine.resolveConflict(existingId, newId);

// Expire memory
engine.expire(memoryId);

// Archive memory
engine.archive(memoryId);
```

### Snapshots & Timelines
```typescript
// Get memory snapshot
const snapshot = engine.buildSnapshot('user-1');
console.log(snapshot.value.totalMemories);
console.log(snapshot.value.memoryTypeDistribution);
console.log(snapshot.value.averageImportance);

// Get chronological timeline
const timeline = engine.getTimeline('user-1');

// Relationship-scoped snapshot
const relSnapshot = engine.buildSnapshot('user-1', 'relationship-id');
```

## Memory Types (15 Types)

| Type | Retention | Weight | Use Case |
|------|-----------|--------|----------|
| PERSON | 5 years | 25 | Individual information |
| RELATIONSHIP | 10 years | 30 | Relationship dynamics |
| PREFERENCE | 2 years | 10 | Likes and dislikes |
| ROUTINE | 180 days | 10 | Recurring patterns |
| HEALTH | 2 years | 20 | Health and wellness |
| WORK | 1 year | 15 | Job and career |
| TRAVEL | 3 years | 15 | Trips and destinations |
| FOOD | 180 days | 5 | Food preferences |
| GOAL | 2 years | 25 | Aspirations |
| HABIT | 180 days | 10 | Behavioral patterns |
| EVENT | 5 years | 20 | Specific occurrences |
| CONTEXT | 90 days | 5 | Background info |
| TEMPORARY | 30 days | 3 | Short-term info |
| LONG_TERM | 10 years | 25 | Permanent knowledge |
| CONVERSATION_CALLBACK | 7 days | 8 | Reminders |

## Event Subscriptions

The engine automatically subscribes to:

1. **InteractionEndedEvent**: Creates CONTEXT memory from summary
2. **MessageReceivedEvent**: Creates CONVERSATION_CALLBACK for significant messages
3. **RelationshipUpdatedEvent**: Creates RELATIONSHIP memory for status changes
4. **MomentTriggeredEvent**: Creates EVENT memory for significant moments
5. **WorldUpdatedEvent**: Creates CONTEXT memory for companion state

## Testing

```bash
# Unit tests (27 tests)
npm test -- src/engines/memory/__tests__/memory.engine.test.ts

# Integration tests (10 tests)
npm test -- src/engines/memory/__tests__/memory.engine.integration.test.ts
```

## Performance

- **Create**: O(n) where n = entity extraction (~10-50 typical)
- **Search**: O(m) where m = indexed memories
- **Merge**: O(e) where e = total entities
- **Snapshot**: O(m) for statistics
- **Storage**: ~1KB per memory

## Future Enhancements

1. Vector embeddings for semantic similarity
2. Temporal confidence decay
3. Entity relationship graphs
4. Fine-grained privacy levels
5. Persistent storage backends
6. Distributed indexing
7. ML-based classification
8. Bias detection
9. LLM-powered semantic search
10. Automatic summarization

## Integration Points

- Receives events from **Event Engine**
- Provides context to **Relationship Engine**
- Triggers notifications via **Notification Engine**
- Analyzed by **Analytics Engine**
- Stored historically by **History Engine**

