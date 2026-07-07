export {
  getRelationshipEngine,
  registerRelationshipEngine,
  resetRelationshipEngine,
} from './relationship.factory';
export type { RelationshipEngineDeps } from './relationship.factory';

export type { IRelationshipEngine } from './interfaces/relationship-engine.interface';

export type {
  RelationshipSnapshotDTO,
  ResolveRelationshipOptions,
} from './dtos/relationship-engine.dto';

export {
  RelationshipLevel,
  RelationshipStatus,
} from './enums/relationship.enums';
