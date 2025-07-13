import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Household table - groups users and their data
export const households = pgTable("households", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Users table - authentication and household membership
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  householdId: integer("household_id").notNull().references(() => households.id, { onDelete: 'cascade' }),
  role: text("role").default("member"), // 'admin' or 'member'
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User sessions table - session management
export const userSessions = pgTable("user_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  data: text("data").notNull(), // JSON string containing session data
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Devices table - now with household isolation
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'refrigerator' or 'freezer'
  householdId: integer("household_id").notNull().references(() => households.id, { onDelete: 'cascade' })
});

// Inventory items table - now with household isolation
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'meat', 'cocktail', 'fruit-veg', 'prepared'
  quantity: text("quantity").notNull(),
  deviceId: integer("device_id").notNull(),
  householdId: integer("household_id").notNull().references(() => households.id, { onDelete: 'cascade' }),
  dateAdded: text("date_added").notNull(),
  expirationDate: text("expiration_date"),
});

// Settings table - now with household isolation (nullable for global settings)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  householdId: integer("household_id").references(() => households.id, { onDelete: 'cascade' }), // nullable for global settings
});

// Insert schemas - omit auto-generated fields
export const insertHouseholdSchema = createInsertSchema(households).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  createdAt: true
});

// Database insert schemas (include householdId)
export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

// API input schemas (exclude householdId - added automatically by routes)
export const apiInsertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  householdId: true,
});

export const apiInsertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  householdId: true,
});

export const apiInsertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  householdId: true,
});

// Type definitions for database entities
export type Household = typeof households.$inferSelect;
export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Update schemas for API validation
export const updateHouseholdSchema = insertHouseholdSchema.partial().extend({
  id: z.number(),
});

export const updateUserSchema = insertUserSchema.partial().extend({
  id: z.number(),
});

export const updateInventoryItemSchema = insertInventoryItemSchema.partial().extend({
  id: z.number(),
});

export const updateDeviceSchema = insertDeviceSchema.partial().extend({
  id: z.number(),
});

export type UpdateHousehold = z.infer<typeof updateHouseholdSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpdateInventoryItem = z.infer<typeof updateInventoryItemSchema>;
export type UpdateDevice = z.infer<typeof updateDeviceSchema>;

// Authentication-related schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  householdName: z.string().min(1).optional(), // Create new household if provided
  householdId: z.number().optional(), // Join existing household if provided
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
