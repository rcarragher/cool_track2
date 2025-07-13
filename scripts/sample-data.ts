import { format, addDays, addMonths, addYears } from "date-fns";
import type { InsertInventoryItem } from "@shared/schema";

// Sample inventory items by category
const SAMPLE_ITEMS = {
  meat: [
    { name: "Ground Beef (80/20)", quantity: "1 lb" },
    { name: "Chicken Breasts", quantity: "2 lbs" },
    { name: "Salmon Fillets", quantity: "4 pieces" },
    { name: "Pork Chops", quantity: "6 pieces" },
    { name: "Turkey Slices", quantity: "8 oz" },
    { name: "Bacon", quantity: "1 package" },
    { name: "Italian Sausage", quantity: "1 lb" },
    { name: "Ribeye Steaks", quantity: "2 steaks" },
    { name: "Chicken Thighs", quantity: "8 pieces" },
    { name: "Ground Turkey", quantity: "1 lb" },
    { name: "Lamb Chops", quantity: "4 pieces" },
    { name: "Shrimp (frozen)", quantity: "1 lb bag" },
  ],
  "fruit-veg": [
    { name: "Spinach", quantity: "5 oz bag" },
    { name: "Carrots", quantity: "2 lbs" },
    { name: "Broccoli", quantity: "1 head" },
    { name: "Bell Peppers", quantity: "3 pieces" },
    { name: "Frozen Peas", quantity: "16 oz bag" },
    { name: "Frozen Berries", quantity: "12 oz bag" },
    { name: "Bananas", quantity: "6 pieces" },
    { name: "Apples", quantity: "8 pieces" },
    { name: "Lettuce", quantity: "1 head" },
    { name: "Tomatoes", quantity: "4 pieces" },
    { name: "Frozen Corn", quantity: "16 oz bag" },
    { name: "Mushrooms", quantity: "8 oz container" },
    { name: "Onions", quantity: "3 lbs bag" },
    { name: "Potatoes", quantity: "5 lbs bag" },
  ],
  prepared: [
    { name: "Leftover Lasagna", quantity: "4 servings" },
    { name: "Chicken Soup", quantity: "32 oz container" },
    { name: "Frozen Pizza", quantity: "1 pizza" },
    { name: "Meal Prep Containers", quantity: "6 containers" },
    { name: "Leftover Chili", quantity: "24 oz container" },
    { name: "Frozen Burritos", quantity: "8 pack" },
    { name: "Cooked Rice", quantity: "2 cups" },
    { name: "Pasta Salad", quantity: "16 oz container" },
    { name: "Frozen Dumplings", quantity: "20 pieces" },
    { name: "Leftover Roast", quantity: "2 lbs" },
    { name: "Frozen Waffles", quantity: "10 count box" },
    { name: "Prepared Sandwiches", quantity: "4 sandwiches" },
  ],
  cocktail: [
    { name: "Lime Cordial", quantity: "1 cup" },
    { name: "Passion Fruit Syrup", quantity: "750ml bottle" },
    { name: "Cinnamon Syrup", quantity: "750ml bottle" },
    { name: "Simple Syrup", quantity: "2 cups" },
    { name: "Acid Adjusted Grapefruit Juice", quantity: "750ml bottle" },
    { name: "Lime Juice", quantity: "16 oz bottle" },
    { name: "Simple Syrup", quantity: "12 oz bottle" },
    { name: "Tonic Water", quantity: "6 pack" },
    { name: "Club Soda", quantity: "12 pack" },
    { name: "Champagne", quantity: "750ml bottle" },
    { name: "Red Wine", quantity: "750ml bottle" },
    { name: "Craft Beer", quantity: "6 pack" },
  ],
};

// Device IDs (these should match the default devices)
const DEVICE_IDS = {
  refrigerator: 1, // "Main Refrigerator"
  freezer: 2,      // "Garage Freezer"
};

// Generate expiration dates with realistic ranges
function generateExpirationDate(category: string, today: Date): string {
  const randomDays = Math.floor(Math.random() * 10); // Add some randomness
  
  switch (category) {
    case "meat":
      // Meat: 2-7 days for fresh, 3-12 months for frozen
      const isFrozen = Math.random() > 0.3; // 70% frozen
      return isFrozen 
        ? format(addMonths(today, Math.floor(Math.random() * 10) + 3), "yyyy-MM-dd")
        : format(addDays(today, Math.floor(Math.random() * 6) + 2 + randomDays), "yyyy-MM-dd");
    
    case "fruit-veg":
      // Fresh: 3-14 days, Frozen: 6-18 months
      const isFrozenVeg = Math.random() > 0.4; // 60% frozen
      return isFrozenVeg
        ? format(addMonths(today, Math.floor(Math.random() * 13) + 6), "yyyy-MM-dd")
        : format(addDays(today, Math.floor(Math.random() * 12) + 3 + randomDays), "yyyy-MM-dd");
    
    case "prepared":
      // Prepared: 1-5 days for fresh, 1-6 months for frozen
      const isFrozenPrep = Math.random() > 0.5; // 50% frozen
      return isFrozenPrep
        ? format(addMonths(today, Math.floor(Math.random() * 6) + 1), "yyyy-MM-dd")
        : format(addDays(today, Math.floor(Math.random() * 5) + 1 + randomDays), "yyyy-MM-dd");
    
    case "cocktail":
      // Alcohol: much longer shelf life, 6 months to 3 years
      const monthsToAdd = Math.floor(Math.random() * 30) + 6; // 6 months to 3 years
      return format(addMonths(today, monthsToAdd), "yyyy-MM-dd");
    
    default:
      return format(addDays(today, 30), "yyyy-MM-dd");
  }
}

