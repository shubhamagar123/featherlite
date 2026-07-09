/**
 * Authentication Engine
 * Complete authentication and authorization system
 */

// Types
export * from './types';

// Core Engine
export { AuthenticationEngine } from './authentication.engine';

// Managers
export { SessionManager } from './managers/session.manager';
export { TokenManager } from './managers/token.manager';
export { DeviceManager } from './managers/device.manager';

// Repositories
export { SessionRepository } from './repositories/session.repository';

// Security
export { JWTValidator } from './security/jwt.validator';
export { FirebaseTokenVerifier } from './security/firebase.verifier';
export { PermissionEvaluator } from './security/permission.evaluator';

// Middleware
export {
  authenticationMiddleware,
  optionalAuthenticationMiddleware,
} from './middleware/auth.middleware';
export {
  requireRole,
  requirePermission,
  requireAllPermissions,
  requireAdmin,
  requireDeveloper,
} from './middleware/authorization.middleware';

// Events
export {
  AuthenticationEventPublisher,
  UserAuthenticatedEvent,
  UserLoggedOutEvent,
  SessionCreatedEvent,
  SessionExpiredEvent,
  DeviceRegisteredEvent,
  DeviceRemovedEvent,
  AccountLinkedEvent,
  TokenRotatedEvent,
  AuthenticationFailedEvent,
} from './events/authentication.events';
