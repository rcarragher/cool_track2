import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  apiInsertDeviceSchema,
  apiInsertInventoryItemSchema,
  apiInsertSettingsSchema,
  updateInventoryItemSchema,
  updateDeviceSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Temporary: Use default household ID until authentication is implemented
  const DEFAULT_HOUSEHOLD_ID = 1;

  // Device routes
  app.get("/api/devices", async (req, res) => {
    try {
      const devices = await storage.getDevices(DEFAULT_HOUSEHOLD_ID);
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: "Failed to get devices" });
    }
  });

  app.post("/api/devices", async (req, res) => {
    try {
      const deviceData = apiInsertDeviceSchema.parse(req.body);
      // Add household ID to device data
      const deviceWithHousehold = { ...deviceData, householdId: DEFAULT_HOUSEHOLD_ID };
      const device = await storage.createDevice(deviceWithHousehold);
      res.json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid device data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create device" });
      }
    }
  });

  app.put("/api/devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deviceData = updateDeviceSchema.parse(req.body);
      const device = await storage.updateDevice(id, deviceData, DEFAULT_HOUSEHOLD_ID);
      
      if (!device) {
        res.status(404).json({ message: "Device not found" });
      } else {
        res.json(device);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid device data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update device" });
      }
    }
  });

  app.delete("/api/devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDevice(id, DEFAULT_HOUSEHOLD_ID);
      
      if (!success) {
        res.status(404).json({ message: "Device not found" });
      } else {
        res.json({ message: "Device deleted successfully" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await storage.getInventoryItems(DEFAULT_HOUSEHOLD_ID);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get inventory items" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const itemData = apiInsertInventoryItemSchema.parse(req.body);
      // Add household ID to item data
      const itemWithHousehold = { ...itemData, householdId: DEFAULT_HOUSEHOLD_ID };
      const item = await storage.createInventoryItem(itemWithHousehold);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid inventory item data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create inventory item" });
      }
    }
  });

  app.put("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = updateInventoryItemSchema.parse(req.body);
      const item = await storage.updateInventoryItem(id, itemData, DEFAULT_HOUSEHOLD_ID);
      
      if (!item) {
        res.status(404).json({ message: "Inventory item not found" });
      } else {
        res.json(item);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid inventory item data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update inventory item" });
      }
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInventoryItem(id, DEFAULT_HOUSEHOLD_ID);
      
      if (!success) {
        res.status(404).json({ message: "Inventory item not found" });
      } else {
        res.json({ message: "Inventory item deleted successfully" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings(DEFAULT_HOUSEHOLD_ID);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const settingData = apiInsertSettingsSchema.parse(req.body);
      // Add household ID to setting data
      const settingWithHousehold = { ...settingData, householdId: DEFAULT_HOUSEHOLD_ID };
      const setting = await storage.setSetting(settingWithHousehold);
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save setting" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
