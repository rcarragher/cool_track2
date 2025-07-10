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

export const storage = new MemStorage();
