# Step 3: Express Application Bootstrap - COMPLETE ✅

## Overview

Complete Express.js application bootstrap with production-grade configuration, middleware, error handling, and logging. Ready to start developing feature modules.

## Files Created (13 files)

### Application Entry & Server (3 files)
- ✅ `src/index.ts` - Application entry point that bootstraps the server
- ✅ `src/app.ts` - Express app configuration with middleware stack
- ✅ `src/server.ts` - Server initialization and graceful shutdown

### Configuration (2 files)
- ✅ `src/config/environment.ts` - Environment variables validated with Zod
- ✅ `src/config/index.ts` - Configuration module exports

### Middleware (5 files)
- ✅ `src/middleware/requestLogger.ts` - Pino HTTP request/response logging
- ✅ `src/middleware/errorHandler.ts` - Global error handler & 404 routes
- ✅ `src/middleware/security.ts` - Helmet headers & CORS configuration
- ✅ `src/middleware/requestContext.ts` - Request ID & context tracking
- ✅ `src/middleware/index.ts` - Middleware module exports

### Utilities (4 files)
- ✅ `src/utils/logger.ts` - Pino logger configuration and helpers
- ✅ `src/utils/error.ts` - AppError classes and error handling
- ✅ `src/utils/response.ts` - Standard response formatting utilities
- ✅ `src/utils/index.ts` - Utils module exports

### Documentation (1 file)
- ✅ `docs/BOOTSTRAP.md` - Complete bootstrap documentation

---

## Application Structure

### Middleware Stack (Request Order)

```
1. Trust Proxy (reverse proxy headers)
2. Body Parser (JSON, URL-encoded)
3. Helmet (Security headers)
4. CORS (Cross-origin requests)
5. Request ID (X-Request-ID tracking)
6. Request Context (User context tracking)
7. Request Logger (Pino HTTP logging)
8. Routes
9. 404 Handler
10. Error Handler (catch-all)
```

### Available Endpoints

```
GET  /health      - Health check (Docker)
GET  /ready       - Readiness probe (Kubernetes)
GET  /api/info    - API information & module status
ALL  *            - 404 Not Found handler
```

---

## Configuration Management

### Environment Validation

All environment variables are validated at startup:

```bash
# Validates 51 environment variables
# Fails fast if required variables missing
# Type-safe access throughout application
```

### Environment Variables (51 total)

**Core:**
- NODE_ENV, PORT, LOG_LEVEL

**Database & Cache:**
- DATABASE_URL, REDIS_URL, REDIS_HOST, REDIS_PORT, etc.

**Authentication:**
- FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL

**Storage:**
- AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME

**API Keys:**
- JWT_SECRET, JWT_REFRESH_SECRET, OPENAI_API_KEY, CLAUDE_API_KEY

**Feature Flags:**
- FEATURE_VOICE_ENABLED, FEATURE_VIDEO_ENABLED, FEATURE_ANALYTICS_ENABLED

**Configuration:**
- Rate limits, pagination, file uploads, cache TTLs, session settings

**Validation:** Zod schema ensures type safety and clear error messages

---

## Logging

### Pino Logger Configuration

- **Format:** JSON (production), pretty-printed (development)
- **Levels:** debug, info, warn, error
- **Structured:** Context and metadata included
- **Performance:** Optimized for high-throughput
- **Redaction:** Sensitive data automatically masked

### Request Logging

Every HTTP request logged with:
- Method, URL, status code
- Response time (ms)
- Request/response headers (redacted)
- Remote IP address
- Custom log level per status code

### Usage

```typescript
import { logger } from '@utils/logger';

logger.info({ userId: 123 }, 'User action');
logger.error({ error }, 'Error occurred');
logger.warn({ status: 'slow' }, 'Performance issue');
logger.debug({ query }, 'SQL executed');
```

---

## Error Handling

### Error Classes (8 built-in)

```typescript
AppError               - Base error class
BadRequestError       - 400 Bad Request
UnauthorizedError     - 401 Unauthorized
ForbiddenError        - 403 Forbidden
NotFoundError         - 404 Not Found
ConflictError         - 409 Conflict
ValidationError       - 422 Unprocessable Entity
InternalServerError   - 500 Internal Server Error
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

### Error Handling Flow

1. **Error thrown** in controller/service
2. **Error handler middleware** catches it
3. **Error logged** with context
4. **Response sent** with appropriate status code

---

## Response Formatting

### Response Utilities

```typescript
sendOk()           - 200 OK response
sendCreated()      - 201 Created response
sendNoContent()    - 204 No Content response
sendPaginated()    - Paginated response
sendError()        - Error response
sendSuccess()      - Generic success response
```

### Response Format (Success)

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Response Format (Paginated)

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

### Helmet Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

### CORS Configuration

**Development:**
- Origins: localhost:3000, localhost:3001, 127.0.0.1:3001
- Methods: GET, HEAD, PUT, PATCH, POST, DELETE
- Credentials: Allowed

**Production:**
- Origins: Configurable via SOCKET_CORS_ORIGIN env var

### Request ID Tracking

Every request assigned unique UUID:
```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

Used in logs for request tracing across services.

---

## Request Context

### Per-Request Context Object

