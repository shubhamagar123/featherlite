import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const chatLatency = new Trend('chat_latency');
const messagesSent = new Counter('messages_sent');
const activeSessions = new Gauge('active_sessions');

// Load test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    errors: ['rate<0.1'], // Error rate should stay below 10%
    chat_latency: ['p(95)<2000'], // 95th percentile should be below 2 seconds
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const SESSION_TOKEN = __ENV.SESSION_TOKEN || 'test-token';

/**
 * Simulate a user session: authenticate, create conversation, send message
 */
export default function () {
  activeSessions.add(1);

  group('Authentication flow', () => {
    const response = http.post(`${BASE_URL}/api/v1/auth/session`, {
      token: SESSION_TOKEN,
    });

    check(response, {
      'auth status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'auth response has session': (r) => r.body.includes('sessionId'),
    }) || errorRate.add(1);

    sleep(1);
  });

  group('Conversation interaction', () => {
    // Create conversation
    const createResponse = http.post(`${BASE_URL}/api/v1/conversation/session`);

    check(createResponse, {
      'create conversation status is 201': (r) => r.status === 201,
      'create conversation has session id': (r) => r.body.includes('sessionId'),
    }) || errorRate.add(1);

    if (createResponse.status === 201) {
      const sessionId = JSON.parse(createResponse.body).sessionId;

      sleep(1);

      // Send message with timing
      const startTime = new Date();
      const messageResponse = http.post(
        `${BASE_URL}/api/v1/conversation/${sessionId}/message`,
        JSON.stringify({
          message: 'Hello, how are you?',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const latency = new Date() - startTime;
      chatLatency.add(latency);
      messagesSent.add(1);

      check(messageResponse, {
        'message send status is 200': (r) => r.status === 200,
        'message response has content': (r) => r.body.includes('response'),
      }) || errorRate.add(1);
    }

    sleep(2);
  });

  group('Memory operations', () => {
    // List memories
    const listResponse = http.get(`${BASE_URL}/api/v1/memory`);

    check(listResponse, {
      'list memories status is 200': (r) => r.status === 200,
      'list memories is array': (r) => r.body.includes('['),
    }) || errorRate.add(1);

    sleep(1);
  });

  group('Relationship state', () => {
    // Get relationship state
    const stateResponse = http.get(`${BASE_URL}/api/v1/relationship/state`);

    check(stateResponse, {
      'get relationship status is 200': (r) => r.status === 200,
      'relationship response has dimensions': (r) => r.body.includes('dimension'),
    }) || errorRate.add(1);

    sleep(1);
  });

  activeSessions.add(-1);
  sleep(1);
}

/**
 * Setup function: runs once before all VUs
 */
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  console.log(`Simulating up to 200 concurrent users`);
}

/**
 * Teardown function: runs once after all VUs
 */
export function teardown() {
  console.log('Load test completed');
}
