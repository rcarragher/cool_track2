import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'refrigerator' or 'freezer'
});

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'meat', 'cocktail', 'fruit-veg', 'prepared'
  quantity: text("quantity").notNull(),
  deviceId: integer("device_id").notNull(),
  location: text("location").notNull(), // 'refrigerator' or 'freezer'
  dateAdded: text("date_added").notNull(),
  expirationDate: text("expiration_date"),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Additional schemas for API validation
export const updateInventoryItemSchema = insertInventoryItemSchema.partial().extend({
  id: z.number(),
});

export const updateDeviceSchema = insertDeviceSchema.partial().extend({
  id: z.number(),
});

export type UpdateInventoryItem = z.infer<typeof updateInventoryItemSchema>;
export type UpdateDevice = z.infer<typeof updateDeviceSchema>;
