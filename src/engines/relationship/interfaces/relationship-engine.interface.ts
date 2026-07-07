import { IResult } from '@services/types/result.type';
import { RelationshipSnapshotDTO, ResolveRelationshipOptions } from '../dtos/relationship-engine.dto';

export interface IRelationshipEngine {
  getRelationshipSnapshot(
    options: ResolveRelationshipOptions
  ): Promise<IResult<RelationshipSnapshotDTO>>;
}
