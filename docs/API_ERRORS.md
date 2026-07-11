# Featherlight API - Error Handling Reference

## Response Structure

All API responses follow a consistent format with HTTP status codes and error details.

### Success Response (2xx)

```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2024-07-11T10:30:00Z",
  "requestId": "req-1234567890"
}
```

### Error Response (4xx, 5xx)

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional error details */ }
  },
  "timestamp": "2024-07-11T10:30:00Z",
  "requestId": "req-1234567890"
}
```

---

## HTTP Status Codes

| Code | Meaning | Recovery | Example |
|---|---|---|---|
| **200** | OK | Retry if needed | GET /users/me |
| **201** | Created | Success | POST /memory |
| **204** | No Content | Success | DELETE /moments/123 |
| **400** | Bad Request | Fix request, retry | Invalid JSON, missing fields |
| **401** | Unauthorized | Re-authenticate | Expired token |
| **403** | Forbidden | Request different action | Insufficient permissions |
| **404** | Not Found | Check resource ID | Resource deleted or wrong ID |
| **409** | Conflict | Retry with different data | Duplicate creation |
| **429** | Too Many Requests | Wait and retry | Rate limit exceeded |
| **500** | Server Error | Retry with backoff | Database connection error |
| **502** | Bad Gateway | Retry with backoff | Service temporarily down |
| **503** | Unavailable | Retry with backoff | Maintenance or overload |

---

## Error Codes

### Authentication Errors

#### `AUTHENTICATION_ERROR` (401)

User authentication failed. Token is invalid, expired, or missing.

**Causes:**
- Missing `Authorization` header
- Invalid token format
- Expired token
- Invalid Firebase token

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Authentication failed. Invalid or expired token.",
    "details": {
      "reason": "Token expired"
    }
  }
}
```

**Solution:**
1. Get new Firebase ID token
2. Exchange for new server session via `/auth/session`
3. Use new token in `Authorization` header

---

#### `INVALID_TOKEN_FORMAT` (401)

Token format is invalid (not a valid JWT).

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN_FORMAT",
    "message": "Invalid token format. Expected Bearer token.",
    "details": {
      "expected": "Bearer eyJ...",
      "got": "Basic eyJ..."
    }
  }
}
```

---

### Authorization Errors

#### `AUTHORIZATION_ERROR` (403)

User is authenticated but lacks permissions for this action.

**Causes:**
- User doesn't own the resource
- Required role missing (e.g., admin)
- Resource access denied

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "You don't have permission to access this resource.",
    "details": {
      "resource": "companion_123",
      "requiredRole": "owner"
    }
  }
}
```

**Solution:**
- Verify you own the resource (check userId)
- Request admin access if needed
- Use correct resource ID

---

#### `INSUFFICIENT_PERMISSIONS` (403)

Required permissions are missing.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "This action requires admin permissions.",
    "details": {
      "action": "delete_user",
      "requiredRole": "admin"
    }
  }
}
```

---

### Validation Errors

#### `VALIDATION_ERROR` (400)

Request data failed validation. Missing required fields, invalid types, or constraints violated.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Must be a valid email address",
          "value": "not-an-email"
        },
        {
          "field": "bio",
          "message": "Must not exceed 500 characters",
          "value": "Lorem ipsum... (650 chars)"
        }
      ]
    }
  }
}
```

**Common Validation Issues:**

| Field | Error | Solution |
|---|---|---|
| `email` | "Must be valid email" | Provide valid email format (user@example.com) |
| `password` | "Must be 8+ characters" | Use stronger password |
| `page` | "Must be >= 1" | Start pagination from page 1 |
| `limit` | "Must be <= 100" | Request max 100 items per page |
| `importance` | "Must be 0-10" | Use number between 0 and 10 |
| `companionId` | "Must be valid UUID" | Ensure ID is valid UUID format |

---

#### `MISSING_REQUIRED_FIELD` (400)

Required field is missing from request.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_FIELD",
    "message": "Missing required field: message",
    "details": {
      "field": "message",
      "type": "string"
    }
  }
}
```

---

#### `INVALID_REQUEST_FORMAT` (400)

Request body is not valid JSON or has structural issues.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST_FORMAT",
    "message": "Invalid JSON in request body",
    "details": {
      "position": 45,
      "near": "\"name\": invalid_value"
    }
  }
}
```

---

### Resource Errors

#### `NOT_FOUND` (404)

Requested resource doesn't exist.

**Causes:**
- Wrong resource ID
- Resource was deleted
- Typo in URL

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Memory not found",
    "details": {
      "resource": "memory",
      "id": "mem_invalid-uuid",
      "userId": "user_123"
    }
  }
}
```

**Solution:**
1. Verify resource ID is correct
2. Check resource wasn't deleted
3. Ensure you own the resource

---

#### `RESOURCE_DELETED` (404)

Requested resource was deleted.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_DELETED",
    "message": "This memory was deleted",
    "details": {
      "deletedAt": "2024-07-10T15:00:00Z",
      "deletedBy": "user_123"
    }
  }
}
```

