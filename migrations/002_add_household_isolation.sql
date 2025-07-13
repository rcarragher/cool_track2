-- Migration: Add household isolation to existing tables
-- Created: 2025-07-13

-- Get the default household ID (created in previous migration)
DO $$
DECLARE
    default_household_id INTEGER;
BEGIN
    -- Get the default household ID
    SELECT id INTO default_household_id FROM households WHERE name = 'Default Household' LIMIT 1;
    
    IF default_household_id IS NULL THEN
        RAISE EXCEPTION 'Default household not found. Run migration 001 first.';
    END IF;
    
    -- Add household_id column to devices table
    ALTER TABLE devices ADD COLUMN household_id INTEGER;
    
    -- Update existing devices with default household
    UPDATE devices SET household_id = default_household_id;
    
    -- Make household_id NOT NULL and add foreign key constraint
    ALTER TABLE devices ALTER COLUMN household_id SET NOT NULL;
    ALTER TABLE devices ADD CONSTRAINT devices_household_id_fkey 
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
    
    -- Add household_id column to inventory_items table
    ALTER TABLE inventory_items ADD COLUMN household_id INTEGER;
    
    -- Update existing inventory items with default household
    UPDATE inventory_items SET household_id = default_household_id;
    
    -- Make household_id NOT NULL and add foreign key constraint
    ALTER TABLE inventory_items ALTER COLUMN household_id SET NOT NULL;
    ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_household_id_fkey 
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
    
    -- Add household_id column to settings table (nullable for global settings)
    ALTER TABLE settings ADD COLUMN household_id INTEGER;
    
    -- Update existing settings with default household
    UPDATE settings SET household_id = default_household_id;
    
    -- Add foreign key constraint (nullable, so no NOT NULL constraint)
    ALTER TABLE settings ADD CONSTRAINT settings_household_id_fkey 
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
    
    -- Create unique constraint for settings key per household
    ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_key_key;
    CREATE UNIQUE INDEX settings_key_household_unique ON settings(key, household_id);
END $$;

-- Create indexes for household-based queries
CREATE INDEX idx_devices_household_id ON devices(household_id);
CREATE INDEX idx_inventory_items_household_id ON inventory_items(household_id);
CREATE INDEX idx_settings_household_id ON settings(household_id);

-- DOWN
-- Remove indexes
DROP INDEX IF EXISTS idx_settings_household_id;
DROP INDEX IF EXISTS idx_inventory_items_household_id;
DROP INDEX IF EXISTS idx_devices_household_id;
DROP INDEX IF EXISTS settings_key_household_unique;

-- Remove foreign key constraints
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_household_id_fkey;
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_household_id_fkey;
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_household_id_fkey;

-- Remove household_id columns
ALTER TABLE settings DROP COLUMN IF EXISTS household_id;
ALTER TABLE inventory_items DROP COLUMN IF EXISTS household_id;
ALTER TABLE devices DROP COLUMN IF EXISTS household_id;

-- Restore original unique constraint on settings
CREATE UNIQUE INDEX settings_key_key ON settings(key);