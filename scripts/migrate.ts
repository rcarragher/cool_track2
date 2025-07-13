#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

// Migration tracking table
const migrations = pgTable("migrations", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  executedAt: timestamp("executed_at").defaultNow()
});

interface Migration {
  filename: string;
  up: string;
  down?: string;
}

class MigrationRunner {
  private db: any;
  private sql: any;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL or TEST_DATABASE_URL environment variable is required");
    }
    
    this.sql = postgres(databaseUrl);
    this.db = drizzle(this.sql);
  }

  async initialize() {
    // Create migrations table if it doesn't exist
    await this.sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("✅ Migration tracking table initialized");
  }

  async getExecutedMigrations(): Promise<string[]> {
    try {
      const result = await this.db.select({ filename: migrations.filename }).from(migrations);
      return result.map(r => r.filename);
    } catch (error) {
      console.error("Error fetching executed migrations:", error);
      return [];
    }
  }

  async loadMigrationFiles(): Promise<Migration[]> {
    const migrationsDir = join(process.cwd(), 'migrations');
    
    try {
      const files = await readdir(migrationsDir);
      const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
      
      const migrations: Migration[] = [];
      
      for (const file of sqlFiles) {
        const content = await readFile(join(migrationsDir, file), 'utf-8');
        
        // Split on -- DOWN comment to separate up and down migrations
        const parts = content.split('-- DOWN');
        const up = parts[0].trim();
        const down = parts[1] ? parts[1].trim() : undefined;
        
        migrations.push({
          filename: file,
          up,
          down
        });
      }
      
      return migrations;
    } catch (error) {
      console.error("Error loading migration files:", error);
      return [];
    }
  }

  async runUp() {
    console.log("🔄 Running database migrations...");
    
    await this.initialize();
    
    const executedMigrations = await this.getExecutedMigrations();
    const allMigrations = await this.loadMigrationFiles();
    
    const pendingMigrations = allMigrations.filter(
      m => !executedMigrations.includes(m.filename)
    );
    
    if (pendingMigrations.length === 0) {
      console.log("✅ No pending migrations");
      return;
    }
    
    console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
    pendingMigrations.forEach(m => console.log(`  - ${m.filename}`));
    
    for (const migration of pendingMigrations) {
      console.log(`🔄 Executing migration: ${migration.filename}`);
      
      try {
        // Execute migration in a transaction
        await this.sql.begin(async (tx) => {
          // Execute the migration SQL
          await tx.unsafe(migration.up);
          
          // Record that this migration was executed
          await tx`
            INSERT INTO migrations (filename) VALUES (${migration.filename})
          `;
        });
        
        console.log(`✅ Migration completed: ${migration.filename}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${migration.filename}`);
        console.error(error);
        throw error;
      }
    }
    
    console.log("🎉 All migrations completed successfully!");
  }

  async runDown(steps: number = 1) {
    console.log(`🔄 Rolling back ${steps} migration(s)...`);
    
    await this.initialize();
    
    const executedMigrations = await this.getExecutedMigrations();
    const allMigrations = await this.loadMigrationFiles();
    
    // Get the last N executed migrations to roll back
    const toRollback = executedMigrations
      .slice(-steps)
      .reverse(); // Roll back in reverse order
    
    if (toRollback.length === 0) {
      console.log("✅ No migrations to roll back");
      return;
    }
    
    console.log(`📋 Rolling back migrations:`);
    toRollback.forEach(m => console.log(`  - ${m}`));
    
    for (const migrationFilename of toRollback) {
      const migration = allMigrations.find(m => m.filename === migrationFilename);
      
      if (!migration || !migration.down) {
        console.error(`❌ No rollback script found for: ${migrationFilename}`);
        continue;
      }
      
      console.log(`🔄 Rolling back migration: ${migrationFilename}`);
      
      try {
        // Execute rollback in a transaction
        await this.sql.begin(async (tx) => {
          // Execute the rollback SQL
          await tx.unsafe(migration.down!);
          
          // Remove migration record
          await tx`
            DELETE FROM migrations WHERE filename = ${migrationFilename}
          `;
        });
        
        console.log(`✅ Rollback completed: ${migrationFilename}`);
      } catch (error) {
        console.error(`❌ Rollback failed: ${migrationFilename}`);
        console.error(error);
        throw error;
      }
    }
    
    console.log("🎉 Rollback completed successfully!");
  }

  async status() {
    console.log("📊 Migration Status");
    console.log("==================");
    
    await this.initialize();
    
    const executedMigrations = await this.getExecutedMigrations();
    const allMigrations = await this.loadMigrationFiles();
    
    console.log(`Total migrations: ${allMigrations.length}`);
    console.log(`Executed: ${executedMigrations.length}`);
    console.log(`Pending: ${allMigrations.length - executedMigrations.length}`);
    console.log("");
    
    if (allMigrations.length > 0) {
      console.log("Migration files:");
      allMigrations.forEach(migration => {
        const isExecuted = executedMigrations.includes(migration.filename);
        const status = isExecuted ? "✅" : "⏳";
        console.log(`  ${status} ${migration.filename}`);
      });
    }
  }

  async close() {
    await this.sql.end();
  }
}

// CLI handling
async function main() {
  const command = process.argv[2] || 'up';
  const runner = new MigrationRunner();
  
  try {
    switch (command) {
      case 'up':
        await runner.runUp();
        break;
      case 'down':
        const steps = parseInt(process.argv[3]) || 1;
        await runner.runDown(steps);
        break;
      case 'status':
        await runner.status();
        break;
      default:
        console.log("Usage: tsx scripts/migrate.ts [up|down|status] [steps]");
        console.log("  up     - Run pending migrations");
        console.log("  down   - Rollback migrations (default: 1 step)");
        console.log("  status - Show migration status");
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// ES module entry point check
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}