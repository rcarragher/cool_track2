import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { devices, inventoryItems, settings } from "@shared/schema";

// Test database configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL environment variable is required for tests. Run 'npm run test:db:setup' first.");
}

// Safety check to prevent running tests against production
if (TEST_DATABASE_URL.includes('neon.tech') || 
    TEST_DATABASE_URL.includes('prod') || 
    TEST_DATABASE_URL.includes('production') ||
    (!TEST_DATABASE_URL.includes('test') && !TEST_DATABASE_URL.includes('localhost'))) {
  throw new Error("🚨 Tests cannot run against production database! Use a test database.");
}

// Create a separate connection for tests
const testSql = postgres(TEST_DATABASE_URL, {
  max: 1, // Limit connections for tests
  idle_timeout: 1,
  max_lifetime: 60,
});

export const testDb = drizzle(testSql);

// Utility functions for test database management
export async function clearTestDatabase() {
  try {
    // Clear tables in correct order (respecting foreign keys)
    await testDb.delete(inventoryItems);
    await testDb.delete(devices);
    await testDb.delete(settings);
  } catch (error) {
    console.error("Error clearing test database:", error);
    throw error;
  }
}

export async function seedTestDevices() {
  const testDevices = [
    { name: "Test Refrigerator", type: "refrigerator" },
    { name: "Test Freezer", type: "freezer" },
  ];

  const insertedDevices = [];
  for (const device of testDevices) {
    const result = await testDb.insert(devices).values(device).returning();
    insertedDevices.push(result[0]);
  }

  return insertedDevices;
}

export async function seedTestSettings() {
  const testSettings = [
    { key: "defaultItemsToShow", value: "10" },
    { key: "expirationWarningDays", value: "3" },
  ];

  const insertedSettings = [];
  for (const setting of testSettings) {
    const result = await testDb.insert(settings).values(setting).returning();
    insertedSettings.push(result[0]);
  }

  return insertedSettings;
}

// Close the test database connection
export async function closeTestDatabase() {
  await testSql.end();
}