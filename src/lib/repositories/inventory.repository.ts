import { codaMockData } from "@/src/lib/mock-data";
import type { InventoryItem } from "@/src/types/domain";

const items = codaMockData.inventory as InventoryItem[];

export async function getInventoryItems(): Promise<InventoryItem[]> {
  return items;
}

export async function getLowStockItems(): Promise<InventoryItem[]> {
  return items.filter((item) => item.status === "LOW_STOCK" || item.status === "OUT_OF_STOCK");
}
