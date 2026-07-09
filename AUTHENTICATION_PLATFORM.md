## Featherlight Authentication Platform

Complete production-grade authentication and authorization system for Featherlight.

### Architecture

The authentication platform is built with the following core components:

#### Core Engine
- **AuthenticationEngine**: Main orchestrator for all authentication operations
- **SessionManager**: Manages session lifecycle (creation, expiration, revocation)
- **TokenManager**: Handles access and refresh token generation and rotation
- **DeviceManager**: Manages device registration and tracking

#### Security
- **JWTValidator**: Validates JWT tokens and extracts claims
- **FirebaseTokenVerifier**: Verifies Firebase ID tokens
- **PermissionEvaluator**: Evaluates permissions and authorization rules

#### Infrastructure
- **SessionRepository**: Persistence layer for sessions
- **AuthenticationMiddleware**: Express middleware for token validation
- **AuthorizationMiddleware**: Express middleware for permission enforcement

#### Events
- **AuthenticationEventPublisher**: Publishes authentication lifecycle events
- Events: UserAuthenticated, UserLoggedOut, SessionCreated, SessionExpired, DeviceRegistered, AccountLinked, etc.

### Supported Authentication Providers

1. **Firebase** - Firebase ID token authentication
2. **Email** - Email/password authentication
3. **Anonymous** - Anonymous user creation
4. **Apple** - (Future) Apple Sign-in
5. **Google** - (Future) Google Sign-in
6. **Custom JWT** - (Future) Custom JWT tokens

### Authentication Flows

#### Anonymous Login
```typescript
const response = await authEngine.authenticate({
  provider: AuthenticationProvider.ANONYMOUS,
  credentials: {},
  deviceInfo: { name: 'My Device', type: 'WEB', os: 'Linux', osVersion: '5.10' }
});
```

#### Email Authentication
```typescript
const response = await authEngine.authenticate({
  provider: AuthenticationProvider.EMAIL,
  credentials: { email: 'user@example.com', password: 'password' },
  deviceInfo: { name: 'My Device', type: 'WEB', os: 'Linux', osVersion: '5.10' }
});
```

#### Firebase Authentication
```typescript
const response = await authEngine.authenticate({
  provider: AuthenticationProvider.FIREBASE,
  credentials: { token: firebaseIdToken },
  deviceInfo: { name: 'My Device', type: 'MOBILE', os: 'iOS', osVersion: '15.0' }
});
```

#### Token Refresh
```typescript
const response = await authEngine.refreshSession(
  sessionId,
  refreshToken,
  correlationId
);
```

#### Logout
```typescript
await authEngine.logout(sessionId);
```

#### Logout All Devices
```typescript
await authEngine.logoutAllDevices(userId);
```

### Session Management

Sessions support:
- **Multiple devices**: Users can have active sessions on multiple devices
- **Device tracking**: Each device has metadata (name, OS, browser, etc.)
- **Activity tracking**: Last active timestamp for idle detection
- **Session expiry**: Configurable TTL (default 24 hours)
- **Idle timeout**: Automatic expiration after inactivity (default 30 minutes)
- **Session revocation**: Immediate session termination

### Security Features

#### Token Management
- **Access Tokens**: Short-lived JWT tokens (15 minutes)
- **Refresh Tokens**: Long-lived tokens for obtaining new access tokens (7 days)
- **Token Rotation**: Automatic refresh token rotation on each use
- **Revocation**: Immediate token invalidation

#### Brute-Force Protection
- Rate limiting on login attempts
- Configurable attempt limits and windows
- IP-based rate limiting

#### Replay Protection
- Correlation IDs track request flows
- Token rotation prevents replay attacks
- Device fingerprinting

#### Audit Logging
- All authentication events logged
- IP address and user agent tracking
- Detailed audit trail for compliance

### Authorization

#### Roles
- **GUEST**: Anonymous users (read-only)
- **USER**: Authenticated users (read, write)
- **ADMIN**: Administrative users (all operations)
- **DEVELOPER**: Developer users (API access)

#### Permissions
- **READ**: Read access to resources
- **WRITE**: Write access to resources
- **DELETE**: Delete access to resources
- **ADMIN**: Administrative operations
- **DEVELOPER**: Developer-only operations

#### Permission Checking
```typescript
// Using middleware
app.get('/admin', requireRole(UserRole.ADMIN), handler);
app.post('/api/data', requirePermission(PermissionType.WRITE), handler);

// Programmatic checking
const hasPermission = permissionEvaluator.hasPermission(
  authContext,
  PermissionType.WRITE
);
```

### Middleware

#### Authentication Middleware
```typescript
app.use(authenticationMiddleware);
// Requires valid authentication token
```

#### Optional Authentication Middleware
```typescript
app.use(optionalAuthenticationMiddleware);
// Sets auth context if token present, doesn't fail if absent
```

#### Authorization Middleware
```typescript
app.get('/admin', requireRole(UserRole.ADMIN), handler);
app.post('/data', requirePermission(PermissionType.WRITE), handler);
app.delete('/data/:id', requireAllPermissions(PermissionType.WRITE, PermissionType.DELETE), handler);
```

### API Endpoints

#### Authentication
- `POST /auth/login` - Authenticate user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout from current session
- `POST /auth/logout-all` - Logout from all devices

#### User
- `GET /auth/me` - Get current user
- `GET /auth/sessions` - Get active sessions
- `POST /auth/sessions/:id/logout` - Logout specific session

#### Devices
- `GET /auth/devices` - List user devices
- `POST /auth/devices` - Register new device
- `PUT /auth/devices/:id` - Update device
- `DELETE /auth/devices/:id` - Remove device

