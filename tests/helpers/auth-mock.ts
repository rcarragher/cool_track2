import { vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../server/auth';

// Mock user for testing
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  householdId: 1,
  role: 'admin' as const,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock session for testing
export const mockSession = {
  id: 'mock-session-id',
  userId: 1,
  data: JSON.stringify({ userId: 1 }),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  createdAt: new Date()
};

/**
 * Mock authentication middleware that adds a mock user to requests
 */
export function mockAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  req.user = mockUser;
  next();
}

/**
 * Mock the auth module to bypass authentication in tests
 */
export function mockAuthModule() {
  // Mock the auth module
  vi.doMock('../../server/auth', async () => {
    const actual = await vi.importActual('../../server/auth');
    return {
      ...actual,
      requireAuth: mockAuthMiddleware,
      optionalAuth: mockAuthMiddleware,
      getCurrentHouseholdId: (req: AuthenticatedRequest) => {
        if (!req.user) throw new Error('User not authenticated');
        return req.user.householdId;
      },
      // Keep other auth utilities unchanged for auth-specific tests
      hashPassword: actual.hashPassword,
      verifyPassword: actual.verifyPassword,
      createUserSession: actual.createUserSession,
      destroyUserSession: actual.destroyUserSession,
      destroyAllUserSessions: actual.destroyAllUserSessions,
      validatePassword: actual.validatePassword,
      checkRateLimit: actual.checkRateLimit,
      resetRateLimit: actual.resetRateLimit,
      cleanupExpiredSessions: actual.cleanupExpiredSessions,
      SESSION_CONFIG: actual.SESSION_CONFIG
    };
  });
}

/**
 * Create a request with authentication headers for testing
 */
export function createAuthenticatedRequest() {
  return {
    headers: {
      authorization: `Bearer ${mockSession.id}`,
      'content-type': 'application/json'
    }
  };
}

/**
 * Restore the original auth module after mocking
 */
export function restoreAuthModule() {
  vi.doUnmock('../../server/auth');
}