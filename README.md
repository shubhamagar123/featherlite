# Featherlight Backend

Production-grade AI companion platform backend built with Node.js, TypeScript,
PostgreSQL, and Prisma. Uses **Feature-Driven + Clean Architecture** with
deterministic business engines and strict layering.

**Status**: Core layers complete (Infrastructure, Services, Engines). API layer
and AI integration are future work.

---

## Architecture Overview

Featherlight is organized into **6 architectural layers** and **6 core engines**:

### Layers
1. **Core** — Domain types, `Result<T>`, exceptions
2. **Infrastructure** — Database (Prisma, 9 repositories), config, middleware
3. **Services** — Business logic (9 services), DTOs, mappers, validation
4. **Engines** — Deterministic business engines (World, Companion, Relationship, Memory)
5. **Interaction** — HTTP layer (future: Express controllers/routes)
6. **AI** — LLM integration (future)
7. **Presentation** — Response serialization (future)

### Engines
- **World Engine** — Deterministic world generation (70-20-10 rule, seeded PRNG)
- **Companion Engine** — Life-state resolution (state machine, mood/expression/gesture)
- **Relationship Engine** — User-companion relationship snapshots
- **Memory Engine** — Memory retrieval and ranking
- **Memory Extraction Engine** — Entity extraction, importance detection, categorization
- **Context Engine** — Aggregation boundary (6 concurrent providers, graceful degradation)
- **Prompt Engine** — LLM-agnostic prompt construction (context injection, rules, compression)

**See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete dependency graphs, folder tree, and design principles.**

---

## Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd featherlite
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

### 3. Database Setup

```bash
# Start PostgreSQL (Docker)
docker-compose up postgres

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npm run db:seed
```

### 4. Run Tests

```bash
# Run all tests (226 tests across 22 suites)
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### 5. Type Check

```bash
npm run typecheck
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript 5.x |
| **Runtime** | Node.js 20+ |
| **Database** | PostgreSQL 16+ with Prisma ORM |
| **Testing** | Jest with mocked dependencies |
| **Logging** | Pino (structured) |
| **Validation** | Custom validators (no external dependency) |
| **Error Handling** | `Result<T>` monadic type |

**Future**: Express (HTTP), OpenAI (LLM), Redis (caching)

---

## Available Scripts

```bash
# Development
npm run dev                 # Start dev server (future)
npm run typecheck          # Type check

# Testing
npm run test               # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report

# Code Quality
npm run lint              # ESLint check
npm run lint:fix          # Fix lint issues
npm run format            # Prettier format
npm run format:check      # Check formatting

# Database
npx prisma migrate dev --name "description"  # Create migration
npx prisma migrate deploy                     # Apply migrations
npm run db:studio         # Prisma Studio GUI
npm run db:reset          # Reset database (dev only)
```

---

## Project Structure

```
src/
├── config/                    # Environment validation
├── database/
│   ├── repositories/          # 9 concrete repositories
│   ├── prisma.ts              # Prisma client setup
│   ├── repository.base.ts     # Base CRUD + soft delete
│   ├── transaction.ts         # Transaction management
│   └── README.md
├── engines/
│   ├── world/                 # World Engine (41 tests)
│   ├── companion/             # Companion Engine (66 tests)
│   ├── relationship/          # Relationship Engine
│   ├── memory/                # Memory Engine
│   ├── memory-extraction/     # Memory Extraction Engine
│   ├── context/               # Context Engine (22 tests)
│   ├── README.md
│   └── index.ts (future)
├── middleware/
│   ├── errorHandler.ts        # Express error handling
│   ├── requestContext.ts      # Request-scoped DI
│   ├── requestLogger.ts       # Pino logging
│   └── security.ts            # Security headers
├── services/
│   ├── base/                  # Base Service
│   ├── companion/
│   ├── conversation/
│   ├── dtos/                  # All transfer objects
│   ├── exceptions/            # 11 domain-specific exceptions
│   ├── mappers/               # Entity → DTO mapping
│   ├── memory/
│   ├── message/
│   ├── moment/
│   ├── notification/
│   ├── relationship/
│   ├── types/                 # Result<T>, shared types
│   ├── user/
│   ├── factory.ts             # DI container
│   ├── README.md
│   └── index.ts
├── utils/
│   ├── error.ts               # Error utilities
│   ├── logger.ts              # Pino setup
│   └── response.ts            # Response formatting
├── app.ts (future)            # Express app
└── index.ts (future)          # Server entry point

prisma/
├── schema.prisma              # Entity definitions
└── migrations/                # Database migrations

tests/
├── env.setup.ts               # Jest env vars
└── (test files live alongside source)
```

---

## Key Design Principles

### 1. Deterministic, No Random
All engines use seeded PRNGs and business rules — **never** `Math.random()`.
World state and companion state are completely reproducible.

### 2. Strict Layering
- **API** ↔ **Engines** ↔ **Services** ↔ **Repositories** ↔ **Database**
- API sees only Context Engine.
- Engines orchestrate services; services map entities to DTOs.
- Never cross layers (no repository calls from middleware, etc.).