```typescript
req.context = {
  requestId: string,    // Unique ID
  userId?: string,      // Authenticated user
  userRole?: string,    // User role
  userEmail?: string,   // User email
  timestamp: number,    // Start time
}
```

### Context Usage in Services

```typescript
import { getUserContext } from '@middleware/requestContext';

export class UserService {
  async getProfile(req: Request) {
    const { userId } = getUserContext(req);
    // Use userId in business logic
  }
}
```

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

**Purpose:** Container health checks, load balancer probes

### Readiness Check (`GET /ready`)

```json
{
  "ready": true,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**Purpose:** Kubernetes readiness probes
**Note:** Will verify database/cache connectivity in Step 3+

### API Info (`GET /api/info`)

```json
{
  "message": "Featherlight Backend API",
  "version": "0.1.0",
  "environment": "development",
  "modules": {
    "auth": "pending",
    "users": "pending",
    ...
  }
}
```

**Purpose:** API overview and module status

---

## Graceful Shutdown

### Shutdown Flow

```
Signal (SIGTERM/SIGINT)
    ↓
Stop accepting new connections
    ↓
Wait for in-flight requests (max 30s)
    ↓
Close database connections (Step 3+)
    ↓
Close Redis connections (Step 3+)
    ↓
Exit with code 0
```

### Signal Handling

- **SIGTERM** - Kubernetes/Docker graceful shutdown
- **SIGINT** - Local development Ctrl+C
- **Uncaught Exceptions** - Log and exit
- **Unhandled Rejections** - Log and exit

---

## Development

### Start Development Server

```bash
npm run dev
```

- Hot reload with nodemon
- TypeScript compilation with ts-node
- Watches `src/**/*.ts` files
- Clears screen on restart

### Code Quality

```bash
npm run typecheck    # TypeScript validation
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run format:check # Prettier validation
```

### Testing Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Readiness
curl http://localhost:3000/ready

# API info
curl http://localhost:3000/api/info

# 404 not found
curl http://localhost:3000/nonexistent

# Check logs
npm run dev
```

---

## Type Safety

### Path Aliases

```typescript
// Clean imports using aliases
import { logger } from '@utils/logger';
import { environment } from '@config/environment';
import { AppError } from '@utils/error';
import { sendOk } from '@utils/response';
```

### TypeScript Strict Mode

All configurations enforce:
- `strict: true` - All strict options enabled
- `noUnusedLocals: true` - No unused variables
- `noUnusedParameters: true` - No unused parameters
- `noImplicitReturns: true` - All paths return value

---

## Production Readiness

✅ **Security**
- Helmet security headers
- CORS properly configured
- Sensitive data redaction
- Request ID tracking

✅ **Logging**
- Structured JSON logging
- Performance metrics
- Error tracking
- Request tracing

✅ **Error Handling**
- Global error handler
- Consistent error responses
- Proper HTTP status codes
- Error logging with context

✅ **Health Checks**
- Health endpoint for containers
- Readiness probe for orchestration
- Response time tracking
- Graceful shutdown

✅ **Configuration**
- Environment validation
- Type-safe access
- Fail-fast on startup
- Clear error messages

✅ **Type Safety**
- Full TypeScript strict mode
- Path aliases for clean imports
- Type-safe error handling
- Response formatting types

---

## What's NOT Included

❌ **No feature modules** (auth, users, companions, etc.)
❌ **No database connections** (PostgreSQL, Prisma)
❌ **No cache initialization** (Redis)
❌ **No authentication logic** (Firebase integration)
❌ **No service layer** (business logic)
❌ **No routes** (except health, ready, info)

These will be implemented in Step 4+.

---

## What's Ready for Module Development

✅ **Error handling infrastructure** - Use AppError classes
✅ **Logging** - Use logger for all events
✅ **Response formatting** - Use sendOk, sendCreated, etc.
✅ **Request context** - Access userId, userRole, etc.
✅ **Environment config** - Access environment variables
✅ **Middleware patterns** - Add new middleware to stack
✅ **Route structure** - Mount module routes in app.ts
✅ **Type safety** - Full TypeScript support

---

## Summary

**Express Application Bootstrap Complete:**

| Component | Status | Count |
|-----------|--------|-------|
| Configuration Files | ✅ | 2 |
| Middleware | ✅ | 5 |
| Utilities | ✅ | 4 |
| Entry Points | ✅ | 3 |
| **Total** | ✅ | **14** |

**Production Features:**

| Feature | Status |
|---------|--------|
| Environment Validation | ✅ |
| Structured Logging | ✅ |
| Error Handling | ✅ |
| Response Formatting | ✅ |
| Security Headers | ✅ |
| CORS | ✅ |
| Request ID Tracking | ✅ |
| Graceful Shutdown | ✅ |
| Health Endpoints | ✅ |
| Type Safety | ✅ |

---

## Next Steps

### Test the Bootstrap

```bash
npm run dev
# Visit http://localhost:3000/health
# Visit http://localhost:3000/api/info
```

### Step 4+: Implement Feature Modules

1. **Authentication Module** (`src/modules/auth/`)
2. **Users Module** (`src/modules/users/`)
3. **Companions Module** (`src/modules/companions/`)
4. **Other modules** (conversations, memory, relationships, etc.)

Each module will use the infrastructure created in this bootstrap.

---

**Status: ✅ Step 3 Complete - Express Bootstrap Ready**
