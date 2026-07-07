# Featherlight Backend

Production-grade AI companion platform backend built with Node.js, Express, PostgreSQL, and TypeScript.

## Tech Stack

- **Language:** Node.js (LTS) with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Caching:** Redis
- **Authentication:** Firebase
- **Storage:** AWS S3
- **Realtime:** Socket.io
- **Validation:** Zod
- **Logging:** Pino
- **Testing:** Jest

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker & Docker Compose (for containerized development)
- PostgreSQL 16+ (or via Docker)
- Redis 7+ (or via Docker)

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd featherlight-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env.local` and update values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
- Database credentials
- Firebase credentials
- AWS S3 credentials
- API keys (OpenAI, etc.)

### 4. Start Database & Cache (Docker)

```bash
# Start PostgreSQL and Redis only
docker-compose up postgres redis

# Or start all services including the app
docker-compose --profile with-app up
```

### 5. Run Database Migrations

```bash
npx prisma migrate dev
```

### 6. Seed Database (Optional)

```bash
npm run db:seed
```

### 7. Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3000`

## Available Scripts

```bash
# Development
npm run dev                 # Start dev server with hot reload

# Building
npm run build              # Compile TypeScript to JavaScript
npm run typecheck          # Type check without building

# Testing
npm run test               # Run tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report

# Code Quality
npm run lint              # Check code style
npm run lint:fix          # Fix linting issues
npm run format            # Format code with Prettier
npm run format:check      # Check Prettier formatting

# Database
npm run db:migrate        # Create/apply migrations
npm run db:migrate:prod   # Apply migrations in production
npm run db:seed           # Seed database with sample data
npm run db:reset          # Reset database (dev only)
npm run db:studio         # Open Prisma Studio GUI

# Health Check
npm run health-check      # Check API health
```

## Project Structure

```
src/
├── config/               # Configuration files
├── types/                # TypeScript types & interfaces
├── middleware/           # Express middleware
├── utils/                # Utility functions
├── constants/            # App-wide constants
├── modules/              # Feature modules (each with controller, service, repository)
├── engines/              # AI systems (conversation, memory, relationship, etc.)
├── services/             # Cross-cutting services
├── events/               # Event-driven architecture
└── index.ts              # Application entry point

prisma/
├── schema.prisma         # Database schema
└── migrations/           # Database migrations

tests/
├── setup.ts              # Test configuration
├── fixtures/             # Test data
├── mocks/                # Mock implementations
└── helpers/              # Test utilities
```

See `docs/ARCHITECTURE.md` for detailed architecture documentation.

## Development Workflow

1. **Create a feature branch:** `git checkout -b feature/your-feature`
2. **Make changes:** Edit code in `src/`
3. **Run tests:** `npm run test:watch`
4. **Check code quality:** `npm run lint` and `npm run format:check`
5. **Commit:** `git commit -m "Description of changes"`
6. **Push:** `git push origin feature/your-feature`
7. **Create Pull Request** for code review

## Docker Deployment

### Development Setup

```bash
# Start all services with development settings
docker-compose up
```

### Production Build

```bash
# Build production image
docker build -t featherlight-backend:latest .

# Run production container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  featherlight-backend:latest
```

## Database Management

### Create Migration

```bash
npx prisma migrate dev --name "description"
```

### View Database GUI

```bash
npm run db:studio
```

### Reset Database (Development Only)

```bash
npm run db:reset
```

## Logging

Application uses Pino for structured logging:

```typescript
import { logger } from '@utils/logger';

logger.info('Message', { context: 'data' });
logger.error('Error', { error: err });
```

Adjust log level with `LOG_LEVEL` environment variable:
- `debug` - Development
- `info` - Production
- `warn` - Only warnings
- `error` - Only errors

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests are located alongside source code: `src/modules/[feature]/__tests__/`

## Environment Variables

See `.env.example` for complete list. Critical variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `AWS_REGION` - AWS region for S3
- `JWT_SECRET` - Secret for JWT signing
- `OPENAI_API_KEY` - OpenAI API key

## Monitoring & Health

Health check endpoint: `GET /health`

```bash
npm run health-check
```

## Contributing

1. Read `docs/CONTRIBUTING.md`
2. Follow code style (ESLint + Prettier)
3. Write tests for new features
4. Update documentation

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Error

```bash
# Verify PostgreSQL is running
docker-compose ps

# Check connection string in .env.local
# Format: postgresql://user:password@host:port/database
```

### Redis Connection Error

```bash
# Verify Redis is running
docker-compose ps

# Test connection
redis-cli ping
```

## Support

- Documentation: See `docs/` directory
- Issues: Create GitHub issue with detailed description
- Questions: Check existing documentation first

## License

Proprietary - Featherlight Team
