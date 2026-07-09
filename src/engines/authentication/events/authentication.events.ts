/**
 * Authentication Events
 * Events published during authentication lifecycle
 */

import { User, Session, Device } from '../types';

export abstract class AuthenticationEvent {
  abstract readonly eventType: string;
  readonly timestamp: Date = new Date();
  readonly correlationId: string;

  constructor(correlationId: string) {
    this.correlationId = correlationId;
  }
}

export class UserAuthenticatedEvent extends AuthenticationEvent {
  readonly eventType = 'USER_AUTHENTICATED';

  constructor(
    public user: User,
    public session: Session,
    public device: Device,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class UserLoggedOutEvent extends AuthenticationEvent {
  readonly eventType = 'USER_LOGGED_OUT';

  constructor(
    public userId: string,
    public sessionId: string,
    public deviceId: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class SessionCreatedEvent extends AuthenticationEvent {
  readonly eventType = 'SESSION_CREATED';

  constructor(
    public session: Session,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class SessionExpiredEvent extends AuthenticationEvent {
  readonly eventType = 'SESSION_EXPIRED';

  constructor(
    public sessionId: string,
    public userId: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class SessionRevokedEvent extends AuthenticationEvent {
  readonly eventType = 'SESSION_REVOKED';

  constructor(
    public sessionId: string,
    public userId: string,
    public reason: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class DeviceRegisteredEvent extends AuthenticationEvent {
  readonly eventType = 'DEVICE_REGISTERED';

  constructor(
    public device: Device,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class DeviceRemovedEvent extends AuthenticationEvent {
  readonly eventType = 'DEVICE_REMOVED';

  constructor(
    public deviceId: string,
    public userId: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class AccountLinkedEvent extends AuthenticationEvent {
  readonly eventType = 'ACCOUNT_LINKED';

  constructor(
    public userId: string,
    public provider: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class TokenRotatedEvent extends AuthenticationEvent {
  readonly eventType = 'TOKEN_ROTATED';

  constructor(
    public sessionId: string,
    public userId: string,
    public reason: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class AuthenticationFailedEvent extends AuthenticationEvent {
  readonly eventType = 'AUTHENTICATION_FAILED';

  constructor(
    public provider: string,
    public reason: string,
    public ipAddress: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export interface AuthenticationEventListener {
  onUserAuthenticated(event: UserAuthenticatedEvent): Promise<void>;
  onUserLoggedOut(event: UserLoggedOutEvent): Promise<void>;
  onSessionCreated(event: SessionCreatedEvent): Promise<void>;
  onSessionExpired(event: SessionExpiredEvent): Promise<void>;
  onDeviceRegistered(event: DeviceRegisteredEvent): Promise<void>;
  onDeviceRemoved(event: DeviceRemovedEvent): Promise<void>;
  onAccountLinked(event: AccountLinkedEvent): Promise<void>;
  onAuthenticationFailed(event: AuthenticationFailedEvent): Promise<void>;
}

export class AuthenticationEventPublisher {
  private listeners: AuthenticationEventListener[] = [];

  subscribe(listener: AuthenticationEventListener): void {
    this.listeners.push(listener);
  }

  unsubscribe(listener: AuthenticationEventListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  async publishUserAuthenticated(event: UserAuthenticatedEvent): Promise<void> {
    for (const listener of this.listeners) {
      await listener.onUserAuthenticated(event);
    }
  }

  async publishUserLoggedOut(event: UserLoggedOutEvent): Promise<void> {
    for (const listener of this.listeners) {
      await listener.onUserLoggedOut(event);
    }
  }

  async publishSessionCreated(event: SessionCreatedEvent): Promise<void> {
    for (const listener of this.listeners) {
      await listener.onSessionCreated(event);
    }
  }

  async publishSessionExpired(event: SessionExpiredEvent): Promise<void> {
    for (const listener of this.listeners) {
      await listener.onSessionExpired(event);
    }
  }

  async publishDeviceRegistered(event: DeviceRegisteredEvent): Promise<void> {
    for (const listener of this.listeners) {
      await listener.onDeviceRegistered(event);
    }
  }

  async publishDeviceRemoved(event: DeviceRemovedEvent): Promise<void> {
    for (const listener of this.listeners) {
      await listener.onDeviceRemoved(event);
    }
  }

  async publishAccountLinked(event: AccountLinkedEvent): Promise<void> {
    for (const listener of this.listeners) {
      await listener.onAccountLinked(event);
    }
  }

  async publishAuthenticationFailed(event: AuthenticationFailedEvent): Promise<void> {
    for (const listener of this.listeners) {
      await listener.onAuthenticationFailed(event);
    }
  }
}
