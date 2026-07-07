# Express Application Bootstrap Documentation

## Overview

Complete Express.js application bootstrap with production-grade configuration, middleware, error handling, and logging.

## Files Created

### Application Entry Point
- **`src/index.ts`** - Main entry point that starts the server
- **`src/app.ts`** - Express application configuration and middleware setup
- **`src/server.ts`** - Server initialization and graceful shutdown handling

### Configuration
- **`src/config/environment.ts`** - Environment variable validation using Zod
- **`src/config/index.ts`** - Configuration exports

### Middleware
- **`src/middleware/requestLogger.ts`** - Request/response logging with Pino
- **`src/middleware/errorHandler.ts`** - Global error handling and 404 routes
- **`src/middleware/security.ts`** - Security headers (Helmet) and CORS
- **`src/middleware/requestContext.ts`** - Request ID and context tracking
- **`src/middleware/index.ts`** - Middleware exports

### Utilities
- **`src/utils/logger.ts`** - Pino logger configuration and helpers
- **`src/utils/error.ts`** - Error classes and error handling utilities
- **`src/utils/response.ts`** - Standard response formatting utilities
- **`src/utils/index.ts`** - Utilities exports

---

## Architecture

### Middleware Stack (Request Flow)

```
Express App
    ↓
Trust Proxy
    ↓
Body Parser (JSON, URL-encoded)
    ↓
Helmet (Security Headers)
    ↓
CORS (Cross-Origin)
    ↓
Request ID (X-Request-ID header)
    ↓
Request Context (userId, userRole tracking)
    ↓
Request Logger (Pino HTTP logging)
    ↓
Routes
  ├── GET /health (healthcheck)
  ├── GET /ready (readiness)
  ├── GET /api/info (module status)
  └── Other routes (Step 3+)
    ↓
404 Handler (Not Found)
    ↓
Error Handler (Global error catch-all)
```

### Error Handling Flow

```
Error Thrown
    ↓
Error Handler Middleware
    ├─ AppError → Extract code, status, message
    ├─ ValidationError → 422 status
    ├─ JWT Errors → 401 status
    └─ Other Errors → 500 status
    ↓
Log Error
    ↓
Send JSON Response
```

---

## Configuration Management

### Environment Validation

All environment variables are validated at startup using Zod schemas:

```typescript
// src/config/environment.ts
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  // ... more fields
});

export const environment = loadEnvironment();
```

**Benefits:**
- Fails fast if required variables are missing
- Type-safe environment access
- Clear error messages during startup
- Centralized configuration

### Required Environment Variables (Minimum)

```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=your-key
FIREBASE_CLIENT_EMAIL=your-email
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=your-bucket
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
EMAIL_FROM=noreply@example.com
EMAIL_FROM_NAME=App
ADMIN_EMAIL=admin@example.com
SESSION_SECRET=your-session-secret
```

---

## Logging

### Pino Logger

Structured logging using Pino with JSON output:

```typescript
import { logger } from '@utils/logger';

logger.info({ userId: 123 }, 'User logged in');
logger.error({ error }, 'Failed to process request');
logger.warn({ status: 'degraded' }, 'Database slow');
logger.debug({ query }, 'SQL query executed');
```

### Log Levels

- **debug** - Detailed information, typically for developers
- **info** - General informational messages
- **warn** - Warning messages for potentially harmful situations
- **error** - Error messages for error events

**Set via:**
```bash
LOG_LEVEL=debug npm run dev
```

### Request Logging

All HTTP requests are automatically logged with Pino HTTP:

```json
{
  "level": 20,
  "time": "2024-01-15T10:30:45.123Z",
  "pid": 1234,
  "hostname": "localhost",
  "req": {
    "method": "GET",
    "url": "/health",
    "headers": { ... },
    "remoteAddress": "127.0.0.1",
    "remotePort": 54321
  },
  "res": {
    "statusCode": 200,
    "headers": { ... }
  },
  "responseTime": 1.5,
  "msg": "GET /health 200"
}
```

**Sensitive data is redacted:**
- Authorization headers
- API keys
- Passwords
- Tokens

---

## Error Handling

### Error Classes

```typescript
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '@utils/error';

// Usage
throw new BadRequestError('Invalid input', { field: 'email' });
throw new UnauthorizedError('Invalid credentials');
throw new NotFoundError('User');
throw new ValidationError('Invalid schema', { errors: [...] });
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { "field": "email" }
  },
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### HTTP Status Codes

| Code | Class | Usage |
|------|-------|-------|
| 200 | OK | Successful GET/POST |
| 201 | Created | Successful POST creating resource |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request syntax |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server error |

---

## Response Formatting

### Success Responses

```typescript
import { sendOk, sendCreated, sendPaginated } from '@utils/response';

// Send OK response (200)
sendOk(res, { id: 1, name: 'John' });

// Send Created response (201)
sendCreated(res, { id: 1, name: 'John' });

