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
import { requireAuth, getCurrentHouseholdId, type AuthenticatedRequest } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Device routes - all protected with authentication
  app.get("/api/devices", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const householdId = getCurrentHouseholdId(req);
      const devices = await storage.getDevices(householdId);
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: "Failed to get devices" });
    }
  });

  app.post("/api/devices", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const householdId = getCurrentHouseholdId(req);
      const deviceData = apiInsertDeviceSchema.parse(req.body);
      // Add household ID to device data
      const deviceWithHousehold = { ...deviceData, householdId };
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

  app.put("/api/devices/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const householdId = getCurrentHouseholdId(req);
      const id = parseInt(req.params.id);
      const deviceData = updateDeviceSchema.parse(req.body);
      const device = await storage.updateDevice(id, deviceData, householdId);
      
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

  app.delete("/api/devices/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const householdId = getCurrentHouseholdId(req);
      const id = parseInt(req.params.id);
      const success = await storage.deleteDevice(id, householdId);
      
      if (!success) {
        res.status(404).json({ message: "Device not found" });
      } else {
        res.json({ message: "Device deleted successfully" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  // Inventory routes - all protected with authentication
  app.get("/api/inventory", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const householdId = getCurrentHouseholdId(req);
      
      // Parse pagination parameters
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const search = req.query.search as string;
      const deviceId = req.query.deviceId ? parseInt(req.query.deviceId as string) : undefined;
      
      // Check if pagination parameters are provided
      if (page !== undefined || limit !== undefined || search || deviceId !== undefined) {
        // Use paginated endpoint
        const result = await storage.getInventoryItemsPaginated(householdId, {
          page,
          limit,
          search,
          deviceId
        });
        res.json(result);
      } else {
        // Use original endpoint for backward compatibility
        const items = await storage.getInventoryItems(householdId);
        res.json(items);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get inventory items" });
    }
  });

  app.post("/api/inventory", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const householdId = getCurrentHouseholdId(req);
      const itemData = apiInsertInventoryItemSchema.parse(req.body);
      // Add household ID to item data
      const itemWithHousehold = { ...itemData, householdId };
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

  app.put("/api/inventory/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const householdId = getCurrentHouseholdId(req);
      const id = parseInt(req.params.id);
      const itemData = updateInventoryItemSchema.parse(req.body);
      const item = await storage.updateInventoryItem(id, itemData, householdId);
      
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

  app.delete("/api/inventory/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const householdId = getCurrentHouseholdId(req);
      const id = parseInt(req.params.id);
      const success = await storage.deleteInventoryItem(id, householdId);
      
      if (!success) {
        res.status(404).json({ message: "Inventory item not found" });
      } else {
        res.json({ message: "Inventory item deleted successfully" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Settings routes - all protected with authentication
  app.get("/api/settings", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const householdId = getCurrentHouseholdId(req);
      const settings = await storage.getSettings(householdId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.post("/api/settings", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const householdId = getCurrentHouseholdId(req);
      const settingData = apiInsertSettingsSchema.parse(req.body);
      // Add household ID to setting data
      const settingWithHousehold = { ...settingData, householdId };
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
