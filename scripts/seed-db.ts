import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { devices, inventoryItems, settings, households, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import generateSampleData from "./sample-data";
import { hashPassword } from "../server/auth";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  console.error("💡 Make sure you have a .env file with DATABASE_URL set");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

async function clearDatabase() {
  console.log("🗑️  Clearing existing data...");
  
  try {
    // Clear tables in correct order (respecting foreign keys)
    await db.delete(inventoryItems);
    await db.delete(devices);
    await db.delete(settings);
    await db.delete(users);
    // Note: Keep households for reference, they'll be recreated if needed
    
    console.log("✅ Database cleared successfully");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    throw error;
  }
}

async function ensureDefaultHousehold() {
  console.log("🏠 Ensuring default household exists...");
  
  try {
    // Check if default household exists
    const existingHouseholds = await db.select().from(households).limit(1);
    
    if (existingHouseholds.length === 0) {
      const result = await db.insert(households).values({
        name: "Demo Household"
      }).returning();
      console.log("✅ Created default household");
      return result[0];
    }
    
    console.log("✅ Default household already exists");
    return existingHouseholds[0];
  } catch (error) {
    console.error("❌ Error ensuring default household:", error);
    throw error;
  }
}

async function seedDemoUser(householdId: number) {
  console.log("👤 Creating demo user...");
  
  try {
    // Check if demo user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, "user@example.com")).limit(1);
    
    if (existingUser.length === 0) {
      // Create demo user with easy-to-remember credentials
      const passwordHash = await hashPassword("demo123");
      
      const result = await db.insert(users).values({
        email: "user@example.com",
        passwordHash,
        householdId,
        role: "admin",
        emailVerified: true
      }).returning();
      
      console.log("✅ Created demo user:");
      console.log("   📧 Email: user@example.com");
      console.log("   🔑 Password: demo123");
      console.log("   👑 Role: admin");
      return result[0];
    }
    
    console.log("✅ Demo user already exists");
    console.log("   📧 Email: user@example.com");
    console.log("   🔑 Password: demo123");
    return existingUser[0];
  } catch (error) {
    console.error("❌ Error creating demo user:", error);
    throw error;
  }
}

async function seedDevices(householdId: number) {
  console.log("🏠 Seeding devices...");
  
  const defaultDevices = [
    { name: "Main Refrigerator", type: "refrigerator", householdId },
    { name: "Garage Freezer", type: "freezer", householdId },
  ];
  
  try {
    const insertedDevices = [];
    for (const device of defaultDevices) {
      const result = await db.insert(devices).values(device).returning();
      insertedDevices.push(result[0]);
    }
    console.log(`✅ Seeded ${defaultDevices.length} devices`);
    return insertedDevices;
  } catch (error) {
    console.error("❌ Error seeding devices:", error);
    throw error;
  }
}

async function seedSettings(householdId: number) {
  console.log("⚙️  Seeding settings...");
  
  const defaultSettings = [
    { key: "defaultItemsToShow", value: "25", householdId },
    { key: "expirationWarningDays", value: "3", householdId },
    { key: "lastSeededDate", value: new Date().toISOString().split('T')[0], householdId },
  ];
  
  try {
    for (const setting of defaultSettings) {
      await db.insert(settings).values(setting);
    }
    console.log(`✅ Seeded ${defaultSettings.length} settings`);
  } catch (error) {
    console.error("❌ Error seeding settings:", error);
    throw error;
  }
}

async function seedInventory(householdId: number, deviceIds: { refrigerator: number; freezer: number }) {
  console.log("📦 Generating and seeding inventory items...");
  
  try {
    const sampleData = generateSampleData(new Date(), householdId, deviceIds);
    
    // Insert in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < sampleData.length; i += batchSize) {
      const batch = sampleData.slice(i, i + batchSize);
      await db.insert(inventoryItems).values(batch);
    }
    
    console.log(`✅ Seeded ${sampleData.length} inventory items`);
    
    // Show some stats
    const stats = await getInventoryStats();
    console.log("📊 Inventory Statistics:");
    console.log(`   🥩 Meat: ${stats.meat} items`);
    console.log(`   🥬 Fruits/Vegetables: ${stats["fruit-veg"]} items`);
    console.log(`   🍽️  Prepared: ${stats.prepared} items`);
    console.log(`   🍸 Cocktail: ${stats.cocktail} items`);
    console.log(`   🧊 In Freezer: ${stats.freezer} items`);
    console.log(`   ❄️  In Refrigerator: ${stats.refrigerator} items`);
    console.log(`   ⚠️  Expiring soon (3 days): ${stats.expiringSoon} items`);
    console.log(`   ❌ Already expired: ${stats.expired} items`);
    
  } catch (error) {
    console.error("❌ Error seeding inventory:", error);
    throw error;
  }
}

async function getInventoryStats() {
  const allItems = await db.select().from(inventoryItems);
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);
  
  const stats = {
    meat: 0,
    "fruit-veg": 0,
    prepared: 0,
    cocktail: 0,
    freezer: 0,
    refrigerator: 0,
    expiringSoon: 0,
    expired: 0,
  };
  
  allItems.forEach(item => {
    // Count by category
    if (item.category in stats) {
      stats[item.category as keyof typeof stats]++;
    }
    
    // Count by device
    if (item.deviceId === 1) stats.refrigerator++;
    if (item.deviceId === 2) stats.freezer++;
    
    // Count expiring soon and expired
    if (item.expirationDate) {
      const expDate = new Date(item.expirationDate);
      if (expDate < today) {
        stats.expired++;
      } else if (expDate <= threeDaysFromNow) {
        stats.expiringSoon++;
      }
    }
  });
  
  return stats;
}

async function main() {
  try {
    console.log("🌱 Starting database seeding process...");
    console.log(`📅 Using today's date: ${new Date().toLocaleDateString()}`);
    
    await clearDatabase();
    const household = await ensureDefaultHousehold();
    await seedDemoUser(household.id);
    const devices = await seedDevices(household.id);
    await seedSettings(household.id);
    
    // Create device ID mapping for sample data generation
    const deviceIds = {
      refrigerator: devices.find(d => d.type === 'refrigerator')?.id || devices[0].id,
      freezer: devices.find(d => d.type === 'freezer')?.id || devices[1].id
    };
    
    await seedInventory(household.id, deviceIds);
    
    console.log("🎉 Database seeding completed successfully!");
    console.log("");
    console.log("🚀 Ready to demo! Use these credentials:");
    console.log("   📧 Email: user@example.com");
    console.log("   🔑 Password: demo123");
    console.log("");
    console.log("💡 Run 'npm run dev' to start the application with sample data");
    
  } catch (error) {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    await sql.end();
    console.log("🔌 Database connection closed");
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}