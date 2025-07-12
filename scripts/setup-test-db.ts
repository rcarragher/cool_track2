#!/usr/bin/env tsx
import postgres from 'postgres';

const TEST_DB_NAME = 'cool_track_test';
const DB_USER = 'postgres';
const DB_HOST = 'localhost';
const DB_PORT = 5432;
const DB_PASSWORD = 'password';

async function setupTestDatabase() {
  console.log('🗃️  Setting up test database...');

  // Test connection to main postgres database
  let mainSql: any;
  try {
    mainSql = postgres({
      host: DB_HOST,
      port: DB_PORT,
      username: DB_USER,
      password: DB_PASSWORD,
      database: 'postgres', // Connect to default postgres database
      max: 1,
    });
    
    await mainSql`SELECT 1`;
    console.log('✅ PostgreSQL connection successful');
  } catch (error: any) {
    console.error('❌ Could not connect to PostgreSQL:', error.message);
    console.log('💡 Please ensure PostgreSQL is running and credentials are correct');
    process.exit(1);
  }

  try {
    // Drop test database if it exists
    console.log(`🗑️  Dropping existing test database if it exists...`);
    await mainSql.unsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
    
    // Create test database
    console.log(`🆕 Creating test database: ${TEST_DB_NAME}`);
    await mainSql.unsafe(`CREATE DATABASE "${TEST_DB_NAME}"`);
    
    console.log('✅ Test database created successfully');
    
    // Set up environment variable
    const testDatabaseUrl = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${TEST_DB_NAME}`;
    console.log('🔧 Test database URL:', testDatabaseUrl);
    console.log('');
    console.log('✅ .env.test file already configured');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. npm run db:push:test  # Apply schema to test database');
    console.log('2. npm run test         # Run tests with isolated database');
    
  } catch (error: any) {
    console.error('❌ Failed to setup test database:', error.message);
    process.exit(1);
  } finally {
    await mainSql?.end();
  }
}

async function teardownTestDatabase() {
  console.log('🗑️  Tearing down test database...');
  
  let mainSql: any;
  try {
    mainSql = postgres({
      host: DB_HOST,
      port: DB_PORT,
      username: DB_USER,
      password: DB_PASSWORD,
      database: 'postgres',
      max: 1,
    });
    
    await mainSql.unsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
    console.log('✅ Test database removed successfully');
  } catch (error: any) {
    console.error('❌ Failed to teardown test database:', error.message);
    process.exit(1);
  } finally {
    await mainSql?.end();
  }
}

// Handle command line arguments
const command = process.argv[2];

if (command === 'teardown') {
  teardownTestDatabase();
} else {
  setupTestDatabase();
}