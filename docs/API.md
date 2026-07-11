# Featherlight AI Companion Platform - API Reference

**Version**: 1.0.0  
**Base URL**: `https://api.featherlight.ai/api/v1`  
**Development**: `http://localhost:3000/api/v1`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Rate Limiting](#rate-limiting)
5. [Error Handling](#error-handling)
6. [Pagination](#pagination)
7. [Authentication Endpoints](#authentication-endpoints)
8. [User Endpoints](#user-endpoints)
9. [Companion Endpoints](#companion-endpoints)
10. [Conversation Endpoints](#conversation-endpoints)
11. [Memory Endpoints](#memory-endpoints)
12. [Relationship Endpoints](#relationship-endpoints)
13. [Notification Endpoints](#notification-endpoints)
14. [Moment Endpoints](#moment-endpoints)

---

## Overview

Featherlight is a production-grade REST API for AI companion interactions, memory management, and user relationships. The platform provides endpoints for:

- **User Management**: Profile management and authentication
- **Companion Interactions**: Conversation sessions with AI companions
- **Memory Management**: Store, retrieve, and search user memories
- **Relationships**: Track and manage companion relationships
- **Notifications**: Send and receive notifications
- **Moments**: Create and manage special moments/milestones

### Key Features

- **Stateful Conversations**: Multi-turn conversation sessions with memory context
- **Memory System**: Automatic memory capture and retrieval
- **Relationship Tracking**: Dynamic relationship state with affinity scores
- **Real-time Updates**: Server-sent events (SSE) for streaming responses
- **Rate Limiting**: Per-endpoint rate limits to prevent abuse
- **Request Tracking**: All requests tracked via requestId for debugging

---

## Authentication

### Authentication Method

The API uses **Bearer Token** authentication with Firebase ID tokens (for users) and admin JWT tokens (for staff).

### Request Format

```bash
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  https://api.featherlight.ai/api/v1/users/me
```

### Headers

All authenticated requests require:

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Authentication Flow

1. **Client** authenticates with Firebase using client credentials
2. **Client** receives Firebase ID token
3. **Client** exchanges token for server session via `/auth/session`
4. **Client** uses session for subsequent API requests

---

## Response Format

### Success Response

All successful API responses follow this format:

```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "timestamp": "2024-07-11T10:30:00Z",
  "requestId": "req-1234567890"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "reason": "Must be a valid email address"
    }
  },
  "timestamp": "2024-07-11T10:30:00Z",
  "requestId": "req-1234567890"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-07-11T10:30:00Z",
  "requestId": "req-1234567890"
}
```

---

## Rate Limiting

### Limit Tiers

| Endpoint Type | Requests/Hour | Requests/Minute |
|---|---|---|
| Authentication | 20 | 5 |
| Chat/Conversation | 1000 | 50 |
| General API | 3000 | 100 |
| Admin/Staff | 10000 | 200 |

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1626070260
```

### Rate Limit Exceeded Response

**Status Code**: `429 Too Many Requests`

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 60
    }
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|---|---|---|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Codes

| Code | Description |
|---|---|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Authentication failed |
| `AUTHORIZATION_ERROR` | User lacks required permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict (duplicate, etc.) |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `INTERNAL_ERROR` | Server error |

---

## Pagination

### Query Parameters

```
GET /api/v1/memory?page=1&limit=20
```

| Parameter | Type | Default | Max | Description |
|---|---|---|---|---|
| `page` | integer | 1 | - | Page number (1-indexed) |
| `limit` | integer | 20 | 100 | Results per page |

### Response Format

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Authentication Endpoints

### POST /auth/session

**Create a server session from Firebase ID token**

**Authentication**: None (Firebase token in body)

**Request**:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ii4uLiJ9..."
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1626070260000",
    "createdAt": "2024-07-11T10:30:00Z",
    "expiresAt": "2024-07-12T10:30:00Z"
  }
}
```

**Rate Limit**: 5 requests/minute

---

### POST /auth/logout

**End the current authenticated session**

**Authentication**: Required (Bearer Token)

**Request**: Empty body

**Response** (200):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Logged out successfully"
  }
}
```

---

### GET /auth/me

**Get current authenticated user info**

**Authentication**: Required (Bearer Token)

**Request**: No parameters

**Response** (200):
```json
{
  "success": true,
  "data": {
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "emailVerified": true,
    "roles": ["user"]
  }
}
```

---

## User Endpoints

### GET /users/me

**Get current authenticated user's full profile**

**Authentication**: Required

**Request**: No parameters

**Response** (200):
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "I love AI companions",
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-07-11T10:30:00Z",
    "preferences": {
      "notifications": true,
      "privateProfile": false
    }
  }
}
```

---

### PATCH /users/me

**Update current user's profile**

**Authentication**: Required

**Request**:
```json
{
  "name": "Jane Doe",
  "avatar": "https://example.com/new-avatar.jpg",
  "bio": "Updated bio",
  "preferences": {
    "notifications": false
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Jane Doe",
    "avatar": "https://example.com/new-avatar.jpg",
    "bio": "Updated bio",
    "updatedAt": "2024-07-11T10:35:00Z",
    "preferences": {
      "notifications": false
    }
  }
}
```

---

### GET /users/:userId

**Get public profile of any user (limited data)**

**Authentication**: Required

**Parameters**:
- `userId` (path): UUID of the user

**Response** (200):
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "I love AI companions"
  }
}
```

---

### DELETE /users/me

**Delete user account (destructive)**

**Authentication**: Required

**Request**: No parameters

**Response** (200):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "User account deleted successfully"
  }
}
```

**Warning**: This action is permanent and cannot be undone.

---

## Companion Endpoints

### POST /companions

**Create a new AI companion**

**Authentication**: Required

**Request**:
```json
{
  "name": "Luna",
  "description": "A mystical moon-themed companion",
  "avatar": "https://example.com/luna.jpg",
  "personality": {
    "traits": ["mysterious", "wise", "empathetic"],
    "speakingStyle": "poetic"
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "companionId": "comp_550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Luna",
    "description": "A mystical moon-themed companion",
    "avatar": "https://example.com/luna.jpg",
    "status": "active",
    "createdAt": "2024-07-11T10:30:00Z"
  }
}
```

---

### GET /companions

**List all companions for current user**

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `status` (optional): Filter by status (active, inactive, archived)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "companionId": "comp_550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Luna",
      "description": "A mystical moon-themed companion",
      "avatar": "https://example.com/luna.jpg",
      "status": "active",
      "createdAt": "2024-07-11T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### GET /companions/:companionId

**Get specific companion details**

**Authentication**: Required

**Parameters**:
- `companionId` (path): UUID of the companion

**Response** (200):
```json
{
  "success": true,
  "data": {
    "companionId": "comp_550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Luna",
    "description": "A mystical moon-themed companion",
    "avatar": "https://example.com/luna.jpg",
    "status": "active",
    "personality": {
      "traits": ["mysterious", "wise", "empathetic"],
      "speakingStyle": "poetic"
    },
    "createdAt": "2024-07-11T10:30:00Z"
  }
}
```

---

### PATCH /companions/:companionId

**Update companion details**

**Authentication**: Required

**Parameters**:
- `companionId` (path): UUID of the companion

**Request**:
```json
{
  "name": "Luna v2",
  "description": "Updated description",
  "status": "active"
}
```

**Response** (200): Updated companion object

---

### DELETE /companions/:companionId

**Delete a companion**

**Authentication**: Required

**Parameters**:
- `companionId` (path): UUID of the companion

**Response** (200):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Companion deleted successfully"
  }
}
```

---

## Conversation Endpoints

### POST /conversation/session

**Create a new conversation session**

**Authentication**: Required

**Rate Limit**: 50 requests/minute

**Request**:
```json
{
  "companionId": "comp_550e8400-e29b-41d4-a716-446655440000",
  "initialMessage": "Hello Luna, how are you today?"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_1626070260000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "companionId": "comp_550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-07-11T10:30:00Z",
    "messages": [
      {
        "role": "user",
        "content": "Hello Luna, how are you today?",
        "timestamp": "2024-07-11T10:30:00Z"
      }
    ]
  }
}
```

---

### GET /conversation/:sessionId

**Get conversation session details**

**Authentication**: Required

**Parameters**:
- `sessionId` (path): UUID of the session

**Response** (200):
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_1626070260000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "companionId": "comp_550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-07-11T10:30:00Z",
    "messages": [
      {
        "role": "user",
        "content": "Hello Luna, how are you today?",
        "timestamp": "2024-07-11T10:30:00Z"
      },
      {
        "role": "assistant",
        "content": "Hello! I'm doing wonderfully, thank you for asking.",
        "timestamp": "2024-07-11T10:30:05Z"
      }
    ]
  }
}
```

---

### POST /conversation/:sessionId/message

**Send a message to the companion**

**Authentication**: Required

**Rate Limit**: 50 requests/minute

**Parameters**:
- `sessionId` (path): UUID of the session

**Request**:
```json
{
  "message": "That's great to hear!"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_1626070260000",
    "userMessage": {
      "role": "user",
      "content": "That's great to hear!",
      "timestamp": "2024-07-11T10:30:10Z"
    },
    "companionResponse": {
      "role": "assistant",
      "content": "I'm glad you think so. What would you like to talk about?",
      "timestamp": "2024-07-11T10:30:15Z"
    }
  }
}
```

---

### GET /conversation/:sessionId/stream

**Stream companion response via Server-Sent Events (SSE)**

**Authentication**: Required

**Parameters**:
- `sessionId` (path): UUID of the session

**Stream Format**: Text/Event-Stream (SSE)

```
data: {"delta":"Hello","timestamp":"2024-07-11T10:30:15Z"}
data: {"delta":" there","timestamp":"2024-07-11T10:30:15Z"}
data: {"finished":true,"finishReason":"stop"}
```

**Usage Example**:
```javascript
const eventSource = new EventSource(`/api/v1/conversation/${sessionId}/stream`);
eventSource.addEventListener('message', (event) => {
  const chunk = JSON.parse(event.data);
  console.log(chunk.delta);
  if (chunk.finished) {
    eventSource.close();
  }
});
```

---

### GET /conversation

**List user's conversations**

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `companionId` (optional): Filter by companion

**Response** (200): Paginated list of conversation sessions

---

### DELETE /conversation/:sessionId

**End/delete a conversation session**

**Authentication**: Required

**Parameters**:
- `sessionId` (path): UUID of the session

**Response** (200):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Conversation session deleted successfully"
  }
}
```

---

## Memory Endpoints

### GET /memory

**List all memories for current user**

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `type` (optional): Filter by type (fact, event, preference, relationship)
- `importance` (optional): Filter by importance (0-10)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "memoryId": "mem_550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "content": "User prefers dark mode",
      "type": "preference",
      "importance": 7,
      "createdAt": "2024-07-10T14:20:00Z",
      "updatedAt": "2024-07-11T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3,
    "hasNextPage": true
  }
}
```

---

### POST /memory

**Create a new memory**

**Authentication**: Required

**Request**:
```json
{
  "content": "User's favorite color is blue",
  "type": "preference",
  "importance": 6,
  "metadata": {
    "context": "mentioned in conversation",
    "source": "session_123"
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "memoryId": "mem_550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "content": "User's favorite color is blue",
    "type": "preference",
    "importance": 6,
    "createdAt": "2024-07-11T10:30:00Z",
    "updatedAt": "2024-07-11T10:30:00Z"
  }
}
```

---

### GET /memory/:memoryId

**Get specific memory details**

**Authentication**: Required

**Parameters**:
- `memoryId` (path): UUID of the memory

**Response** (200): Memory object

---

### PUT /memory/:memoryId

**Update memory**

**Authentication**: Required

**Parameters**:
- `memoryId` (path): UUID of the memory

**Request**:
```json
{
  "content": "User's favorite color is blue (updated)",
  "importance": 7,
  "metadata": {
    "context": "reconfirmed in recent conversation"
  }
}
```

**Response** (200): Updated memory object

---

### DELETE /memory/:memoryId

**Delete a memory**

**Authentication**: Required

**Parameters**:
- `memoryId` (path): UUID of the memory

**Response** (200):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Memory deleted successfully"
  }
}
```

---

### GET /memory/search

**Search memories by query**

**Authentication**: Required

**Query Parameters**:
- `q` (required): Search query
- `type` (optional): Filter by type
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Request**:
```
GET /memory/search?q=favorite%20color&type=preference
```

**Response** (200): Paginated list of matching memories

---

## Relationship Endpoints

### GET /relationships

**List all companion relationships for current user**

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "relationshipId": "rel_550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "companionId": "comp_550e8400-e29b-41d4-a716-446655440000",
      "status": "active",
      "level": "close_friend",
      "affectionScore": 75,
      "trustScore": 82,
      "familiarityScore": 90,
      "totalInteractions": 156,
      "createdAt": "2024-01-15T08:00:00Z",
      "updatedAt": "2024-07-11T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "pages": 1
  }
}
```

