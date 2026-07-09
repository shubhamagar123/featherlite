# Load Testing

This directory contains load tests using [k6](https://k6.io/).

## Setup

1. Install k6:

```bash
# macOS with Homebrew
brew install k6

# Linux
apt-get install k6

# Docker
docker pull grafana/k6
```

2. Ensure your server is running (default: `http://localhost:3000`)

## Running Tests

### Development Environment

Run with default settings:

```bash
k6 run test/load/chat-load.js
```

Run with custom base URL:

```bash
BASE_URL=http://api.example.com k6 run test/load/chat-load.js
```

Run with session token:

```bash
SESSION_TOKEN=your-token k6 run test/load/chat-load.js
```

### Docker Execution

Run via Docker:

```bash
docker run -i grafana/k6 run - <test/load/chat-load.js
```

### CI/CD Integration

Load tests run nightly via GitHub Actions. Results are logged and can be monitored in the Actions tab.

## Test Scenarios

### chat-load.js
Simulates a realistic user session:
1. Authentication (Firebase token → server session)
2. Conversation creation and message sending
3. Memory listing
4. Relationship state queries

**Load Profile:**
- Ramp up to 100 concurrent users over 2 minutes
- Hold at 100 users for 5 minutes
- Ramp up to 200 users over 2 minutes
- Hold at 200 users for 5 minutes
- Ramp down to 0 users over 2 minutes

**Thresholds:**
- Error rate < 10%
- 95th percentile latency < 2000ms

## Metrics

Custom metrics tracked:
- `errors`: Error rate (should stay < 10%)
- `chat_latency`: End-to-end message latency (p95 < 2s)
- `messages_sent`: Total messages sent
- `active_sessions`: Currently active user sessions

## Interpreting Results

Successful test output shows:
```
✓ auth status is 200 or 201
✓ auth response has session
✓ create conversation status is 201
✓ message send status is 200
```

Failed test output shows:
```
✗ message send status is 200: 80% (1600 samples, 100 failures)
```

## Debugging

Enable verbose logging:

```bash
k6 run -v test/load/chat-load.js
```

## Production Testing

Before running load tests against production:

1. Notify the on-call engineer
2. Schedule for off-peak hours
3. Start with stage: target 10, duration 1m (smoke test)
4. Monitor server metrics (CPU, memory, connections)
5. Check logs for errors or rate limit events
