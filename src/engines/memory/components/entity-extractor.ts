import { Result } from '../../../services/types/result.type';
import { Entity, EntityExtractionResult } from '../dtos/memory.dto';
import { EntityType } from '../enums/memory.enums';
import { IEntityExtractor } from '../interfaces/memory.interfaces';
import { v4 as uuid } from 'uuid';

export class EntityExtractor implements IEntityExtractor {
  extract(text: string): Result<EntityExtractionResult> {
    return Result.try(() => {
      const entities: Entity[] = [];
      const seenNames = new Set<string>();

      const personPattern = /(?:named|called|is|meets|friend|person)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
      const personMatches = text.matchAll(personPattern);
      for (const match of personMatches) {
        const name = match[1];
        if (!seenNames.has(name) && name.length > 2) {
          seenNames.add(name);
          entities.push({
            id: uuid(),
            type: EntityType.PERSON,
            name,
            description: `Person mentioned in context`,
          });
        }
      }

      const placePattern = /(?:in|from|at|visited|lives in)\s+([A-Z][a-zA-Z\s]+?)(?:[,.]|$)/g;
      const placeMatches = text.matchAll(placePattern);
      for (const match of placeMatches) {
        const name = match[1].trim();
        if (!seenNames.has(name) && name.length > 2) {
          seenNames.add(name);
          entities.push({
            id: uuid(),
            type: EntityType.PLACE,
            name,
            description: `Place mentioned in context`,
          });
        }
      }

      const datePattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|today|tomorrow|yesterday|\d{1,2}\/\d{1,2}\/\d{4})\b/gi;
      const dateMatches = text.matchAll(datePattern);
      for (const match of dateMatches) {
        const name = match[1];
        if (!seenNames.has(name)) {
          seenNames.add(name);
          entities.push({
            id: uuid(),
            type: EntityType.DATE,
            name,
            description: `Date mentioned in context`,
          });
        }
      }

      const numberPattern = /\b(\d+(?:\.\d+)?)\b/g;
      const numberMatches = text.matchAll(numberPattern);
      for (const match of numberMatches) {
        const name = match[1];
        if (!seenNames.has(name)) {
          seenNames.add(name);
          entities.push({
            id: uuid(),
            type: EntityType.NUMBER,
            name,
            description: `Number mentioned in context`,
          });
        }
      }

      const organizationPattern = /\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*(?:\s+(?:Inc|Ltd|LLC|Corp|Company|University|School)))\b/g;
      const orgMatches = text.matchAll(organizationPattern);
      for (const match of orgMatches) {
        const name = match[1];
        if (!seenNames.has(name) && name.length > 3) {
          seenNames.add(name);
          entities.push({
            id: uuid(),
            type: EntityType.ORGANIZATION,
            name,
            description: `Organization mentioned in context`,
          });
        }
      }

      const confidence = Math.min(1.0, entities.length / 10);

      return {
        entities,
        confidence,
        sourceText: text,
      };
    });
  }
}
