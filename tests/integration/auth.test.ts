import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { registerAuthRoutes } from '../../server/auth-routes';
import { SESSION_CONFIG } from '../../server/auth';
import { clearTestDatabase, ensureTestHousehold, closeTestDatabase } from '../setup/test-db';

describe('Authentication API', () => {
  let app: express.Application;

  beforeEach(async () => {
    // Setup test database
    await clearTestDatabase();
    await ensureTestHousehold();

    // Create test app with authentication routes
    app = express();
    app.use(express.json());
    
    // Configure session for testing with in-memory store
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: true, // Save uninitialized sessions for testing
      cookie: {
        secure: false, // Allow non-HTTPS for testing
        httpOnly: false, // Allow client-side access for testing
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

    registerAuthRoutes(app);
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test1@example.com',
        password: 'TestPassword123!',
        householdName: 'Test Household'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        user: {
          email: 'test1@example.com',
          role: 'admin',
          emailVerified: false
        },
        sessionId: expect.any(String),
        message: 'Registration successful'
      });

      // Password hash should not be returned
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('should reject weak passwords', async () => {
      const userData = {
        email: 'test2@example.com',
        password: 'weak', // Too weak
        householdName: 'Test Household'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('should reject invalid email addresses', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        householdName: 'Test Household'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });

    it('should reject duplicate email addresses', async () => {
      const userData = {
        email: 'test4@example.com',
        password: 'TestPassword123!',
        householdName: 'Test Household'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('User already exists');
    });

    it('should use default household when householdName is not provided', async () => {
      const userData = {
        email: 'test5@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.householdId).toBe(1); // Default household
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const userData = {
        email: 'login-test@example.com',
        password: 'TestPassword123!',
        householdName: 'Test Household'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        user: {
          email: 'login-test@example.com',
          role: 'admin'
        },
        sessionId: expect.any(String),
        message: 'Login successful'
      });

      // Password hash should not be returned
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('should reject invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject malformed requests', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /api/auth/me', () => {
    let sessionCookie: string;

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        email: 'login-test@example.com',
        password: 'TestPassword123!',
        householdName: 'Test Household'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123!'
        });

      sessionCookie = loginResponse.headers['set-cookie']?.[0] || '';
    });

    it('should return current user info when authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.user).toMatchObject({
        email: 'login-test@example.com',
        role: 'admin',
        emailVerified: false
      });

      // Password hash should not be returned
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('No session found');
    });
  });

  describe('POST /api/auth/logout', () => {
    let sessionCookie: string;

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        email: 'login-test@example.com',
        password: 'TestPassword123!',
        householdName: 'Test Household'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123!'
        });

      sessionCookie = loginResponse.headers['set-cookie']?.[0] || '';
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');

      // Verify session is destroyed by trying to access protected endpoint
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie)
        .expect(401);
    });

    it('should handle logout without session gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('POST /api/auth/logout-all', () => {
    let sessionCookie: string;

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        email: 'login-test@example.com',
        password: 'TestPassword123!',
        householdName: 'Test Household'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123!'
        });

      sessionCookie = loginResponse.headers['set-cookie']?.[0] || '';
    });

    it('should logout all sessions successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.message).toBe('All sessions logged out successfully');
      expect(response.body.destroyedSessions).toBeGreaterThanOrEqual(1);

      // Verify session is destroyed
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie)
        .expect(401);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .expect(401);

      expect(response.body.error).toBe('No session found');
    });
  });

  describe('POST /api/auth/change-password', () => {
    let sessionCookie: string;

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        email: 'change-password-test@example.com',
        password: 'TestPassword123!',
        householdName: 'Test Household'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'change-password-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      // Extract session cookie from login response
      const cookies = loginResponse.headers['set-cookie'];
      sessionCookie = cookies ? cookies.find(cookie => cookie.startsWith('connect.sid=')) || '' : '';
      
      if (!sessionCookie) {
        throw new Error('Failed to get session cookie from login response');
      }
    });

    it('should change password successfully', async () => {
      const changePasswordData = {
        currentPassword: 'TestPassword123!',
        newPassword: 'NewTestPassword456!'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', sessionCookie)
        .send(changePasswordData)
        .expect(200);

      expect(response.body.message).toBe('Password changed successfully');
      expect(response.body.sessionId).toBeDefined();

      // Verify old password no longer works
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'change-password-test@example.com',
          password: 'TestPassword123!' // Old password
        })
        .expect(401);

      // Verify new password works
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'change-password-test@example.com',
          password: 'NewTestPassword456!' // New password
        })
        .expect(200);
    });

    it('should reject incorrect current password', async () => {
      const changePasswordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewTestPassword456!'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', sessionCookie)
        .send(changePasswordData)
        .expect(401);

      expect(response.body.error).toBe('Invalid current password');
    });

    it('should reject weak new passwords', async () => {
      const changePasswordData = {
        currentPassword: 'TestPassword123!',
        newPassword: 'weak' // Too weak
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', sessionCookie)
        .send(changePasswordData)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toBeInstanceOf(Array);
    });

    it('should reject unauthenticated requests', async () => {
      const changePasswordData = {
        currentPassword: 'TestPassword123!',
        newPassword: 'NewTestPassword456!'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .send(changePasswordData)
        .expect(401);

      expect(response.body.error).toBe('No session found');
    });
  });
});