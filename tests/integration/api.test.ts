import { describe, it, expect, beforeEach, afterAll, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { mockAuthModule, restoreAuthModule, mockUser } from '../helpers/auth-mock';
import { clearTestDatabase, seedTestDevices, seedTestSettings, closeTestDatabase } from '../setup/test-db';

let app: express.Application;
let server: any;
let testDevices: any[];

beforeAll(async () => {
  // Mock authentication before importing routes
  mockAuthModule();
});

afterAll(async () => {
  restoreAuthModule();
  await closeTestDatabase();
});

// Setup test server
beforeEach(async () => {
  // Create fresh app instance for each test
  app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Add session middleware for authentication context
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  }));

  // Import routes after mocking auth
  const { registerRoutes } = await import('@server/routes');
  server = await registerRoutes(app);
  
  await clearTestDatabase();
  testDevices = await seedTestDevices();
  await seedTestSettings();
});

describe('Devices API', () => {
  it('should get all devices', async () => {
    const response = await request(app)
      .get('/api/devices')
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({
      name: 'Test Refrigerator',
      type: 'refrigerator'
    });
  });

  it('should create a new device', async () => {
    const newDevice = {
      name: 'Mini Fridge',
      type: 'refrigerator'
    };

    const response = await request(app)
      .post('/api/devices')
      .send(newDevice)
      .expect(200);

    expect(response.body).toMatchObject({
      name: 'Mini Fridge',
      type: 'refrigerator'
    });
    expect(response.body.id).toBeDefined();
  });

  it('should validate device data', async () => {
    const invalidDevice = {
      // Missing required fields should fail validation
    };

    const response = await request(app)
      .post('/api/devices')
      .send(invalidDevice)
      .expect(400);
      
    expect(response.body.message).toContain('Invalid');
  });

  it('should update a device', async () => {
    const deviceId = testDevices[0].id;
    const updateData = {
      id: deviceId, // Include ID for update validation
      name: 'Updated Refrigerator'
    };

    const response = await request(app)
      .put(`/api/devices/${deviceId}`)
      .send(updateData);

    if (response.status !== 200) {
      console.log('Update device error:', response.body);
    }
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Refrigerator');
  });

  it('should delete a device', async () => {
    const deviceId = testDevices[0].id;
    const deleteResponse = await request(app)
      .delete(`/api/devices/${deviceId}`);

    if (deleteResponse.status !== 200) {
      console.log('Delete device error:', deleteResponse.body);
    }
    
    expect(deleteResponse.status).toBe(200);

    // Verify device is deleted
    const getResponse = await request(app)
      .get('/api/devices')
      .expect(200);

    expect(getResponse.body).toHaveLength(1);
  });
});