---

### Conflict Errors

#### `CONFLICT` (409)

Request conflicts with existing state.

**Causes:**
- Trying to create duplicate resource
- Concurrent modification conflict
- State mismatch

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "This resource already exists",
    "details": {
      "resource": "companion",
      "name": "Luna",
      "existingId": "comp_123"
    }
  }
}
```

---

#### `DUPLICATE_RESOURCE` (409)

Resource with same unique identifier already exists.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_RESOURCE",
    "message": "A companion with this name already exists",
    "details": {
      "field": "name",
      "value": "Luna",
      "existingId": "comp_550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

---

#### `CONCURRENT_MODIFICATION` (409)

Resource was modified by another request.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "CONCURRENT_MODIFICATION",
    "message": "Resource was modified by another request",
    "details": {
      "yourVersion": "v1",
      "currentVersion": "v2"
    }
  }
}
```

**Solution:**
1. Fetch latest version of resource
2. Reapply your changes
3. Retry request

---

### Rate Limiting

#### `RATE_LIMIT_EXCEEDED` (429)

Too many requests sent in short time.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 50,
      "window": "1 minute",
      "retryAfter": 45
    }
  }
}
```

**Response Headers:**
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1626070305
```

**Solution:**
1. Wait `retryAfter` seconds before retrying
2. Implement exponential backoff
3. Cache responses when possible
4. Batch requests where possible

---

#### `QUOTA_EXCEEDED` (429)

Daily/monthly quota limit reached.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Monthly API quota exceeded",
    "details": {
      "quota": 100000,
      "used": 100000,
      "resetAt": "2024-08-11T00:00:00Z"
    }
  }
}
```

---

### Business Logic Errors

#### `INVALID_STATE` (400)

Resource is in invalid state for this operation.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATE",
    "message": "Cannot delete companion with active conversations",
    "details": {
      "currentState": "has_active_sessions",
      "activeSessionCount": 3
    }
  }
}
```

---

#### `OPERATION_NOT_ALLOWED` (400)

Operation is not permitted at this time.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "OPERATION_NOT_ALLOWED",
    "message": "Cannot create memories for archived companions",
    "details": {
      "reason": "companion_archived",
      "companionStatus": "archived"
    }
  }
}
```

---

#### `INSUFFICIENT_RESOURCES` (429)

Insufficient resources to complete request (e.g., storage quota).

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_RESOURCES",
    "message": "Storage quota exceeded",
    "details": {
      "quota": "10GB",
      "used": "10GB",
      "needed": "2GB"
    }
  }
}
```

---

### Server Errors

#### `INTERNAL_ERROR` (500)

Unexpected server error occurred.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "details": {
      "errorId": "err_550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**What to do:**
1. Note the `errorId` from response
2. Check [status page](https://status.featherlight.ai)
3. Retry request (safe for idempotent operations)
4. Contact support with `errorId` if persistent

---

#### `SERVICE_UNAVAILABLE` (503)

Service is temporarily unavailable (maintenance, overload).

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service temporarily unavailable",
    "details": {
      "retryAfter": 300,
      "estimatedRecovery": "2024-07-11T10:45:00Z"
    }
  }
}
```

**Solution:**
- Retry after `retryAfter` seconds
- Implement exponential backoff
- Check status page for updates

---

#### `DATABASE_ERROR` (500)

Database operation failed.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Database connection failed",
    "details": {
      "errorId": "db_550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

---

## Retry Strategy

### Idempotent vs Non-Idempotent

**Idempotent** (safe to retry):
- GET, HEAD, PUT (with same data)
- Reading operations
- Status code: 2xx, 3xx, 4xx (except 409)

**Non-Idempotent** (may create duplicates):
- POST (creates new resource)
- PATCH
- DELETE
- Status code: 409 Conflict

### Recommended Backoff

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Don't retry 409 Conflict
      if (error.status === 409) {
        throw error;
      }
      
      // Wait before retry
      const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
}
```

---

## Debugging

### Using requestId

Every response includes a unique `requestId` for debugging:

```javascript
const response = await fetch('/api/v1/memory');
const data = await response.json();
console.log(`Request ID: ${data.requestId}`);
// Save this for support tickets
```

### Enable Verbose Logging

Include debug headers:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  -H "X-Debug: true" \
  https://api.featherlight.ai/api/v1/memory

# Receives extra logging in response
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|---|---|---|
| "Invalid token" | Token expired | Get new Firebase token and create new session |
| "Not found" | Wrong resource ID | Verify ID exists, check ownership |
| "Validation error" | Invalid data | Check field types and constraints |
| "Rate limit" | Too many requests | Implement backoff, cache responses |
| "500 error" | Server issue | Retry with backoff, check status page |

---

## Support

**Still stuck?**

1. Check full [API documentation](./API.md)
2. Review [error handling examples](../examples/error-handling.js)
3. Search [FAQ](./FAQ.md)
4. Post to [Discord community](https://discord.gg/featherlight)
5. Email support@featherlight.ai with `requestId`
