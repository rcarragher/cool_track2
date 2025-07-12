import { describe, it, expect } from 'vitest';
import { format, addDays, subDays } from 'date-fns';
import generateSampleData from '../../scripts/sample-data';

describe('Sample Data Generation', () => {
  it('should generate sample data with correct structure', () => {
    const sampleData = generateSampleData();
    
    expect(sampleData).toBeInstanceOf(Array);
    expect(sampleData.length).toBeGreaterThan(40);
    expect(sampleData.length).toBeLessThanOrEqual(50);
    
    // Check that each item has required fields
    sampleData.forEach(item => {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('deviceId');
      expect(item).toHaveProperty('dateAdded');
      expect(item).toHaveProperty('expirationDate');
      
      // Validate types
      expect(typeof item.name).toBe('string');
      expect(['meat', 'fruit-veg', 'prepared', 'cocktail']).toContain(item.category);
      expect(typeof item.quantity).toBe('string');
      expect([1, 2]).toContain(item.deviceId); // Device IDs should be 1 or 2
      expect(typeof item.dateAdded).toBe('string');
    });
  });

  it('should generate items across all categories', () => {
    const sampleData = generateSampleData();
    const categories = new Set(sampleData.map(item => item.category));
    
    expect(categories.has('meat')).toBe(true);
    expect(categories.has('fruit-veg')).toBe(true);
    expect(categories.has('prepared')).toBe(true);
    expect(categories.has('cocktail')).toBe(true);
  });

  it('should distribute items across both devices', () => {
    const sampleData = generateSampleData();
    const deviceIds = new Set(sampleData.map(item => item.deviceId));
    
    expect(deviceIds.has(1)).toBe(true); // Refrigerator
    expect(deviceIds.has(2)).toBe(true); // Freezer
  });

  it('should use provided date as reference', () => {
    const testDate = new Date('2024-01-15');
    const sampleData = generateSampleData(testDate);
    const expectedDateAdded = format(testDate, 'yyyy-MM-dd');
    
    // Most items should have the test date as dateAdded
    const itemsWithTestDate = sampleData.filter(item => 
      item.dateAdded === expectedDateAdded
    );
    
    expect(itemsWithTestDate.length).toBeGreaterThan(30);
  });

  it('should include items expiring soon', () => {
    const testDate = new Date('2024-06-15');
    const sampleData = generateSampleData(testDate);
    
    const threeDaysFromNow = addDays(testDate, 3);
    const expiringSoonItems = sampleData.filter(item => {
      if (!item.expirationDate) return false;
      const expDate = new Date(item.expirationDate);
      return expDate >= testDate && expDate <= threeDaysFromNow;
    });
    
    expect(expiringSoonItems.length).toBeGreaterThanOrEqual(2);
  });

  it('should include expired items', () => {
    const testDate = new Date('2024-06-15');
    const sampleData = generateSampleData(testDate);
    
    const expiredItems = sampleData.filter(item => {
      if (!item.expirationDate) return false;
      const expDate = new Date(item.expirationDate);
      return expDate < testDate;
    });
    
    expect(expiredItems.length).toBeGreaterThanOrEqual(3);
    
    // Check that expired items have realistic past dates
    expiredItems.forEach(item => {
      if (item.expirationDate) {
        const expDate = new Date(item.expirationDate);
        const daysDiff = Math.floor((testDate.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));
        expect(daysDiff).toBeGreaterThan(0);
        expect(daysDiff).toBeLessThan(10); // Should be within reasonable past range
      }
    });
  });

  it('should generate realistic expiration dates by category', () => {
    const testDate = new Date('2024-06-15');
    const sampleData = generateSampleData(testDate);
    
    // Group by category
    const meatItems = sampleData.filter(item => item.category === 'meat');
    const cocktailItems = sampleData.filter(item => item.category === 'cocktail');
    
    // Meat items should generally have shorter expiration (unless frozen)
    meatItems.forEach(item => {
      if (item.expirationDate) {
        const expDate = new Date(item.expirationDate);
        const monthsDiff = (expDate.getFullYear() - testDate.getFullYear()) * 12 + 
                          (expDate.getMonth() - testDate.getMonth());
        
        // Should be either short-term (fresh) or long-term (frozen)
        expect(monthsDiff >= -1).toBe(true); // Not too far in past
        expect(monthsDiff <= 12).toBe(true); // Not more than a year
      }
    });
    
    // Cocktail items should generally have longer shelf life
    cocktailItems.forEach(item => {
      if (item.expirationDate) {
        const expDate = new Date(item.expirationDate);
        const monthsDiff = (expDate.getFullYear() - testDate.getFullYear()) * 12 + 
                          (expDate.getMonth() - testDate.getMonth());
        
        // Should be longer shelf life (6 months to 3 years)
        expect(monthsDiff >= 6).toBe(true);
        expect(monthsDiff <= 36).toBe(true);
      }
    });
  });

  it('should have consistent date formats', () => {
    const sampleData = generateSampleData();
    
    sampleData.forEach(item => {
      // Check dateAdded format (YYYY-MM-DD)
      expect(item.dateAdded).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Check expirationDate format if present
      if (item.expirationDate) {
        expect(item.expirationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  it('should generate different data on multiple calls', () => {
    const sampleData1 = generateSampleData();
    const sampleData2 = generateSampleData();
    
    // Should have some variety (not identical)
    const names1 = sampleData1.map(item => item.name).sort();
    const names2 = sampleData2.map(item => item.name).sort();
    
    expect(names1.join(',')).not.toBe(names2.join(','));
  });

  it('should handle frozen items correctly', () => {
    const sampleData = generateSampleData();
    
    const frozenItems = sampleData.filter(item => 
      item.name.toLowerCase().includes('frozen')
    );
    
    // Frozen items should mostly be in freezer (deviceId: 2)
    const frozenInFreezer = frozenItems.filter(item => item.deviceId === 2);
    
    if (frozenItems.length > 0) {
      expect(frozenInFreezer.length / frozenItems.length).toBeGreaterThan(0.7);
    }
  });
});