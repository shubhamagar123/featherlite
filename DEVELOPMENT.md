# Development Guide

This guide helps you set up and work with the Featherlight Backend locally.

## Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Docker and Docker Compose (for local services)
- Git

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/shubhamagar123/featherlite.git
cd featherlite
npm install
```

### 2. Start Local Services

Use Docker Compose to run Postgres, Redis, Prometheus, and Jaeger:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`
- **Prometheus** on `http://localhost:9090`
- **Jaeger** on `http://localhost:16686` (UI)

### 3. Set Up Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with:

```env
# Database
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/featherlite_dev

# Redis
REDIS_URL=redis://localhost:6379

# OpenTelemetry
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SAMPLING_RATE=1.0

# Other config
NODE_ENV=development
PORT=3000
```

### 4. Run Database Migrations

```bash
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The server starts at `http://localhost:3000`.

## Development Workflow

### Run Tests

```bash
# All tests
npm test

# Tests in watch mode
npm test:watch

# With coverage
npm test:coverage

# Architecture fitness tests only
npm run test:architecture
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
# Check for issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Code Formatting

```bash
# Check formatting
npm run format:check

# Auto-format
npm run format
```

### Database Operations

```bash
# Run migrations
npm run db:migrate

# Reset database (drops and recreates)
npm run db:reset

# Open Prisma Studio (GUI for database)
npm run db:studio

# Seed with sample data
npm run db:seed
```

## Local Service Access

### PostgreSQL

```bash
# Connect with psql
psql postgresql://dev_user:dev_password@localhost:5432/featherlite_dev

# Or use Prisma Studio
npm run db:studio
```

### Redis

```bash
# Connect with redis-cli
redis-cli

# Or use a GUI client
# RedisInsight: https://redis.com/redis-enterprise/redis-insight/
```

### Prometheus Metrics

Visit `http://localhost:9090/graph` to query metrics.

### Jaeger Traces

Visit `http://localhost:16686` to view distributed traces of your requests.

## Debugging

### Enable Debug Logging

```bash
DEBUG=featherlite:* npm run dev
```

### Node Inspector

```bash
node --inspect dist/index.js
```

Then open `chrome://inspect` in Chrome.

### Prisma Query Logging

Add to `.env.local`:

```env
DEBUG=prisma:query
```

## Git Workflow

### Create a Feature Branch

```bash
git checkout -b feature/my-feature
```

### Commit Changes

```bash
git add src/...
git commit -m "feat: implement cool feature

- Detail 1
- Detail 2"
```

### Create a Pull Request

Commit should be made to the designated branch (check CLAUDE.md or environment setup).

## Architecture

See `BACKEND_PLATFORM_ARCHITECTURE.md` for system overview.

### Key Directories

```
src/
├── config/           # Configuration (environment, deployment)
├── middleware/       # Express middleware (auth, logging, errors)
├── api/             # REST routes
├── engines/         # Domain logic (memory, relationships, etc.)
├── services/        # Business logic (repositories, validation)
├── database/        # Prisma repositories
├── infra/           # Infrastructure (observability, tracing, health checks)
├── utils/           # Utilities
└── types/           # Global type definitions

test/
├── architecture/    # Fitness functions (architectural guardrails)
└── load/           # k6 load tests
```

## Common Tasks

### Add a New Database Model

```bash
# Edit prisma/schema.prisma
# Add migration
npm run db:migrate -- --name add_my_model
# Create repository in src/database/repositories/
```

### Add a New Route

```typescript
// src/api/my-module/my-route.ts
export async function registerMyRoutes(app: Express) {
  app.get('/api/v1/my-endpoint', authenticate, async (req, res) => {
    // Route handler
  });
}

// src/api/index.ts - Add to mountApi()
registerMyRoutes(app);
```

### Add an Event Handler

```typescript
// src/engines/my-engine/handlers/my.handler.ts
export class MyEventHandler extends BaseEventHandler {
  async onEvent(envelope: EventEnvelope): Promise<void> {
    // Handle event
  }
}

// Register in module bootstrap
```

## Troubleshooting

### "Database connection refused"

Ensure services are running:

```bash
docker-compose -f docker-compose.dev.yml ps
```

If not running:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### "Port 5432 already in use"

Another service is using the port. Stop it:

```bash
lsof -i :5432
kill -9 <PID>
```

Or use a different port in `docker-compose.dev.yml`.

### "TypeScript compilation errors"

Ensure types are installed:

```bash
npm install
npm run typecheck
```

### "Jest tests timeout"

Increase timeout in `jest.config.js` or for specific tests:

```typescript
it('slow test', async () => {
  // test
}, 30000); // 30 second timeout
```

### "Module not found"

Check path aliases in `tsconfig.json` match `jest.config.js` `moduleNameMapper`.

## Performance Optimization

### Profile Memory Usage

```bash
node --prof dist/index.js
# Process results with: node --prof-process isolate-*.log > results.txt
```

### Monitor CPU

```bash
npm run dev &
# In another terminal:
top -p <PID>
```

## Deployment

See `ARCHITECTURE_EVENT_DRIVEN.md` for deployment instructions.

## Getting Help

1. Check existing documentation in `src/engines/*/README.md`
2. Review recent commits: `git log --oneline -20`
3. Check GitHub issues and discussions
4. Ask tech lead or team

## Security

- Never commit `.env` files (use `.env.example`)
- Don't log sensitive data (email, passwords, tokens)
- Always validate user input via Zod schemas
- Use authentication/authorization middleware on all routes
- Review SECURITY.md before deploying