### 3. Explicit Error Handling
`Result<T>` type: failures are data, not exceptions.

```typescript
// Instead of:
const user = await userService.getUserById(id); // throws on failure

// Do:
const result = await userService.getUserById(id); // returns Result<UserDTO>
if (result.isSuccess) {
  const user = result.value;
} else {
  console.error(result.error);
}
```

### 4. Provider Pattern
Context Engine uses 6 concurrent providers (one per source), each with:
- Independent failure handling
- Graceful degradation (optional providers)
- Health reporting via `meta.degraded[]`

### 5. Dependency Injection
All dependencies are constructor-injected. Enables:
- Independent unit testing (mock services)
- Swapping implementations
- Clear contracts (interfaces)

### 6. No Bleeding Abstractions
- DTOs are separate from entities
- Services never expose repositories
- Each layer has its own types

---

## Testing

**226 tests across 22 suites, all passing.**

| Suite | Tests | Status |
|-------|-------|--------|
| World Engine | 41 | ✅ PASS |
| Companion Engine | 66 | ✅ PASS |
| Companion State Machine | 15 | ✅ PASS |
| Context Engine | 22 | ✅ PASS |
| Database/Repositories | 82 | ✅ PASS |

**Test pattern**: Unit tests with mocked dependencies. Integration tests with
real providers over mocked services.

```bash
# Run tests
npm run test

# Watch mode (re-run on file change)
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Database

### Migrations

```bash
# Create a new migration
npx prisma migrate dev --name "add_user_preferences"

# Apply migrations in production
npx prisma migrate deploy

# Reset database (dev only)
npm run db:reset
```

### Schema

Entities:
- User, Companion, Relationship
- Conversation, Message
- Memory, Moment
- Notification, World

Features:
- **Soft delete** — All entities support `deletedAt` soft delete
- **Automatic timestamps** — `createdAt`, `updatedAt` on all entities
- **Strategic indexes** — On foreign keys, unique constraints, common queries

**See `prisma/schema.prisma` for full schema.**

---

## Environment Variables

Critical variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/featherlight

# Node
NODE_ENV=development

# Logging
LOG_LEVEL=debug

# JWT (future)
JWT_SECRET=your-secret-key

# Firebase (future)
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...

# AWS S3 (future)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# OpenAI (future)
OPENAI_API_KEY=...
```

See `.env.example` for complete list.

---

## Development Workflow

1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Make changes** in `src/`
3. **Type check**: `npm run typecheck`
4. **Run tests**: `npm run test:watch`
5. **Lint & format**: `npm run lint:fix && npm run format`
6. **Commit**: `git commit -m "feat: description"`
7. **Push**: `git push origin feature/your-feature`
8. **Create PR** for review

---

## Next Steps

### Phase 1: Complete Engines
- [ ] Implement Memory Extraction Engine (entity extraction, scoring)
- [ ] Implement Memory Engine (bridge to Memory Service)
- [ ] Build Conversation Engine (consume Context Engine)

### Phase 2: HTTP Layer
- [ ] Create Express controllers
- [ ] Define API routes
- [ ] Add authentication middleware

### Phase 3: AI Integration
- [ ] Integrate LLM provider (OpenAI)
- [ ] Implement inference pipeline
- [ ] Add caching layer

### Phase 4: Deployment
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Production monitoring

---

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Complete architecture with Mermaid diagrams
- **[src/engines/README.md](./src/engines/README.md)** — Engines layer overview
- **[src/services/README.md](./src/services/README.md)** — Services layer (9 services)
- **[src/database/README.md](./src/database/README.md)** — Database layer (repositories, schema)
- **[src/engines/world/README.md](./src/engines/world/README.md)** — World Engine (deterministic, 70-20-10)
- **[src/engines/companion/README.md](./src/engines/companion/README.md)** — Companion Engine (state machine)
- **[src/engines/context/README.md](./src/engines/context/README.md)** — Context Engine (aggregation)

---

## Troubleshooting

### Type Errors

```bash
npm run typecheck
```

Fix TypeScript errors before testing/committing.

### Test Failures

```bash
npm run test -- --verbose
```

Check test output for exact failure. Mock data in `src/**/__tests__/helpers.ts`.

### Database Issues

```bash
# Check connection
npx prisma db execute --stdin < <(echo "SELECT 1")

# Reset database (dev only)
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

### Environment Variables

```bash
# Verify env vars are set
node -e "console.log(process.env.DATABASE_URL)"

# Check .env.local exists
cat .env.local
```

---

## Support

- **Issues**: Create GitHub issue with:
  - TypeScript error output (if applicable)
  - Test failure details
  - Environment (Node version, OS)
- **Docs**: Check ARCHITECTURE.md and README files in each layer
- **Tests**: Look at test patterns in `src/**/__tests__/`

---

## License

Proprietary — Featherlight Team
