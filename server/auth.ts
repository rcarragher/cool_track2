import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Session configuration
export const SESSION_CONFIG = {
  maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800000'), // 7 days default
  secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
  name: 'sessionId',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800000')
  }
};

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Session utilities
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function createUserSession(userId: number, expiresInMs: number = SESSION_CONFIG.maxAge): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + expiresInMs);
  
  const sessionData = {
    userId,
    createdAt: new Date(),
    lastAccessed: new Date()
  };

  await storage.createSession({
    id: sessionId,
    userId,
    data: JSON.stringify(sessionData),
    expiresAt
  });

  return sessionId;
}

export async function getUserFromSession(sessionId: string): Promise<User | null> {
  if (!sessionId) return null;

  try {
    const session = await storage.getSession(sessionId);
    if (!session) return null;

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await storage.deleteSession(sessionId);
      return null;
    }

    // Get user data
    const user = await storage.getUserById(session.userId);
    if (!user) {
      // User was deleted, clean up session
      await storage.deleteSession(sessionId);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

export async function destroyUserSession(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  
  try {
    return await storage.deleteSession(sessionId);
  } catch (error) {
    console.error('Error destroying user session:', error);
    return false;
  }
}

export async function destroyAllUserSessions(userId: number): Promise<number> {
  try {
    return await storage.deleteUserSessions(userId);
  } catch (error) {
    console.error('Error destroying all user sessions:', error);
    return 0;
  }
}

// Authentication middleware
export interface AuthenticatedRequest extends Request {
  user?: User;
  session: any;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sessionId = req.session?.sessionId || req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    const user = await getUserFromSession(sessionId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid session',
        message: 'Your session has expired. Please log in again.'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
}

// Optional authentication middleware (doesn't fail if no auth)
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sessionId = req.session?.sessionId || req.headers.authorization?.replace('Bearer ', '');
    
    if (sessionId) {
      const user = await getUserFromSession(sessionId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    // Don't fail on optional auth errors
    next();
  }
}

// Role-based authorization middleware
export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    if (!roles.includes(req.user.role || 'member')) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
}

// Admin-only middleware
export const requireAdmin = requireRole(['admin']);

// Utility to get current user's household ID
export function getCurrentHouseholdId(req: AuthenticatedRequest): number {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return req.user.householdId;
}

// Cleanup expired sessions (should be run periodically)
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    return await storage.cleanupExpiredSessions();
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return 0;
  }
}

// Validate password strength
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Rate limiting helpers
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export function checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = new Date();
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if window has passed
  if (now.getTime() - attempts.lastAttempt.getTime() > windowMs) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  if (attempts.count >= maxAttempts) {
    return false;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

export function resetRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}