// Determine which device based on item type and category
function getDeviceId(category: string, itemName: string, deviceIds: { refrigerator: number; freezer: number }): number {
  // Frozen items go to freezer
  if (itemName.toLowerCase().includes("frozen") || 
      (category === "meat" && Math.random() > 0.3) || // 70% of meat in freezer
      (category === "prepared" && Math.random() > 0.5)) { // 50% of prepared in freezer
    return deviceIds.freezer;
  }
  
  // Everything else goes to refrigerator
  return deviceIds.refrigerator;
}

export function generateSampleData(today: Date = new Date(), householdId: number = 1, deviceIds = DEVICE_IDS): InsertInventoryItem[] {
  const sampleData: InsertInventoryItem[] = [];
  const todayStr = format(today, "yyyy-MM-dd");
  
  // Generate items from each category
  Object.entries(SAMPLE_ITEMS).forEach(([category, items]) => {
    const itemsToGenerate = Math.floor(items.length * 0.8); // Use ~80% of available items
    
    // Shuffle items and take a subset
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selectedItems = shuffled.slice(0, itemsToGenerate);
    
    selectedItems.forEach((item) => {
      sampleData.push({
        name: item.name,
        category: category as "meat" | "fruit-veg" | "prepared" | "cocktail",
        quantity: item.quantity,
        deviceId: getDeviceId(category, item.name, deviceIds),
        householdId,
        dateAdded: todayStr,
        expirationDate: generateExpirationDate(category, today),
      });
    });
  });
  
  // Ensure we have items expiring soon (next 3 days)
  const soonExpiring = [
    {
      name: "Milk",
      category: "fruit-veg" as const,
      quantity: "1 gallon",
      deviceId: deviceIds.refrigerator,
      householdId,
      dateAdded: todayStr,
      expirationDate: format(addDays(today, 2), "yyyy-MM-dd"),
    },
    {
      name: "Greek Yogurt",
      category: "fruit-veg" as const,
      quantity: "32 oz container",
      deviceId: deviceIds.refrigerator,
      householdId,
      dateAdded: todayStr,
      expirationDate: format(addDays(today, 1), "yyyy-MM-dd"),
    },
    {
      name: "Fresh Fish",
      category: "meat" as const,
      quantity: "2 fillets",
      deviceId: deviceIds.refrigerator,
      householdId,
      dateAdded: todayStr,
      expirationDate: format(addDays(today, 3), "yyyy-MM-dd"),
    },
  ];

  // Add some expired items to make the app more realistic
  const expiredItems = [
    {
      name: "Leftover Pizza",
      category: "prepared" as const,
      quantity: "3 slices",
      deviceId: deviceIds.refrigerator,
      householdId,
      dateAdded: format(addDays(today, -5), "yyyy-MM-dd"),
      expirationDate: format(addDays(today, -2), "yyyy-MM-dd"), // Expired 2 days ago
    },
    {
      name: "Cottage Cheese",
      category: "fruit-veg" as const,
      quantity: "16 oz container",
      deviceId: deviceIds.refrigerator,
      householdId,
      dateAdded: format(addDays(today, -8), "yyyy-MM-dd"),
      expirationDate: format(addDays(today, -1), "yyyy-MM-dd"), // Expired yesterday
    },
    {
      name: "Deli Turkey",
      category: "meat" as const,
      quantity: "8 oz package",
      deviceId: deviceIds.refrigerator,
      householdId,
      dateAdded: format(addDays(today, -10), "yyyy-MM-dd"),
      expirationDate: format(addDays(today, -3), "yyyy-MM-dd"), // Expired 3 days ago
    },
    {
      name: "Fresh Herbs",
      category: "fruit-veg" as const,
      quantity: "1 bunch",
      deviceId: deviceIds.refrigerator,
      householdId,
      dateAdded: format(addDays(today, -6), "yyyy-MM-dd"),
      expirationDate: format(addDays(today, -1), "yyyy-MM-dd"), // Expired yesterday
    },
    {
      name: "Leftover Soup",
      category: "prepared" as const,
      quantity: "16 oz container",
      deviceId: deviceIds.refrigerator,
      householdId,
      dateAdded: format(addDays(today, -7), "yyyy-MM-dd"),
      expirationDate: format(addDays(today, -4), "yyyy-MM-dd"), // Expired 4 days ago
    },
  ];
  
  sampleData.push(...soonExpiring);
  sampleData.push(...expiredItems);
  
  // Shuffle the final array and ensure we have around 50 items
  const shuffledData = sampleData.sort(() => Math.random() - 0.5);
  return shuffledData.slice(0, 50);
}

export default generateSampleData;