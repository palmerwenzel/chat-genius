# ChatGenius Development Guide

## Prerequisites

- Node.js >= 18
- npm
- Docker Desktop
- Git

## Initial Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Initialize Supabase:
```bash
npx supabase init
npx supabase start
```

After `supabase start` completes, it will output credentials. Update your `.env` file with these values.

## Daily Development

1. Start all services:
```bash
# Start Supabase (required for database/auth)
npx supabase start

# Start Next.js development server
npm run dev

# Start Storybook (optional, for UI development)
npm run storybook
```

2. Run tests:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test path/to/test
```

## Database Development

When working with the database:

```bash
# Apply migrations and seed data
npx supabase db reset

# Generate types from database schema
npx supabase gen types typescript --local > src/types/supabase.ts

# If Supabase services get stuck
npx supabase stop
npx supabase start
```

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run storybook` - Start Storybook for UI development
- `npm run build-storybook` - Build Storybook for deployment
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
app/
├── src/
│   ├── app/          # Next.js pages and layouts
│   ├── components/   # React components
│   ├── lib/          # Utilities and configurations
│   ├── services/     # API and external service integrations
│   ├── stores/       # State management
│   └── types/        # TypeScript type definitions
├── supabase/
│   ├── migrations/   # Database migrations
│   └── seed.sql      # Seed data
├── .storybook/       # Storybook configuration
└── public/           # Static assets
```

## Testing Strategy

1. **Unit Tests** (`src/**/__tests__/*.test.ts`)
   - Component tests with React Testing Library
   - Store tests with Vitest
   - Service mocking

2. **UI Component Tests** (Storybook)
   - Visual testing
   - Component interaction testing
   - Responsive design testing

3. **Integration Tests**
   - API route testing
   - Database interaction testing
   - Authentication flow testing

## Testing

### Database Integration Tests

We use Vitest for integration testing against a local Supabase instance. Tests verify:
- Database schema integrity
- Row Level Security (RLS) policies
- User authentication flows
- Channel access controls
- Message permissions
- Concurrent user scenarios

To run tests:
```bash
npm test
```

Each test:
- Runs against a real database instance
- Creates temporary test data
- Cleans up after completion
- Verifies security policies
- Tests cross-user interactions

### Test Structure

```typescript
// Database schema and RLS tests
src/__tests__/database.test.ts  // Core database functionality tests
src/__tests__/setup.ts         // Test environment setup

// Configuration
vitest.config.ts              // Test runner configuration
```

### Best Practices

1. **Test Data Management**:
   - Use unique identifiers for test data
   - Clean up after tests complete
   - Don't rely on existing data

2. **Security Testing**:
   - Test both positive and negative cases
   - Verify RLS policies
   - Test cross-user interactions

3. **Test Independence**:
   - Each test should be self-contained
   - Don't share state between tests
   - Reset database state between test runs

## Common Issues

### Supabase Issues

1. **Services Won't Start**
   ```bash
   npx supabase stop
   docker container prune  # Remove stopped containers
   npx supabase start
   ```

2. **Database Reset Fails**
   ```bash
   npx supabase db reset --force
   ```

### Next.js Issues

1. **Build Cache Issues**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run dev
   ```

2. **Type Generation Issues**
   ```bash
   # Regenerate Supabase types
   npx supabase gen types typescript --local > src/types/supabase.ts
   ```

## Git Workflow

1. Create feature branch
2. Make changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Create pull request

## Environment Variables

Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (for AI features)

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy database changes:
```bash
npx supabase db push
```

3. Deploy to hosting platform of choice (Vercel recommended for Next.js) 