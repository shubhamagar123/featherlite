# API Integration Tests

This directory contains integration tests for the Featherlight backend API routes.

## Overview

Integration tests verify that:
- **Request Validation**: Input validation works correctly for all parameter types
- **Authentication**: Protected routes require valid authentication tokens
- **Authorization**: Users can only access their own resources
- **Response Format**: Responses follow the standard API format with proper metadata
- **Error Handling**: Errors are returned with appropriate status codes and messages
- **Rate Limiting**: Rate limiting is enforced on sensitive operations
- **Security**: Security headers are present and no sensitive data is leaked

## Running Tests

```bash
# Run all integration tests
npm run test -- test/integration

# Run specific test file
npm run test -- test/integration/moment.routes.integration.spec.ts

# Run with coverage
npm run test -- test/integration --coverage

# Watch mode
npm run test -- test/integration --watch
```

## Test Structure

Each route test file follows this pattern:

```typescript
describe('Route - Integration Tests', () => {
  beforeAll(async () => {
    // Initialize app once
    await setupApp();
  });

  afterAll(async () => {
    // Clean up
    await resetApp();
  });

  describe('GET /api/v1/endpoint', () => {
    it('should test specific behavior', async () => {
      // Arrange
      const req = await createAuthenticatedRequest();
      
      // Act
      const response = await req.get('/api/v1/endpoint');
      
      // Assert
      expect(response.status).toBe(200);
    });
  });
});
```

## Test Utilities

The `setup.ts` file provides helpful utilities:

### `setupApp()`
Initialize the Express app once for the test suite.

### `createRequest()`
Create an unauthenticated request helper.

### `createAuthenticatedRequest(token?)`
Create a request with an Authorization header. Uses a default test token if not provided.

### `assertApiResponse`
Fluent assertion helpers for common API response patterns:

```typescript
// Success response with data
assertApiResponse
  .success(response, 200)
  .hasStatus()
  .hasData()
  .hasRequestId()
  .returns({ /* expected data */ });

// Paginated response
assertApiResponse
  .paginated(response)
  .hasPagination()
  .hasItems()
  .itemCount(10);

// Error response
assertApiResponse
  .error(response, 400)
  .hasStatus()
  .hasMessage()
  .messageContains('invalid');
```

## Test Coverage

Current test files:

- **auth.routes.integration.spec.ts** - Authentication endpoints
  - Session creation and login
  - User profile retrieval
  - Token refresh
  - Logout
  - Error handling and security

- **moment.routes.integration.spec.ts** - Moment (scheduled events) endpoints
  - Listing moments with pagination
  - Filtering by type and upcoming status
  - Getting moment details
  - Getting completed moments
  - Parameter validation
  - Rate limiting

## Common Test Patterns

### Testing Authentication
```typescript
it('should require authentication', async () => {
  const req = await createRequest(); // No auth
  const response = await req.get('/api/v1/protected');
  expect(response.status).toBe(401);
});
```

### Testing Validation
```typescript
it('should validate required fields', async () => {
  const req = await createAuthenticatedRequest();
  const response = await req.post('/api/v1/endpoint').send({});
  expect(response.status).toBe(400);
});
```

### Testing Pagination
```typescript
it('should return paginated results', async () => {
  const req = await createAuthenticatedRequest();
  const response = await req
    .get('/api/v1/endpoint')
    .query({ page: 2, limit: 20 });
  
  expect(response.body.pagination.page).toBe(2);
  expect(response.body.pagination.limit).toBe(20);
});
```

### Testing Filters
```typescript
it('should filter by status', async () => {
  const req = await createAuthenticatedRequest();
  const response = await req
    .get('/api/v1/endpoint')
    .query({ status: 'active' });
  
  expect(response.body.data).toBeDefined();
});
```

## Extending Tests

To add tests for a new route:

1. Create a new test file: `test/integration/feature.routes.integration.spec.ts`
2. Import test utilities from `setup.ts`
3. Follow the standard test structure
4. Test all HTTP methods (GET, POST, PUT, PATCH, DELETE)
5. Test authentication and validation
6. Test successful and error cases
7. Update this README

## Mock Data

Test utilities provide mock data:
- `mockUser` - Test user context
- `mockCompanion` - Test companion data

These can be extended with additional test fixtures as needed.

## Best Practices

1. **Keep tests focused** - Each test should verify one behavior
2. **Use descriptive names** - Test names should explain what's being tested
3. **Test both success and failure** - Verify happy path and error cases
4. **Avoid test interdependence** - Each test should be independent
5. **Use helpers** - Use `assertApiResponse` for common assertions
6. **Mock external services** - Keep tests isolated from databases, external APIs
7. **Test edge cases** - Empty arrays, null values, boundary conditions
8. **Verify response format** - Check that responses follow the API contract

## Debugging Tests

Run specific test with verbose output:
```bash
npm run test -- test/integration/auth.routes.integration.spec.ts --verbose
```

Print debug info:
```typescript
console.log('Response:', response.body);
console.log('Headers:', response.headers);
```

Use `only` to run a single test:
```typescript
it.only('should test something', async () => {
  // This test runs in isolation
});
```
