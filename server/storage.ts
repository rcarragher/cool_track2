import { 
  devices, 
  inventoryItems, 
  settings,
  households,
  users,
  userSessions,
  type Device, 
  type InsertDevice,
  type InventoryItem,
  type InsertInventoryItem,
  type Settings,
  type InsertSettings,
  type UpdateInventoryItem,
  type UpdateDevice,
  type Household,
  type InsertHousehold,
  type User,
  type InsertUser,
  type UserSession,
  type InsertUserSession
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User management
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Household management
  getHousehold(id: number): Promise<Household | undefined>;
  createHousehold(household: InsertHousehold): Promise<Household>;
  updateHousehold(id: number, household: Partial<InsertHousehold>): Promise<Household | undefined>;
  deleteHousehold(id: number): Promise<boolean>;
  getUsersInHousehold(householdId: number): Promise<User[]>;

  // Session management
  createSession(session: InsertUserSession): Promise<UserSession>;
  getSession(id: string): Promise<UserSession | undefined>;
  deleteSession(id: string): Promise<boolean>;
  deleteUserSessions(userId: number): Promise<number>; // Returns count of deleted sessions
  cleanupExpiredSessions(): Promise<number>; // Returns count of cleaned up sessions

  // Device methods - now household-scoped
  getDevices(householdId: number): Promise<Device[]>;
  getDevice(id: number, householdId: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: number, device: Partial<InsertDevice>, householdId: number): Promise<Device | undefined>;
  deleteDevice(id: number, householdId: number): Promise<boolean>;

  // Inventory methods - now household-scoped
  getInventoryItems(householdId: number): Promise<InventoryItem[]>;
  getInventoryItem(id: number, householdId: number): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>, householdId: number): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number, householdId: number): Promise<boolean>;

  // Settings methods - now household-scoped
  getSettings(householdId: number): Promise<Settings[]>;
  getSetting(key: string, householdId: number): Promise<Settings | undefined>;
  setSetting(setting: InsertSettings): Promise<Settings>;
  deleteSetting(key: string, householdId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private households: Map<number, Household>;
  private users: Map<number, User>;
  private userSessions: Map<string, UserSession>;
  private devices: Map<number, Device>;
  private inventoryItems: Map<number, InventoryItem>;
  private settings: Map<string, Settings>;
  private currentHouseholdId: number;
  private currentUserId: number;
  private currentDeviceId: number;
  private currentInventoryId: number;
  private currentSettingsId: number;

  constructor() {
    this.households = new Map();
    this.users = new Map();
    this.userSessions = new Map();
    this.devices = new Map();
    this.inventoryItems = new Map();
    this.settings = new Map();
    this.currentHouseholdId = 1;
    this.currentUserId = 1;
    this.currentDeviceId = 1;
    this.currentInventoryId = 1;
    this.currentSettingsId = 1;

    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default household
    const defaultHousehold: Household = {
      id: 1,
      name: "Default Household",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.households.set(1, defaultHousehold);
    this.currentHouseholdId = 2;

    // Create default devices
    const defaultDevices: Device[] = [
      { id: 1, name: "Main Refrigerator", type: "refrigerator", householdId: 1 },
      { id: 2, name: "Garage Freezer", type: "freezer", householdId: 1 },
    ];

    defaultDevices.forEach(device => {
      this.devices.set(device.id, device);
    });
    this.currentDeviceId = 3;

    // Initialize default settings
    const defaultSettings: Settings[] = [
      { id: 1, key: "defaultItemsToShow", value: "10", householdId: 1 },
      { id: 2, key: "expirationWarningDays", value: "3", householdId: 1 },
    ];

    defaultSettings.forEach(setting => {
      this.settings.set(`${setting.key}_${setting.householdId}`, setting);
    });
    this.currentSettingsId = 3;
  }

  // User management
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "member",
      emailVerified: insertUser.emailVerified || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser: User = { 
      ...existingUser, 
      ...userUpdate,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    // Also delete user sessions
    const userSessions = Array.from(this.userSessions.values()).filter(session => session.userId === id);
    userSessions.forEach(session => this.userSessions.delete(session.id));
    
    return this.users.delete(id);
  }

  // Household management
  async getHousehold(id: number): Promise<Household | undefined> {
    return this.households.get(id);
  }

  async createHousehold(insertHousehold: InsertHousehold): Promise<Household> {
    const id = this.currentHouseholdId++;
    const household: Household = {
      ...insertHousehold,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.households.set(id, household);
    return household;
  }

  async updateHousehold(id: number, householdUpdate: Partial<InsertHousehold>): Promise<Household | undefined> {
    const existingHousehold = this.households.get(id);
    if (!existingHousehold) return undefined;

    const updatedHousehold: Household = { 
      ...existingHousehold, 
      ...householdUpdate,
      updatedAt: new Date()
    };
    this.households.set(id, updatedHousehold);
    return updatedHousehold;
  }

  async deleteHousehold(id: number): Promise<boolean> {
    // This would cascade delete in a real database, but for memory storage we'll leave it
    return this.households.delete(id);
  }

  async getUsersInHousehold(householdId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.householdId === householdId);
  }

  // Session management
  async createSession(insertSession: InsertUserSession): Promise<UserSession> {
    const session: UserSession = {
      ...insertSession,
      createdAt: new Date()
    };
    this.userSessions.set(session.id, session);
    return session;
  }

  async getSession(id: string): Promise<UserSession | undefined> {
    const session = this.userSessions.get(id);
    if (session && session.expiresAt < new Date()) {
      // Session expired, remove it
      this.userSessions.delete(id);
      return undefined;
    }
    return session;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.userSessions.delete(id);
  }

  async deleteUserSessions(userId: number): Promise<number> {
    const userSessions = Array.from(this.userSessions.values()).filter(session => session.userId === userId);
    userSessions.forEach(session => this.userSessions.delete(session.id));
    return userSessions.length;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const expiredSessions = Array.from(this.userSessions.values()).filter(session => session.expiresAt < now);
    expiredSessions.forEach(session => this.userSessions.delete(session.id));
    return expiredSessions.length;
  }

  // Device methods - now household-scoped
  async getDevices(householdId: number): Promise<Device[]> {
    return Array.from(this.devices.values()).filter(device => device.householdId === householdId);
  }

  async getDevice(id: number, householdId: number): Promise<Device | undefined> {
    const device = this.devices.get(id);
    return device && device.householdId === householdId ? device : undefined;
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const id = this.currentDeviceId++;
    const device: Device = { ...insertDevice, id };
    this.devices.set(id, device);
    return device;
  }

  async updateDevice(id: number, deviceUpdate: Partial<InsertDevice>, householdId: number): Promise<Device | undefined> {
    const existingDevice = this.devices.get(id);
    if (!existingDevice || existingDevice.householdId !== householdId) return undefined;

    const updatedDevice: Device = { ...existingDevice, ...deviceUpdate };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async deleteDevice(id: number, householdId: number): Promise<boolean> {
    const device = this.devices.get(id);
    if (!device || device.householdId !== householdId) return false;
    
    return this.devices.delete(id);
  }

  // Inventory methods - now household-scoped
  async getInventoryItems(householdId: number): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(item => item.householdId === householdId);
  }

  async getInventoryItem(id: number, householdId: number): Promise<InventoryItem | undefined> {
    const item = this.inventoryItems.get(id);
    return item && item.householdId === householdId ? item : undefined;
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

  async updateInventoryItem(id: number, itemUpdate: Partial<InsertInventoryItem>, householdId: number): Promise<InventoryItem | undefined> {
    const existingItem = this.inventoryItems.get(id);
    if (!existingItem || existingItem.householdId !== householdId) return undefined;

    const updatedItem: InventoryItem = { 
      ...existingItem, 
      ...itemUpdate,
      expirationDate: itemUpdate.expirationDate !== undefined ? itemUpdate.expirationDate : existingItem.expirationDate
    };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number, householdId: number): Promise<boolean> {
    const item = this.inventoryItems.get(id);
    if (!item || item.householdId !== householdId) return false;
    
    return this.inventoryItems.delete(id);
  }

  // Settings methods - now household-scoped
  async getSettings(householdId: number): Promise<Settings[]> {
    return Array.from(this.settings.values()).filter(setting => setting.householdId === householdId);
  }

  async getSetting(key: string, householdId: number): Promise<Settings | undefined> {
    return this.settings.get(`${key}_${householdId}`);
  }

  async setSetting(insertSetting: InsertSettings): Promise<Settings> {
    const mapKey = `${insertSetting.key}_${insertSetting.householdId}`;
    const existing = this.settings.get(mapKey);
    const setting: Settings = existing 
      ? { ...existing, value: insertSetting.value }
      : { 
          id: this.currentSettingsId++, 
          key: insertSetting.key,
          value: insertSetting.value,
          householdId: insertSetting.householdId || null
        };
    
    this.settings.set(mapKey, setting);
    return setting;
  }

  async deleteSetting(key: string, householdId: number): Promise<boolean> {
    return this.settings.delete(`${key}_${householdId}`);
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

  // User management
  async getUserById(id: number): Promise<User | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db.select().from(users).where(eq(users.email, email));
      return result[0];
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.db) throw new Error("Database not available");
    
    try {
      const result = await this.db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db
        .update(users)
        .set(userUpdate)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      const existing = await this.getUserById(id);
      if (!existing) return false;
      
      await this.db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Household management
  async getHousehold(id: number): Promise<Household | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db.select().from(households).where(eq(households.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching household:", error);
      return undefined;
    }
  }

  async createHousehold(insertHousehold: InsertHousehold): Promise<Household> {
    if (!this.db) throw new Error("Database not available");
    
    try {
      const result = await this.db.insert(households).values(insertHousehold).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating household:", error);
      throw error;
    }
  }

  async updateHousehold(id: number, householdUpdate: Partial<InsertHousehold>): Promise<Household | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db
        .update(households)
        .set(householdUpdate)
        .where(eq(households.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating household:", error);
      return undefined;
    }
  }

  async deleteHousehold(id: number): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      const existing = await this.getHousehold(id);
      if (!existing) return false;
      
      await this.db.delete(households).where(eq(households.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting household:", error);
      return false;
    }
  }

  async getUsersInHousehold(householdId: number): Promise<User[]> {
    if (!this.db) return [];
    
    try {
      return await this.db.select().from(users).where(eq(users.householdId, householdId));
    } catch (error) {
      console.error("Error fetching users in household:", error);
      return [];
    }
  }

  // Session management
  async createSession(insertSession: InsertUserSession): Promise<UserSession> {
    if (!this.db) throw new Error("Database not available");
    
    try {
      const result = await this.db.insert(userSessions).values(insertSession).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  }

  async getSession(id: string): Promise<UserSession | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db.select().from(userSessions).where(eq(userSessions.id, id));
      const session = result[0];
      
      if (session && session.expiresAt < new Date()) {
        // Session expired, remove it
        await this.deleteSession(id);
        return undefined;
      }
      
      return session;
    } catch (error) {
      console.error("Error fetching session:", error);
      return undefined;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      await this.db.delete(userSessions).where(eq(userSessions.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      return false;
    }
  }

  async deleteUserSessions(userId: number): Promise<number> {
    if (!this.db) return 0;
    
    try {
      const result = await this.db.delete(userSessions).where(eq(userSessions.userId, userId)).returning({ id: userSessions.id });
      return result.length;
    } catch (error) {
      console.error("Error deleting user sessions:", error);
      return 0;
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    if (!this.db) return 0;
    
    try {
      const now = new Date();
      const result = await this.db.delete(userSessions).where(eq(userSessions.expiresAt, now)).returning({ id: userSessions.id });
      return result.length;
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
      return 0;
    }
  }

  // Device methods - now household-scoped
  async getDevices(householdId: number): Promise<Device[]> {
    if (!this.db) {
      console.warn("Database not available, returning empty array");
      return [];
    }
    
    try {
      return await this.db.select().from(devices).where(eq(devices.householdId, householdId));
    } catch (error) {
      console.error("Error fetching devices:", error);
      return [];
    }
  }

  async getDevice(id: number, householdId: number): Promise<Device | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db
        .select()
        .from(devices)
        .where(and(eq(devices.id, id), eq(devices.householdId, householdId)));
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

  async updateDevice(id: number, deviceUpdate: Partial<InsertDevice>, householdId: number): Promise<Device | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db
        .update(devices)
        .set(deviceUpdate)
        .where(and(eq(devices.id, id), eq(devices.householdId, householdId)))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating device:", error);
      return undefined;
    }
  }

  async deleteDevice(id: number, householdId: number): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      // First check if device exists and belongs to household
      const existing = await this.getDevice(id, householdId);
      if (!existing) return false;
      
      await this.db.delete(devices).where(and(eq(devices.id, id), eq(devices.householdId, householdId)));
      return true;
    } catch (error) {
      console.error("Error deleting device:", error);
      return false;
    }
  }

  // Inventory methods - now household-scoped
  async getInventoryItems(householdId: number): Promise<InventoryItem[]> {
    if (!this.db) {
      console.warn("Database not available, returning empty array");
      return [];
    }
    
    try {
      return await this.db.select().from(inventoryItems).where(eq(inventoryItems.householdId, householdId));
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      return [];
    }
  }

  async getInventoryItem(id: number, householdId: number): Promise<InventoryItem | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db
        .select()
        .from(inventoryItems)
        .where(and(eq(inventoryItems.id, id), eq(inventoryItems.householdId, householdId)));
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

  async updateInventoryItem(id: number, itemUpdate: Partial<InsertInventoryItem>, householdId: number): Promise<InventoryItem | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db
        .update(inventoryItems)
        .set(itemUpdate)
        .where(and(eq(inventoryItems.id, id), eq(inventoryItems.householdId, householdId)))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating inventory item:", error);
      return undefined;
    }
  }

  async deleteInventoryItem(id: number, householdId: number): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      // First check if item exists and belongs to household
      const existing = await this.getInventoryItem(id, householdId);
      if (!existing) return false;
      
      await this.db.delete(inventoryItems).where(and(eq(inventoryItems.id, id), eq(inventoryItems.householdId, householdId)));
      return true;
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      return false;
    }
  }

  // Settings methods - now household-scoped
  async getSettings(householdId: number): Promise<Settings[]> {
    if (!this.db) {
      console.warn("Database not available, returning empty array");
      return [];
    }
    
    try {
      return await this.db.select().from(settings).where(eq(settings.householdId, householdId));
    } catch (error) {
      console.error("Error fetching settings:", error);
      return [];
    }
  }

  async getSetting(key: string, householdId: number): Promise<Settings | undefined> {
    if (!this.db) return undefined;
    
    try {
      const result = await this.db
        .select()
        .from(settings)
        .where(and(eq(settings.key, key), eq(settings.householdId, householdId)));
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
      const existing = await this.getSetting(insertSetting.key, insertSetting.householdId!);
      
      if (existing) {
        const result = await this.db
          .update(settings)
          .set({ value: insertSetting.value })
          .where(and(eq(settings.key, insertSetting.key), eq(settings.householdId, insertSetting.householdId!)))
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

  async deleteSetting(key: string, householdId: number): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      const existing = await this.getSetting(key, householdId);
      if (!existing) return false;
      
      await this.db.delete(settings).where(and(eq(settings.key, key), eq(settings.householdId, householdId)));
      return true;
    } catch (error) {
      console.error("Error deleting setting:", error);
      return false;
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