---

### GET /relationships/:companionId

**Get relationship status with specific companion**

**Authentication**: Required

**Parameters**:
- `companionId` (path): UUID of the companion

**Response** (200): Relationship object

---

### PATCH /relationships/:companionId

**Update relationship status**

**Authentication**: Required

**Parameters**:
- `companionId` (path): UUID of the companion

**Request**:
```json
{
  "level": "best_friend",
  "status": "active"
}
```

**Response** (200): Updated relationship object

---

### DELETE /relationships/:companionId

**End relationship with a companion**

**Authentication**: Required

**Parameters**:
- `companionId` (path): UUID of the companion

**Response** (200):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Relationship deleted successfully"
  }
}
```

---

## Notification Endpoints

### GET /notifications

**List user's notifications**

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Results per page
- `unreadOnly` (optional): Filter unread only (boolean)
- `type` (optional): Filter by type

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "notificationId": "notif_550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "type": "message",
      "title": "New message from Luna",
      "content": "Luna sent you a message",
      "read": false,
      "data": {
        "companionId": "comp_550e8400-e29b-41d4-a716-446655440000",
        "sessionId": "sess_1626070260000"
      },
      "createdAt": "2024-07-11T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

### POST /notifications/:notificationId/read

**Mark notification as read**

**Authentication**: Required

**Parameters**:
- `notificationId` (path): UUID of the notification

**Response** (200):
```json
{
  "success": true,
  "data": {
    "notificationId": "notif_550e8400-e29b-41d4-a716-446655440000",
    "read": true
  }
}
```

---

### DELETE /notifications/:notificationId

**Delete a notification**

**Authentication**: Required

**Parameters**:
- `notificationId` (path): UUID of the notification

**Response** (200):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Notification deleted successfully"
  }
}
```

