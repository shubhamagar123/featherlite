import { BaseDomainEvent } from '../contracts/base-domain-event';
import { EventType, AggregateType, EventPriority } from '../enums/event.enums';
import { EventContext } from '../dto/event.dto';

export interface UserCreatedPayload {
  username: string;
  email: string;
  displayName?: string;
  timezone?: string;
}

export class UserCreatedEvent extends BaseDomainEvent<UserCreatedPayload> {
  constructor(
    userId: string,
    payload: UserCreatedPayload,
    context: EventContext
  ) {
    super(
      userId,
      AggregateType.USER,
      EventType.USER_CREATED,
      'User Created',
      payload,
      context,
      EventPriority.NORMAL,
      1
    );
  }

  validate(): boolean {
    const payload = this.getPayload();
    return Boolean(payload.username && payload.email);
  }

  getUsername(): string {
    return this.getPayload().username;
  }

  getEmail(): string {
    return this.getPayload().email;
  }

  getDisplayName(): string | undefined {
    return this.getPayload().displayName;
  }

  getTimezone(): string | undefined {
    return this.getPayload().timezone;
  }
}
