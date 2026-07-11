# Featherlight API Documentation Index

**Complete API Documentation Suite - 2,373 Lines**

---

## Documentation Files

### 1. **API.md** (Primary Reference)
**Comprehensive REST API Reference** - 1,200+ lines

Complete technical documentation covering:

- **API Overview**: Architecture, features, and key concepts
- **Authentication**: Firebase token exchange, session management, bearer tokens
- **Response Format**: Success/error/paginated response structures
- **Rate Limiting**: Tier-based limits (auth, chat, general, admin)
- **Error Handling**: HTTP status codes and error responses
- **Pagination**: Query parameters and response format
- **All Endpoints** (8 modules, 35+ endpoints):
  - Authentication (3 endpoints)
  - Users (4 endpoints)
  - Companions (5 endpoints)
  - Conversations (6 endpoints)
  - Memories (6 endpoints)
  - Relationships (4 endpoints)
  - Notifications (4 endpoints)
  - Moments (5 endpoints)

**For each endpoint:**
- ✅ Method and URL path
- ✅ Authentication requirements
- ✅ Request body/parameters with validation
- ✅ Response examples (201, 200)
- ✅ Rate limit information
- ✅ Error scenarios

**Plus:**
- Webhook events (9 event types)
- Best practices for error handling, rate limiting, pagination
- SDK/client libraries (JavaScript/TypeScript, Python)
- Support resources

---

### 2. **API_QUICKSTART.md** (Getting Started)
**5-Minute Quick Start Guide** - 200+ lines

Step-by-step examples for:

1. **Authentication**: Firebase token → server session
2. **User Profile**: Get and update current user
3. **Companions**: Create and manage companions
4. **Conversations**: Start sessions and send messages
5. **Streaming**: Real-time responses with SSE
6. **Memories**: Create, list, and search memories
7. **Relationships**: Track relationship status
8. **Notifications**: List and manage notifications

**Includes:**
- Copy-paste curl examples for each step
- JavaScript/Python SDK examples
- Common parameters reference
- Error handling basics
- REST client setup (Insomnia/Postman)

---

### 3. **API_ERRORS.md** (Error Reference)
**Complete Error Handling Guide** - 900+ lines

Comprehensive error documentation:

**HTTP Status Codes**: 13 codes (200, 201, 204, 400, 401, 403, 404, 409, 429, 500, 502, 503)

**Error Codes** (23+ types):
- Authentication: AUTHENTICATION_ERROR, INVALID_TOKEN_FORMAT
- Authorization: AUTHORIZATION_ERROR, INSUFFICIENT_PERMISSIONS
- Validation: VALIDATION_ERROR, MISSING_REQUIRED_FIELD, INVALID_REQUEST_FORMAT
- Resources: NOT_FOUND, RESOURCE_DELETED
- Conflicts: CONFLICT, DUPLICATE_RESOURCE, CONCURRENT_MODIFICATION
- Rate Limiting: RATE_LIMIT_EXCEEDED, QUOTA_EXCEEDED
- Business Logic: INVALID_STATE, OPERATION_NOT_ALLOWED, INSUFFICIENT_RESOURCES
- Server: INTERNAL_ERROR, SERVICE_UNAVAILABLE, DATABASE_ERROR

**For each error:**
- ✅ HTTP status code
- ✅ Description and causes
- ✅ JSON response examples
- ✅ Solutions and recovery strategies
- ✅ Related error codes

**Plus:**
- Retry strategies for idempotent operations
- Exponential backoff code examples
- Request ID usage for debugging
- Common issues troubleshooting table

---

## API Structure

### Base URLs
- **Production**: `https://api.featherlight.ai/api/v1`
- **Development**: `http://localhost:3000/api/v1`

### Authentication
- **Type**: Bearer Token (Firebase ID token → server session)
- **Header**: `Authorization: Bearer <session-token>`

### Response Format
```json
{
  "success": boolean,
  "data": { /* response */ },
  "error": { "code": "...", "message": "..." },
  "pagination": { /* for list endpoints */ },
  "timestamp": "ISO-8601",
  "requestId": "unique-id"
}
```

---

## API Modules (35+ Endpoints)

### Authentication (3)
- `POST /auth/session` - Create server session
- `POST /auth/logout` - End session
- `GET /auth/me` - Get current user info

### Users (4)
- `GET /users/me` - Get profile
- `PATCH /users/me` - Update profile
- `GET /users/:userId` - Get public profile
- `DELETE /users/me` - Delete account

### Companions (5)
- `POST /companions` - Create companion
- `GET /companions` - List companions
- `GET /companions/:companionId` - Get details
- `PATCH /companions/:companionId` - Update
- `DELETE /companions/:companionId` - Delete

### Conversations (6)
- `POST /conversation/session` - Start conversation
- `GET /conversation/:sessionId` - Get session
- `GET /conversation/:sessionId/stream` - Stream (SSE)
- `POST /conversation/:sessionId/message` - Send message
- `GET /conversation` - List conversations
- `DELETE /conversation/:sessionId` - End conversation

