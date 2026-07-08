import { IResult } from '@services/types/result.type';
import { EventEnvelope, EventHandlerMetadata } from '../dto/event.dto';
import { EventType } from '../enums/event.enums';

export interface IEventHandler<T = Record<string, any>> {
  getMetadata(): EventHandlerMetadata;
  canHandle(envelope: EventEnvelope): boolean;
  handle(envelope: EventEnvelope<T>): Promise<IResult<void>>;
  onError(envelope: EventEnvelope<T>, error: Error): Promise<void>;
}