#### Account
- `POST /auth/link-account` - Link external provider account
- `POST /auth/anonymous-upgrade` - Upgrade anonymous account

### Events

#### UserAuthenticatedEvent
Published when user successfully authenticates.

#### UserLoggedOutEvent
Published when user logs out.

#### SessionCreatedEvent
Published when new session is created.

#### SessionExpiredEvent
Published when session expires.

#### DeviceRegisteredEvent
Published when device is registered.

#### DeviceRemovedEvent
Published when device is removed.

#### AccountLinkedEvent
Published when account is linked to provider.

### Database Schema

#### Sessions Table
- id (PK)
- userId (FK)
- deviceId (FK)
- accessToken
- refreshToken
- status
- createdAt
- expiresAt
- lastActiveAt
- metadata (JSON)

#### Devices Table
- id (PK)
- userId (FK)
- name
- type
- os
- osVersion
- browser
- registeredAt
- lastActiveAt
- isActive

#### Users Table
- id (PK)
- email
- displayName
- roles (JSON array)
- permissions (JSON array)
- isAnonymous
- createdAt
- lastLoginAt
- loginCount
- metadata (JSON)

#### LinkedProviders Table
- id (PK)
- userId (FK)
- provider
- providerId
- email
- linkedAt

### Configuration

#### Token TTLs
```typescript
accessTokenTTL: 15 * 60, // 15 minutes
refreshTokenTTL: 7 * 24 * 60 * 60, // 7 days
```

#### Session Settings
```typescript
sessionTTL: 24 * 60 * 60 * 1000, // 24 hours
idleTimeout: 30 * 60 * 1000, // 30 minutes
maxConcurrentSessions: 5,
enableDeviceLimiting: true
```

#### Rate Limiting
```typescript
loginAttemptsLimit: 5,
loginAttemptsWindow: 15 * 60, // 15 minutes
tokenRefreshLimit: 10,
tokenRefreshWindow: 60 * 60 // 1 hour
```

### Testing

The authentication platform includes comprehensive test coverage:

#### Unit Tests
- AuthenticationEngine tests
- SessionManager tests
- TokenManager tests
- DeviceManager tests
- JWTValidator tests
- PermissionEvaluator tests

#### Integration Tests
- End-to-end authentication flow
- Token refresh flow
- Device management flow
- Permission enforcement
- Multiple device sessions

#### Security Tests
- Token expiration
- Token revocation
- Replay protection
- Rate limiting
- Permission enforcement

### Usage Examples

#### Basic Login Flow
```typescript
// 1. User logs in
const authResponse = await authEngine.authenticate({
  provider: AuthenticationProvider.EMAIL,
  credentials: { email: 'user@example.com', password: 'password' },
  deviceInfo: { name: 'My Device', type: 'WEB', os: 'Linux', osVersion: '5.10' }
});

// 2. Store tokens and session ID
const { accessToken, refreshToken, session } = authResponse;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('sessionId', session.id);

// 3. Use access token for API requests
axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
```

#### Token Refresh Flow
```typescript
// When access token expires
const refreshResponse = await authEngine.refreshSession(
  sessionId,
  refreshToken,
  correlationId
);

// Update stored tokens
localStorage.setItem('accessToken', refreshResponse.accessToken);
localStorage.setItem('refreshToken', refreshResponse.refreshToken);
```

#### Logout Flow
```typescript
// Logout from current session
await authEngine.logout(sessionId);

// Clear local storage
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
localStorage.removeItem('sessionId');
```

### Security Best Practices

1. **Always use HTTPS** in production
2. **Store refresh tokens securely** (httpOnly cookies or secure storage)
3. **Implement CSRF protection** for state-changing operations
4. **Use strong password policies** for email authentication
5. **Implement rate limiting** to prevent brute-force attacks
6. **Monitor authentication logs** for suspicious activity
7. **Rotate tokens regularly** (automatic via refresh token rotation)
8. **Validate device information** during registration
9. **Implement device fingerprinting** for additional security
10. **Use correlation IDs** for tracing authentication flows

### Performance Considerations

- **Token validation**: Uses in-memory caching for performance
- **Session cleanup**: Automatic expiration of idle sessions
- **Device tracking**: Efficient device lookup by user ID
- **Concurrent sessions**: Supports multiple concurrent sessions per user

### Future Enhancements

- Multi-factor authentication (MFA)
- Social media authentication (Google, Apple, Facebook)
- Custom OAuth providers
- Risk-based authentication
- Behavioral analytics
- Passwordless authentication
- Biometric authentication

### Production Deployment

1. Set environment variables:
   - JWT_ACCESS_SECRET
   - JWT_REFRESH_SECRET
   - FIREBASE_PROJECT_ID (if using Firebase)
   - FIREBASE_PRIVATE_KEY (if using Firebase)

2. Configure database connection for persistence

3. Enable HTTPS only

4. Set appropriate CORS policies

5. Implement rate limiting at API gateway level

6. Monitor authentication metrics and logs

7. Set up alerts for suspicious authentication patterns

### Troubleshooting

#### Token Validation Failures
- Check token expiration time
- Verify JWT secret key is correctly configured
- Check token format (Bearer scheme)

#### Session Not Found
- Session may have expired
- Session was revoked
- Invalid session ID

#### Permission Denied
- User lacks required permission
- User role does not have required permission
- Check permission policy configuration

### API Documentation

See OpenAPI specification in `openapi.yaml` for complete API documentation.

### Compliance

The authentication platform implements:
- OWASP Top 10 security guidelines
- GDPR-compliant data handling
- SOC 2 compliance considerations
- PCI DSS-compliant payment handling (if applicable)

**Status**: Production-ready
**Version**: 1.0.0
**Last Updated**: 2026-07-09