---

### POST /notifications/mark-all-read

**Mark all notifications as read**

**Authentication**: Required

**Request**: Empty body

**Response** (200):
```json
{
  "success": true,
  "data": {
    "markedCount": 12
  }
}
```

---

## Moment Endpoints

### GET /moments

**List user's moments**

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Results per page
- `type` (optional): Filter by type

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "momentId": "mom_550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "companionId": "comp_550e8400-e29b-41d4-a716-446655440000",
      "title": "First conversation with Luna",
      "description": "We had our first meaningful conversation",
      "type": "milestone",
      "significance": 9,
      "occurredAt": "2024-01-15T08:00:00Z",
      "createdAt": "2024-01-15T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1
  }
}
```

---

### POST /moments

**Create a new moment**

**Authentication**: Required

**Request**:
```json
{
  "title": "Anniversary celebration",
  "description": "Celebrated one year together with Luna",
  "companionId": "comp_550e8400-e29b-41d4-a716-446655440000",
  "type": "milestone",
  "significance": 10,
  "occurredAt": "2024-07-11T10:30:00Z"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "momentId": "mom_550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Anniversary celebration",
    "createdAt": "2024-07-11T10:30:00Z"
  }
}
```

---

### GET /moments/:momentId

**Get specific moment details**

**Authentication**: Required

**Parameters**:
- `momentId` (path): UUID of the moment

**Response** (200): Moment object

---

### PATCH /moments/:momentId

**Update moment**

**Authentication**: Required

**Parameters**:
- `momentId` (path): UUID of the moment

**Request**:
```json
{
  "description": "Updated description",
  "significance": 9
}
```

**Response** (200): Updated moment object

---

### DELETE /moments/:momentId

**Delete a moment**

**Authentication**: Required

**Parameters**:
- `momentId` (path): UUID of the moment

**Response** (200):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Moment deleted successfully"
  }
}
```

