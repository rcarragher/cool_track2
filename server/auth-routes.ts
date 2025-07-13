import type { Express } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import {
  hashPassword,
  verifyPassword,
  createUserSession,
  destroyUserSession,
  destroyAllUserSessions,
  validatePassword,
  checkRateLimit,
  resetRateLimit,
  getCurrentHouseholdId,
  type AuthenticatedRequest
} from './auth';

// Extend session interface to include sessionId
declare module 'express-session' {
  interface SessionData {
    sessionId?: string;
  }
}

// Request schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  householdName: z.string().min(1, 'Household name is required').optional(),
  name: z.string().min(1, 'Name is required').optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Response schemas
const userResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  role: z.string(),
  householdId: z.number(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export function registerAuthRoutes(app: Express) {
  
  // User registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Rate limiting
      if (!checkRateLimit(`register:${clientIp}`, 3, 15 * 60 * 1000)) { // 3 attempts per 15 minutes
        return res.status(429).json({
          error: 'Too many registration attempts',
          message: 'Please wait 15 minutes before trying again'
        });
      }

      const { email, password, householdName, name } = registerSchema.parse(req.body);

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          error: 'Password validation failed',
          message: 'Password does not meet security requirements',
          details: passwordValidation.errors
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email address already exists'
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create household if provided, otherwise use default
      let householdId = 1; // Default household
      if (householdName) {
        const household = await storage.createHousehold({
          name: householdName
        });
        householdId = household.id;
      }

      // Create user
      const userData = {
        email,
        passwordHash,
        householdId,
        role: 'admin' as const, // First user in household is admin
        emailVerified: false
      };

      const user = await storage.createUser(userData);

      // Create session
      const sessionId = await createUserSession(user.id);

      // Store session ID in session
      req.session.sessionId = sessionId;

      // Reset rate limit on successful registration
      resetRateLimit(`register:${clientIp}`);

      // Return user data (excluding password hash)
      const { passwordHash: _, ...userResponse } = user;
      res.status(201).json({
        user: userResponse,
        sessionId,
        message: 'Registration successful'
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid registration data',
          details: error.errors
        });
      }

      res.status(500).json({
        error: 'Registration failed',
        message: 'An error occurred during registration'
      });
    }
  });

  // User login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Rate limiting
      if (!checkRateLimit(`login:${clientIp}`, 5, 15 * 60 * 1000)) { // 5 attempts per 15 minutes
        return res.status(429).json({
          error: 'Too many login attempts',
          message: 'Please wait 15 minutes before trying again'
        });
      }

      const { email, password } = loginSchema.parse(req.body);

      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Create session
      const sessionId = await createUserSession(user.id);

      // Store session ID in session
      req.session.sessionId = sessionId;

      // Reset rate limit on successful login
      resetRateLimit(`login:${clientIp}`);

      // Return user data (excluding password hash)
      const { passwordHash: _, ...userResponse } = user;
      res.json({
        user: userResponse,
        sessionId,
        message: 'Login successful'
      });

    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid login data',
          details: error.errors
        });
      }

      res.status(500).json({
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  });

  // User logout
  app.post('/api/auth/logout', async (req, res) => {
    try {
      const sessionId = req.session?.sessionId;
      
      if (sessionId) {
        await destroyUserSession(sessionId);
      }

      // Destroy express session
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });

      res.json({ message: 'Logout successful' });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  });

  // Get current user info
  app.get('/api/auth/me', async (req: AuthenticatedRequest, res) => {
    try {
      const sessionId = req.session?.sessionId || req.headers.authorization?.replace('Bearer ', '');
      
      if (!sessionId) {
        return res.status(401).json({
          error: 'No session found',
          message: 'Please log in to access this resource'
        });
      }

      const user = await storage.getUserFromSession(sessionId);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid session',
          message: 'Your session has expired. Please log in again.'
        });
      }

      // Return user data (excluding password hash)
      const { passwordHash: _, ...userResponse } = user;
      res.json({ user: userResponse });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: 'Failed to get user',
        message: 'An error occurred while retrieving user information'
      });
    }
  });

  // Logout all sessions (for security)
  app.post('/api/auth/logout-all', async (req: AuthenticatedRequest, res) => {
    try {
      const sessionId = req.session?.sessionId;
      
      if (!sessionId) {
        return res.status(401).json({
          error: 'No session found',
          message: 'Please log in to access this resource'
        });
      }

      const user = await storage.getUserFromSession(sessionId);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid session',
          message: 'Your session has expired. Please log in again.'
        });
      }

      // Destroy all user sessions
      const destroyedCount = await destroyAllUserSessions(user.id);

      // Destroy current express session
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });

      res.json({
        message: 'All sessions logged out successfully',
        destroyedSessions: destroyedCount
      });

    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({
        error: 'Logout all failed',
        message: 'An error occurred during logout'
      });
    }
  });

  // Change password
  app.post('/api/auth/change-password', async (req: AuthenticatedRequest, res) => {
    try {
      const sessionId = req.session?.sessionId;
      
      if (!sessionId) {
        return res.status(401).json({
          error: 'No session found',
          message: 'Please log in to access this resource'
        });
      }

      const user = await storage.getUserFromSession(sessionId);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid session',
          message: 'Your session has expired. Please log in again.'
        });
      }

      const changePasswordSchema = z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters')
      });

      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

      // Verify current password
      const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid current password',
          message: 'The current password you entered is incorrect'
        });
      }

      // Validate new password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          error: 'Password validation failed',
          message: 'New password does not meet security requirements',
          details: passwordValidation.errors
        });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update user password
      await storage.updateUserPassword(user.id, newPasswordHash);

      // Destroy all other sessions for security
      await destroyAllUserSessions(user.id);

      // Create new session
      const newSessionId = await createUserSession(user.id);
      req.session.sessionId = newSessionId;

      res.json({
        message: 'Password changed successfully',
        sessionId: newSessionId
      });

    } catch (error) {
      console.error('Change password error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid password change data',
          details: error.errors
        });
      }

      res.status(500).json({
        error: 'Password change failed',
        message: 'An error occurred while changing password'
      });
    }
  });
}