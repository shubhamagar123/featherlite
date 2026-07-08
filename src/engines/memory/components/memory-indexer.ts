import { Result } from '../../../services/types/result.type';
import { Memory } from '../dto/memory.dto';
import { IMemoryIndexer } from '../interfaces/memory.interfaces';

export class MemoryIndexer implements IMemoryIndexer {
  private keywordIndex: Map<string, Set<string>> = new Map();
  private entityIndex: Map<string, Set<string>> = new Map();
  private typeIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  index(memory: Memory): Result<void> {
    return Result.try(() => {
      const memoryId = memory.id;

      const words = this.tokenize(memory.title + ' ' + memory.description);
      for (const word of words) {
        if (!this.keywordIndex.has(word)) {
          this.keywordIndex.set(word, new Set());
        }
        this.keywordIndex.get(word)!.add(memoryId);
      }

      for (const entity of memory.entities) {
        const entityKey = entity.name.toLowerCase();
        if (!this.entityIndex.has(entityKey)) {
          this.entityIndex.set(entityKey, new Set());
        }
        this.entityIndex.get(entityKey)!.add(memoryId);
      }

      const typeKey = memory.memoryType;
      if (!this.typeIndex.has(typeKey)) {
        this.typeIndex.set(typeKey, new Set());
      }
      this.typeIndex.get(typeKey)!.add(memoryId);

      for (const tag of memory.tags) {
        const tagKey = tag.toLowerCase();
        if (!this.tagIndex.has(tagKey)) {
          this.tagIndex.set(tagKey, new Set());
        }
        this.tagIndex.get(tagKey)!.add(memoryId);
      }
    });
  }

  clearIndex(): Result<void> {
    return Result.try(() => {
      this.keywordIndex.clear();
      this.entityIndex.clear();
      this.typeIndex.clear();
      this.tagIndex.clear();
    });
  }

  searchKeywords(keywords: string[]): Set<string> {
    const results = new Set<string>();

    for (const keyword of keywords) {
      const key = keyword.toLowerCase();
      const matches = this.keywordIndex.get(key);
      if (matches) {
        for (const memoryId of matches) {
          results.add(memoryId);
        }
      }
    }

    return results;
  }

  searchEntities(entityNames: string[]): Set<string> {
    const results = new Set<string>();

    for (const name of entityNames) {
      const key = name.toLowerCase();
      const matches = this.entityIndex.get(key);
      if (matches) {
        for (const memoryId of matches) {
          results.add(memoryId);
        }
      }
    }

    return results;
  }

  searchByType(memoryType: string): Set<string> {
    return this.typeIndex.get(memoryType) || new Set();
  }

  searchByTag(tag: string): Set<string> {
    const key = tag.toLowerCase();
    return this.tagIndex.get(key) || new Set();
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .map((word) => word.replace(/[^a-z0-9]/g, ''));
  }
}
