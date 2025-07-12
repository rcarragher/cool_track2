# Test Infrastructure

This directory contains the comprehensive test suite for the inventory management application.

## Structure

- `setup/` - Test configuration and database utilities
- `unit/` - Component and utility function tests  
- `integration/` - API and database integration tests
- `e2e/` - End-to-end browser tests (future)

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI/CD)
npm run test:run

# Run with UI interface
npm run test:ui

# Run with coverage report
npm run test:coverage

# Run specific test file
npm run test:run tests/unit/sample-data.test.ts
```

## Test Database

Integration tests require a PostgreSQL database. The tests will:

1. Use `TEST_DATABASE_URL` if available
2. Fall back to `DATABASE_URL` from .env file
3. Clear and seed data before each test suite

**Warning**: Tests will clear all data in the connected database!

## Writing Tests

### Unit Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should render correctly', () => {
    // Test implementation
  });
});
```

### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const TestWrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);
```

### API Tests
```typescript
import request from 'supertest';
import { clearTestDatabase, seedTestDevices } from '../setup/test-db';

beforeEach(async () => {
  await clearTestDatabase();
  await seedTestDevices();
});
```

## Coverage

Current test coverage includes:
- ✅ Sample data generation logic
- ✅ Utility functions (date handling, formatting)
- ✅ Mock component rendering and interactions
- ✅ API endpoints (devices, inventory, settings)
- ✅ Database operations

## Stack

- **Vitest** - Test runner with TypeScript support
- **Testing Library** - Component testing utilities
- **Supertest** - HTTP API testing
- **jsdom** - DOM environment for component tests