---

## Webhook Events

The API can send webhook events to your configured webhook endpoint for real-time updates.

### Supported Events

- `user.created` - New user registered
- `user.updated` - User profile updated
- `conversation.started` - New conversation session
- `message.sent` - Message sent in conversation
- `message.received` - Response received from companion
- `memory.created` - New memory created
- `memory.updated` - Memory updated
- `relationship.changed` - Relationship status changed
- `notification.created` - New notification

### Webhook Payload Format

```json
{
  "event": "message.received",
  "timestamp": "2024-07-11T10:30:00Z",
  "data": {
    "sessionId": "sess_1626070260000",
    "companionId": "comp_550e8400-e29b-41d4-a716-446655440000",
    "message": "Hello! How can I help you?"
  }
}
```

---

## Best Practices

### 1. Error Handling

Always check the `success` field and handle errors gracefully:

```javascript
try {
  const response = await fetch('/api/v1/memory', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  if (!data.success) {
    console.error(`Error: ${data.error.code} - ${data.error.message}`);
    // Handle specific error codes
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### 2. Rate Limiting

Implement exponential backoff when rate limited:

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        const retryAfter = parseInt(error.headers['x-ratelimit-reset']);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        throw error;
      }
    }
  }
}
```

### 3. Request Tracking

Use the `requestId` for debugging and support:

```javascript
const response = await fetch('/api/v1/memory');
const data = await response.json();
console.log(`Request ID: ${data.requestId}`);
// Include this in bug reports and support tickets
```

### 4. Pagination

Always check `hasNextPage` before fetching more:

```javascript
let page = 1;
let allMemories = [];

while (true) {
  const response = await fetch(`/api/v1/memory?page=${page}&limit=50`);
  const data = await response.json();
  allMemories.push(...data.data);
  
  if (!data.pagination.hasNextPage) break;
  page++;
}
```

---

## SDK/Client Libraries

### JavaScript/TypeScript

```bash
npm install @featherlight/sdk
```

```typescript
import { FeatherlightClient } from '@featherlight/sdk';

const client = new FeatherlightClient({
  token: 'your-token',
  baseURL: 'https://api.featherlight.ai/api/v1'
});

// Create conversation
const session = await client.conversation.create({
  companionId: 'comp_xxx',
  initialMessage: 'Hello!'
});

// Send message
const response = await client.conversation.sendMessage(session.sessionId, {
  message: 'How are you?'
});
```

### Python

```bash
pip install featherlight-sdk
```

```python
from featherlight import Client

client = Client(
    token='your-token',
    base_url='https://api.featherlight.ai/api/v1'
)

# Create conversation
session = client.conversation.create(
    companion_id='comp_xxx',
    initial_message='Hello!'
)

# Send message
response = client.conversation.send_message(
    session_id=session['sessionId'],
    message='How are you?'
)
```

---

## Support

**Documentation**: https://docs.featherlight.ai  
**API Status**: https://status.featherlight.ai  
**Support Email**: support@featherlight.ai  
**Discord Community**: https://discord.gg/featherlight

---

**Last Updated**: July 11, 2024  
**API Version**: 1.0.0
