import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '@server/routes';
import { clearTestDatabase, seedTestDevices, seedTestSettings, closeTestDatabase } from '../setup/test-db';

// Create test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let server: any;
let testDevices: any[];

// Setup test server
beforeEach(async () => {
  server = await registerRoutes(app);
  await clearTestDatabase();
  testDevices = await seedTestDevices();
  await seedTestSettings();
});

afterAll(async () => {
  await closeTestDatabase();
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