import { codaMockData } from "@/src/lib/mock-data";
import type { InventoryItem } from "@/src/types/domain";

const items = codaMockData.inventory;

export async function getInventoryItems(): Promise<InventoryItem[]> {
  return items;
}

export async function searchInventory(query: string): Promise<InventoryItem[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;
  return items.filter((item) => [item.name, item.category, item.sku].some((value) => value.toLowerCase().includes(normalizedQuery)));
}

export async function getLowStockItems(): Promise<InventoryItem[]> {
  return items.filter((item) => item.status === "LOW_STOCK" || item.status === "OUT_OF_STOCK");
}
