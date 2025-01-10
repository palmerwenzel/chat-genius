import { jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as Response)
);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock Next.js server components
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
  }),
}));

// Reset mocks before each test
beforeEach(() => {
  jest.resetAllMocks();
}); 