### Memories (6)
- `GET /memory` - List memories (paginated)
- `POST /memory` - Create memory
- `GET /memory/:memoryId` - Get memory
- `PUT /memory/:memoryId` - Update memory
- `DELETE /memory/:memoryId` - Delete memory
- `GET /memory/search` - Search memories

### Relationships (4)
- `GET /relationships` - List relationships
- `GET /relationships/:companionId` - Get relationship
- `PATCH /relationships/:companionId` - Update
- `DELETE /relationships/:companionId` - Delete

### Notifications (4)
- `GET /notifications` - List notifications
- `POST /notifications/:notificationId/read` - Mark as read
- `DELETE /notifications/:notificationId` - Delete
- `POST /notifications/mark-all-read` - Mark all read

### Moments (5)
- `GET /moments` - List moments
- `POST /moments` - Create moment
- `GET /moments/:momentId` - Get moment
- `PATCH /moments/:momentId` - Update moment
- `DELETE /moments/:momentId` - Delete moment

---

## Key Features Documented

### ✅ Rate Limiting
- Authentication: 5 req/min, 20 req/hour
- Chat: 50 req/min, 1,000 req/hour
- General API: 100 req/min, 3,000 req/hour

### ✅ Pagination
- `page` parameter (default: 1)
- `limit` parameter (default: 20, max: 100)
- Response includes: `page`, `limit`, `total`, `pages`, `hasNextPage`, `hasPrevPage`

### ✅ Streaming
- Server-Sent Events (SSE) for real-time responses
- Usage in JavaScript with EventSource API
- Delta-based chunking for progressive content

### ✅ Error Handling
- 23+ specific error codes
- Detailed error messages and details
- Recovery strategies for each error class
- Request ID tracking for debugging

### ✅ Authentication
- Firebase ID token exchange
- Session-based authentication
- Bearer token in Authorization header
- Automatic logout and session invalidation

---

## How to Use This Documentation

### For API Consumers
1. **Getting Started**: Start with [API_QUICKSTART.md](./API_QUICKSTART.md)
2. **Detailed Reference**: Use [API.md](./API.md) for endpoint details
3. **Error Handling**: Check [API_ERRORS.md](./API_ERRORS.md) for error codes
4. **Code Examples**: Look for curl and SDK examples in each file

### For Integration Testing
1. Use curl examples from QUICKSTART
2. Import OpenAPI spec into Postman/Insomnia
3. Test each endpoint with sample data
4. Verify error responses with API_ERRORS reference

### For Production Deployment
1. Read "Best Practices" section in API.md
2. Implement rate limiting retry logic
3. Set up request ID logging
4. Configure webhook endpoints
5. Monitor rate limits and quota usage

### For Debugging
1. Note the `requestId` from responses
2. Reference [API_ERRORS.md](./API_ERRORS.md) error codes
3. Check rate limit headers (`X-RateLimit-*`)
4. Review webhook event format

---

## Documentation Statistics

| Metric | Value |
|---|---|
| Total Lines | 2,373 |
| Endpoints Documented | 35+ |
| Error Codes | 23+ |
| Code Examples | 100+ |
| Request/Response Pairs | 50+ |
| HTTP Status Codes | 13 |
| Modules | 8 |
| Event Types | 9 |

---

## Related Documentation

- **[Cost Optimization Plan](../COST_OPTIMIZATION_PLAN.md)** - LLM cost reduction strategies
- **[Quick Start Guide](./COST_OPTIMIZATION_QUICKSTART.md)** - Getting started with cost optimization
- **[Technical Details](./TIER_IMPLEMENTATION_DETAILS.md)** - Cost optimization architecture
- **[Full Implementation Guide](./LLM_COST_OPTIMIZATION.md)** - Detailed tier documentation

---

## OpenAPI Specification

The API follows OpenAPI 3.0.0 specification:

```yaml
openapi: 3.0.0
info:
  title: Featherlight AI Companion API
  version: 1.0.0
servers:
  - url: https://api.featherlight.ai/api/v1
    description: Production
  - url: http://localhost:3000/api/v1
    description: Development
```

Available at: `/api/v1/docs/openapi.json`

---

## Support & Contact

- **Documentation**: https://docs.featherlight.ai
- **API Status**: https://status.featherlight.ai
- **Discord Community**: https://discord.gg/featherlight
- **Email Support**: support@featherlight.ai
- **Bug Reports**: https://github.com/shubhamagar123/featherlite/issues

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2024-07-11 | Initial comprehensive API documentation |
| | | - 35+ endpoints fully documented |
| | | - 23+ error codes with recovery strategies |
| | | - Quick start guide with examples |
| | | - OpenAPI 3.0.0 specification support |

---

**Last Updated**: July 11, 2024  
**Documentation Version**: 1.0.0  
**Branch**: `claude/festive-galileo-yxnirr`

✅ **Status**: Ready for Production
