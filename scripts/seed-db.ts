import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { devices, inventoryItems, settings } from "@shared/schema";
import { eq } from "drizzle-orm";
import generateSampleData from "./sample-data";

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
    
    console.log("✅ Database cleared successfully");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    throw error;
  }
}

async function seedDevices() {
  console.log("🏠 Seeding devices...");
  
  const defaultDevices = [
    { id: 1, name: "Main Refrigerator", type: "refrigerator" },
    { id: 2, name: "Garage Freezer", type: "freezer" },
  ];
  
  try {
    for (const device of defaultDevices) {
      await db.insert(devices).values(device);
    }
    console.log(`✅ Seeded ${defaultDevices.length} devices`);
  } catch (error) {
    console.error("❌ Error seeding devices:", error);
    throw error;
  }
}

async function seedSettings() {
  console.log("⚙️  Seeding settings...");
  
  const defaultSettings = [
    { id: 1, key: "defaultItemsToShow", value: "25" },
    { id: 2, key: "expirationWarningDays", value: "3" },
    { id: 3, key: "lastSeededDate", value: new Date().toISOString().split('T')[0] },
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

async function seedInventory() {
  console.log("📦 Generating and seeding inventory items...");
  
  try {
    const sampleData = generateSampleData();
    
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
    await seedDevices();
    await seedSettings();
    await seedInventory();
    
    console.log("🎉 Database seeding completed successfully!");
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