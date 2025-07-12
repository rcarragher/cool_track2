import { 
  devices, 
  inventoryItems, 
  settings,
  type Device, 
  type InsertDevice,
  type InventoryItem,
  type InsertInventoryItem,
  type Settings,
  type InsertSettings,
  type UpdateInventoryItem,
  type UpdateDevice
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Device methods
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: number, device: Partial<InsertDevice>): Promise<Device | undefined>;
  deleteDevice(id: number): Promise<boolean>;

  // Inventory methods
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;

  // Settings methods
  getSettings(): Promise<Settings[]>;
  getSetting(key: string): Promise<Settings | undefined>;
  setSetting(setting: InsertSettings): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private devices: Map<number, Device>;
  private inventoryItems: Map<number, InventoryItem>;
  private settings: Map<string, Settings>;
  private currentDeviceId: number;
  private currentInventoryId: number;

  constructor() {
    this.devices = new Map();
    this.inventoryItems = new Map();
    this.settings = new Map();
    this.currentDeviceId = 1;
    this.currentInventoryId = 1;

    // Initialize with default devices
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const defaultDevices: Device[] = [
      { id: 1, name: "Main Refrigerator", type: "refrigerator" },
      { id: 2, name: "Garage Freezer", type: "freezer" },
    ];

    defaultDevices.forEach(device => {
      this.devices.set(device.id, device);
    });
    this.currentDeviceId = 3;

    // Initialize default settings
    const defaultSettings: Settings[] = [
      { id: 1, key: "defaultItemsToShow", value: "10" },
      { id: 2, key: "expirationWarningDays", value: "3" },
    ];

    defaultSettings.forEach(setting => {
      this.settings.set(setting.key, setting);
    });
  }

  // Device methods
  async getDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async getDevice(id: number): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const id = this.currentDeviceId++;
    const device: Device = { ...insertDevice, id };
    this.devices.set(id, device);
    return device;
  }

  async updateDevice(id: number, deviceUpdate: Partial<InsertDevice>): Promise<Device | undefined> {
    const existingDevice = this.devices.get(id);
    if (!existingDevice) return undefined;

    const updatedDevice: Device = { ...existingDevice, ...deviceUpdate };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async deleteDevice(id: number): Promise<boolean> {
    return this.devices.delete(id);
  }

  // Inventory methods
  async getInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.currentInventoryId++;
    const item: InventoryItem = { 
      ...insertItem, 
      id,
      expirationDate: insertItem.expirationDate || null
    };
    this.inventoryItems.set(id, item);
    return item;
  }

  async updateInventoryItem(id: number, itemUpdate: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const existingItem = this.inventoryItems.get(id);
    if (!existingItem) return undefined;

    const updatedItem: InventoryItem = { 
      ...existingItem, 
      ...itemUpdate,
      expirationDate: itemUpdate.expirationDate !== undefined ? itemUpdate.expirationDate : existingItem.expirationDate
    };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  // Settings methods
  async getSettings(): Promise<Settings[]> {
    return Array.from(this.settings.values());
  }

  async getSetting(key: string): Promise<Settings | undefined> {
    return this.settings.get(key);
  }

  async setSetting(insertSetting: InsertSettings): Promise<Settings> {
    const existing = this.settings.get(insertSetting.key);
    const setting: Settings = existing 
      ? { ...existing, value: insertSetting.value }
      : { id: Date.now(), ...insertSetting };
    
    this.settings.set(insertSetting.key, setting);
    return setting;
  }
}

export class DbStorage implements IStorage {
  private db: any;

  constructor() {
    // Import and initialize database connection
    this.initializeDb();
  }

  private async initializeDb() {
    if (!process.env.DATABASE_URL) {
      console.warn("⚠️  DATABASE_URL not found, falling back to memory storage");
      return;
    }

    try {
      const { drizzle } = await import("drizzle-orm/postgres-js");
      const postgres = (await import("postgres")).default;
      
      const sql = postgres(process.env.DATABASE_URL);
      this.db = drizzle(sql);
      console.log("✅ Connected to PostgreSQL database");
    } catch (error) {
      console.error("❌ Failed to connect to database:", error);
      console.warn("⚠️  Falling back to memory storage");
    }
  }

  // Device methods
  async getDevices(): Promise<Device[]> {
    if (!this.db) {
      console.warn("Database not available, returning empty array");
      return [];
    }
    
    try {
      return await this.db.select().from(devices);
    } catch (error) {
      console.error("Error fetching devices:", error);
      return [];
    }
  }

  async getDevice(id: number): Promise<Device | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db.select().from(devices).where(eq(devices.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching device:", error);
      return undefined;
    }
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    if (!this.db) throw new Error("Database not available");
    
    try {
      const result = await this.db.insert(devices).values(insertDevice).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating device:", error);
      throw error;
    }
  }

  async updateDevice(id: number, deviceUpdate: Partial<InsertDevice>): Promise<Device | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db
        .update(devices)
        .set(deviceUpdate)
        .where(eq(devices.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating device:", error);
      return undefined;
    }
  }

  async deleteDevice(id: number): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      const result = await this.db.delete(devices).where(eq(devices.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting device:", error);
      return false;
    }
  }

  // Inventory methods
  async getInventoryItems(): Promise<InventoryItem[]> {
    if (!this.db) {
      console.warn("Database not available, returning empty array");
      return [];
    }
    
    try {
      return await this.db.select().from(inventoryItems);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      return [];
    }
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      return undefined;
    }
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    if (!this.db) throw new Error("Database not available");
    
    try {
      const result = await this.db.insert(inventoryItems).values(insertItem).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating inventory item:", error);
      throw error;
    }
  }

  async updateInventoryItem(id: number, itemUpdate: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db
        .update(inventoryItems)
        .set(itemUpdate)
        .where(eq(inventoryItems.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating inventory item:", error);
      return undefined;
    }
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      const result = await this.db.delete(inventoryItems).where(eq(inventoryItems.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      return false;
    }
  }

  // Settings methods
  async getSettings(): Promise<Settings[]> {
    if (!this.db) {
      console.warn("Database not available, returning empty array");
      return [];
    }
    
    try {
      return await this.db.select().from(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      return [];
    }
  }

  async getSetting(key: string): Promise<Settings | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db.select().from(settings).where(eq(settings.key, key));
      return result[0];
    } catch (error) {
      console.error("Error fetching setting:", error);
      return undefined;
    }
  }

  async setSetting(insertSetting: InsertSettings): Promise<Settings> {
    if (!this.db) throw new Error("Database not available");
    
    try {
      // Try to update first
      const existing = await this.getSetting(insertSetting.key);
      
      if (existing) {
        const result = await this.db
          .update(settings)
          .set({ value: insertSetting.value })
          .where(eq(settings.key, insertSetting.key))
          .returning();
        return result[0];
      } else {
        const result = await this.db.insert(settings).values(insertSetting).returning();
        return result[0];
      }
    } catch (error) {
      console.error("Error setting configuration:", error);
      throw error;
    }
  }
}

// Auto-detect which storage to use based on environment
function createStorage(): IStorage {
  if (process.env.DATABASE_URL) {
    console.log("🗃️  Using database storage (PostgreSQL)");
    return new DbStorage();
  } else {
    console.log("💾 Using memory storage (development fallback)");
    return new MemStorage();
  }
}

export const storage = createStorage();