describe('Inventory API', () => {
  it('should get empty inventory initially', async () => {
    const response = await request(app)
      .get('/api/inventory')
      .expect(200);

    expect(response.body).toHaveLength(0);
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      // Create multiple test items for pagination testing
      const testItems = [
        { name: 'Apple', category: 'fruit-veg', quantity: '5 pieces', deviceId: testDevices[0].id, dateAdded: '2025-07-10' },
        { name: 'Banana', category: 'fruit-veg', quantity: '6 pieces', deviceId: testDevices[0].id, dateAdded: '2025-07-11' },
        { name: 'Chicken Breast', category: 'meat', quantity: '1 lb', deviceId: testDevices[1].id, dateAdded: '2025-07-12' },
        { name: 'Cocktail Mix', category: 'cocktail', quantity: '1 bottle', deviceId: testDevices[0].id, dateAdded: '2025-07-13' },
        { name: 'Leftovers', category: 'prepared', quantity: '1 container', deviceId: testDevices[0].id, dateAdded: '2025-07-14' },
      ];

      for (const item of testItems) {
        await request(app)
          .post('/api/inventory')
          .send(item);
      }
    });

    it('should return paginated results when limit is specified', async () => {
      const response = await request(app)
        .get('/api/inventory?page=1&limit=2')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.items).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNext: true,
        hasPrev: false
      });
    });

    it('should return second page correctly', async () => {
      const response = await request(app)
        .get('/api/inventory?page=2&limit=2')
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNext: true,
        hasPrev: true
      });
    });

    it('should return last page correctly', async () => {
      const response = await request(app)
        .get('/api/inventory?page=3&limit=2')
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.pagination).toMatchObject({
        page: 3,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNext: false,
        hasPrev: true
      });
    });

    it('should maintain backward compatibility without pagination params', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(5);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).not.toHaveProperty('pagination');
    });

    it('should filter by search term', async () => {
      const response = await request(app)
        .get('/api/inventory?search=apple')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].name).toBe('Apple');
      expect(response.body.pagination.total).toBe(1);
    });

    it('should filter by category in search', async () => {
      const response = await request(app)
        .get('/api/inventory?search=fruit')
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.items.every((item: any) => item.category === 'fruit-veg')).toBe(true);
    });

    it('should filter by device ID', async () => {
      const response = await request(app)
        .get(`/api/inventory?deviceId=${testDevices[1].id}`)
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].name).toBe('Chicken Breast');
      expect(response.body.pagination.total).toBe(1);
    });

    it('should combine search and device filtering', async () => {
      const response = await request(app)
        .get(`/api/inventory?search=fruit&deviceId=${testDevices[0].id}`)
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.items.every((item: any) => 
        item.category === 'fruit-veg' && item.deviceId === testDevices[0].id
      )).toBe(true);
    });

    it('should return items sorted by dateAdded descending', async () => {
      const response = await request(app)
        .get('/api/inventory?limit=5')
        .expect(200);

      const dates = response.body.items.map((item: any) => new Date(item.dateAdded));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
      }
    });

    it('should handle page beyond total pages', async () => {
      const response = await request(app)
        .get('/api/inventory?page=10&limit=2')
        .expect(200);

      expect(response.body.items).toHaveLength(0);
      expect(response.body.pagination).toMatchObject({
        page: 10,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNext: false,
        hasPrev: true
      });
    });

    it('should handle zero limit gracefully', async () => {
      const response = await request(app)
        .get('/api/inventory?limit=0')
        .expect(200);

      expect(response.body.items).toHaveLength(5); // Should return all items
      expect(response.body.pagination.limit).toBe(5); // Should be set to total when limit is 0
    });
  });

  it('should create a new inventory item', async () => {
    const newItem = {
      name: 'Test Apple',
      category: 'fruit-veg',
      quantity: '5 pieces',
      deviceId: testDevices[0].id,
      dateAdded: '2025-07-12',
      expirationDate: '2025-07-19'
    };

    const response = await request(app)
      .post('/api/inventory')
      .send(newItem)
      .expect(200);

    expect(response.body).toMatchObject(newItem);
    expect(response.body.id).toBeDefined();
  });

  it('should validate inventory item data', async () => {
    const invalidItem = {
      name: '', // Empty name
      category: 'invalid-category',
      quantity: '',
      deviceId: 999, // Non-existent device
    };

    await request(app)
      .post('/api/inventory')
      .send(invalidItem)
      .expect(400);
  });

  it('should update an inventory item', async () => {
    // First create an item
    const newItem = {
      name: 'Test Banana',
      category: 'fruit-veg',
      quantity: '6 pieces',
      deviceId: testDevices[0].id,
      dateAdded: '2025-07-12',
      expirationDate: '2025-07-15'
    };

    const createResponse = await request(app)
      .post('/api/inventory')
      .send(newItem)
      .expect(200);

    const itemId = createResponse.body.id;

    // Update the item
    const updateData = {
      id: itemId, // Include ID for update validation
      quantity: '3 pieces',
      expirationDate: '2025-07-16'
    };

    const response = await request(app)
      .put(`/api/inventory/${itemId}`)
      .send(updateData);

    if (response.status !== 200) {
      console.log('Update inventory error:', response.body);
    }
    
    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe('3 pieces');
    expect(response.body.expirationDate).toBe('2025-07-16');
  });

  it('should delete an inventory item', async () => {
    // First create an item
    const newItem = {
      name: 'Test Orange',
      category: 'fruit-veg',
      quantity: '3 pieces',
      deviceId: testDevices[0].id,
      dateAdded: '2025-07-12',
      expirationDate: '2025-07-18'
    };

    const createResponse = await request(app)
      .post('/api/inventory')
      .send(newItem)
      .expect(200);

    const itemId = createResponse.body.id;

    // Delete the item
    const deleteResponse = await request(app)
      .delete(`/api/inventory/${itemId}`);
      
    if (deleteResponse.status !== 200) {
      console.log('Delete inventory error:', deleteResponse.body);
    }
    
    expect(deleteResponse.status).toBe(200);

    // Verify item is deleted
    const getResponse = await request(app)
      .get('/api/inventory')
      .expect(200);

    expect(getResponse.body).toHaveLength(0);
  });
});

describe('Settings API', () => {
  it('should get all settings', async () => {
    const response = await request(app)
      .get('/api/settings')
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body.find((s: any) => s.key === 'defaultItemsToShow')).toBeDefined();
  });

  it('should create or update a setting', async () => {
    const newSetting = {
      key: 'testSetting',
      value: 'testValue'
    };

    const response = await request(app)
      .post('/api/settings')
      .send(newSetting)
      .expect(200);

    expect(response.body).toMatchObject(newSetting);
  });

  it('should handle setting updates', async () => {
    // First create a setting
    const setting = {
      key: 'updateTest',
      value: 'originalValue'
    };

    await request(app)
      .post('/api/settings')
      .send(setting)
      .expect(200);

    // Update the setting
    const updatedSetting = {
      key: 'updateTest',
      value: 'updatedValue'
    };

    const response = await request(app)
      .post('/api/settings')
      .send(updatedSetting)
      .expect(200);

    expect(response.body.value).toBe('updatedValue');
  });
});