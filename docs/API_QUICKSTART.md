# Featherlight API - Quick Start Guide

Get started with the Featherlight API in 5 minutes!

## 1. Authentication

First, authenticate with Firebase and exchange for a server session:

```bash
# Get Firebase ID token (from client)
FIREBASE_TOKEN="your-firebase-id-token"

# Exchange for server session
curl -X POST https://api.featherlight.ai/api/v1/auth/session \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$FIREBASE_TOKEN\"}"

# Response:
# {
#   "success": true,
#   "data": {
#     "sessionId": "session_1626070260000",
#     "expiresAt": "2024-07-12T10:30:00Z"
#   }
# }
```

Use the `sessionId` as your Bearer token for subsequent requests:

```bash
TOKEN="session_1626070260000"
```

## 2. Get User Profile

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.featherlight.ai/api/v1/users/me
```

## 3. Create a Companion

```bash
curl -X POST https://api.featherlight.ai/api/v1/companions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Luna",
    "description": "A mystical companion",
    "avatar": "https://example.com/luna.jpg",
    "personality": {
      "traits": ["mysterious", "wise"],
      "speakingStyle": "poetic"
    }
  }'

# Save the companionId from response:
COMPANION_ID="comp_550e8400-e29b-41d4-a716-446655440000"
```

## 4. Start a Conversation

```bash
curl -X POST https://api.featherlight.ai/api/v1/conversation/session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"companionId\": \"$COMPANION_ID\",
    \"initialMessage\": \"Hello!\"
  }"

# Save the sessionId from response:
SESSION_ID="sess_1626070260000"
```

## 5. Send a Message

```bash
curl -X POST https://api.featherlight.ai/api/v1/conversation/$SESSION_ID/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "How are you today?"}'
```

## 6. Stream Response (Real-time)

For real-time streaming responses using Server-Sent Events:

```javascript
const response = await fetch(
  `https://api.featherlight.ai/api/v1/conversation/${sessionId}/stream`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data.delta);
    }
  }
}
```

## 7. Save a Memory

Automatically capture information about the user:

```bash
curl -X POST https://api.featherlight.ai/api/v1/memory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "User prefers dark mode",
    "type": "preference",
    "importance": 7
  }'
```

## 8. Query Memories

Retrieve and search memories:

```bash
# List all memories
curl -H "Authorization: Bearer $TOKEN" \
  https://api.featherlight.ai/api/v1/memory?page=1&limit=20

# Search memories
curl -H "Authorization: Bearer $TOKEN" \
  https://api.featherlight.ai/api/v1/memory/search?q=favorite%20color
```

## 9. Check Relationship Status

Track your relationship with companions:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.featherlight.ai/api/v1/relationships/$COMPANION_ID

# Response includes:
# - affectionScore (0-100)
# - trustScore (0-100)
# - familiarityScore (0-100)
# - level: best_friend, close_friend, friend, acquaintance
```

## 10. List Notifications

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.featherlight.ai/api/v1/notifications?unreadOnly=true
```

---

## Common Parameters

All list endpoints support pagination:

```bash
# page: 1 (default)
# limit: 20 (default, max 100)

curl -H "Authorization: Bearer $TOKEN" \
  https://api.featherlight.ai/api/v1/memory?page=2&limit=50
```

## Error Handling

All responses include a `success` field:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": { ... }
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid parameters
- `AUTHENTICATION_ERROR`: Invalid token
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limits

- **Chat endpoints**: 50 requests/minute
- **General API**: 100 requests/minute
- **Authentication**: 5 requests/minute

Check rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1626070260
```

## Tools & Libraries

### REST Client (Insomnia/Postman)

Import the OpenAPI spec:

```
https://api.featherlight.ai/api/v1/docs/openapi.json
```

### JavaScript SDK

```bash
npm install @featherlight/sdk
```

```javascript
import { FeatherlightClient } from '@featherlight/sdk';

const client = new FeatherlightClient({ token });
const session = await client.conversation.create({
  companionId,
  initialMessage: 'Hello!'
});
```

### Python SDK

```bash
pip install featherlight-sdk
```

```python
from featherlight import Client

client = Client(token=token)
session = client.conversation.create(
    companion_id=companion_id,
    initial_message='Hello!'
)
```

---

## Next Steps

1. Read the [full API documentation](./API.md)
2. Explore [webhook events](./WEBHOOKS.md)
3. Check out [code examples](../examples/)
4. Join our [Discord community](https://discord.gg/featherlight)

**Stuck?** Check the [FAQ](./FAQ.md) or email support@featherlight.ai