// Send Paginated response
sendPaginated(res, 200, users, 100, 20, 0);

// Send No Content (204)
sendNoContent(res);
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Paginated Response Format

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

---

## Security

### Helmet Headers

Automatic security headers via Helmet:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: ...
```

### CORS Configuration

Development:
```
Allow Origins: localhost:3000, localhost:3001, 127.0.0.1:3001
Allow Methods: GET, HEAD, PUT, PATCH, POST, DELETE
Allow Headers: Content-Type, Authorization, X-API-Key, X-Request-ID
```

Production:
```
Allow Origins: Configured via SOCKET_CORS_ORIGIN env var
```

### Request ID

Every request gets a unique ID for tracing:

```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

Used in logs for tracking requests across services.

---

## Health & Readiness Endpoints

### Health Check (`GET /health`)

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "uptime": 3600,
  "environment": "development",
  "version": "0.1.0"
}
```

**Purpose:** Docker health checks, load balancer checks
**Response:** 200 OK

### Readiness Check (`GET /ready`)

```json
{
  "ready": true,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**Purpose:** Kubernetes readiness probes, service discovery
**Note:** Will check database and cache connectivity in Step 3+
**Response:** 200 OK

### Module Status (`GET /api/info`)

```json
{
  "message": "Featherlight Backend API",
  "version": "0.1.0",
  "environment": "development",
  "modules": {
    "auth": "pending",
    "users": "pending",
    "companions": "pending",
    ...
  }
}
```

**Purpose:** API overview and module status
**Response:** 200 OK

---

## Graceful Shutdown

Server handles graceful shutdown on signals:

```
Receive SIGTERM/SIGINT
    ↓
Stop accepting new connections
    ↓
Wait for in-flight requests (max 30s)
    ↓
Close database connections
    ↓
Close Redis connections
    ↓
Close Socket.io connections
    ↓
Exit with code 0
```

**Timeout:** 30 seconds before forced shutdown

---

## Request Context Tracking

### Context Object

Every request has a context object:

```typescript
req.context = {
  requestId: string,    // Unique request ID
  userId?: string,      // Authenticated user ID
  userRole?: string,    // User role (admin, user, etc)
  userEmail?: string,   // User email
  timestamp: number,    // Request start time (ms)
}
```

### Usage in Services

```typescript
import { getUserContext } from '@middleware/requestContext';

export class UserService {
  async getProfile(req: Request): Promise<User> {
    const { userId } = getUserContext(req);
    // Use userId for database queries
  }
}
```

---

## Testing the Bootstrap

### 1. Start the application

```bash
npm run dev
```

### 2. Test health endpoint

```bash
curl http://localhost:3000/health
```

### 3. Test readiness endpoint

```bash
curl http://localhost:3000/ready
```

### 4. Test API info endpoint

```bash
curl http://localhost:3000/api/info
```

### 5. Test 404 handler

```bash
curl http://localhost:3000/nonexistent
```

### 6. Check logs

All requests are logged with timestamps and status codes.

---

## Path Aliases

Clean imports using path aliases:

```typescript
// Instead of:
import { logger } from '../../../utils/logger';

// Use:
import { logger } from '@utils/logger';
import { environment } from '@config/environment';
import { sendOk } from '@utils/response';
import { AppError } from '@utils/error';
```

**Available aliases:**
- `@/*` → `src/*`
- `@config/*` → `src/config/*`
- `@middleware/*` → `src/middleware/*`
- `@utils/*` → `src/utils/*`
- `@modules/*` → `src/modules/*` (Step 3+)
- `@services/*` → `src/services/*` (Step 3+)
- `@engines/*` → `src/engines/*` (Step 3+)
- `@types/*` → `src/types/*` (Step 3+)

---

## Next Steps (Step 3+)

When implementing modules, each feature will:

1. **Define types** in `src/modules/[feature]/types.ts`
2. **Define validation** in `src/modules/[feature]/validation.ts`
3. **Create controller** in `src/modules/[feature]/controller.ts`
4. **Create service** in `src/modules/[feature]/service.ts`
5. **Create repository** in `src/modules/[feature]/repository.ts`
6. **Define routes** in `src/modules/[feature]/routes.ts`
7. **Mount routes** in `src/app.ts`

Example:
```typescript
// In src/app.ts
import authRoutes from '@modules/auth/routes';

app.use('/api/auth', authRoutes);
```

---

## Summary

✅ **Express app configured** with middleware stack
✅ **Environment validation** using Zod
✅ **Logging** with Pino HTTP
✅ **Error handling** with AppError classes
✅ **Response formatting** utilities
✅ **Security headers** (Helmet, CORS)
✅ **Request ID tracking** for tracing
✅ **Graceful shutdown** handling
✅ **Health & readiness** endpoints
✅ **Type-safe configuration** management

**Ready for Step 3: Feature Module Implementation**
