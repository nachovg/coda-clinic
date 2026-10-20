import { codaMockData } from "@/src/lib/mock-data";
import type {
  InventoryCategory,
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
  InventoryStatus,
} from "@/src/types/domain";

const inventoryStorageKey = "coda.inventoryState";
const inventoryCategories: InventoryCategory[] = ["Vaccines", "Surgical Supplies", "Medication", "Medical Supplies"];

export type InventoryItemInput = Pick<InventoryItem,
  | "name"
  | "category"
  | "sku"
  | "onHand"
  | "reorderLevel"
  | "unit"
  | "supplier"
  | "unitCost"
  | "expirationDate"
>;

export type InventoryItemDetails = Omit<InventoryItemInput, "onHand">;

interface InventoryState {
  createdItems: InventoryItem[];
  updatedItems: Record<string, InventoryItem>;
  movements: InventoryMovement[];
}

const emptyState = (): InventoryState => ({ createdItems: [], updatedItems: {}, movements: [] });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInventoryStatus(value: unknown): value is InventoryStatus {
  return value === "IN_STOCK" || value === "RESTOCK_SOON" || value === "LOW_STOCK" || value === "OUT_OF_STOCK";
}

function isInventoryCategory(value: unknown): value is InventoryCategory {
  return inventoryCategories.includes(value as InventoryCategory);
}

function isDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year)
    && date.getUTCMonth() === Number(month) - 1
    && date.getUTCDate() === Number(day);
}

function isInventoryItem(value: unknown): value is InventoryItem {
  return isRecord(value)
    && typeof value.id === "string" && value.id.trim().length > 0
    && typeof value.clinicId === "string" && value.clinicId.trim().length > 0
    && typeof value.name === "string" && value.name.trim().length > 0
    && isInventoryCategory(value.category)
    && typeof value.sku === "string" && value.sku.trim().length > 0
    && typeof value.onHand === "number" && Number.isFinite(value.onHand) && value.onHand >= 0
    && typeof value.reorderLevel === "number" && Number.isFinite(value.reorderLevel) && value.reorderLevel >= 0
    && typeof value.unit === "string" && value.unit.trim().length > 0
    && isInventoryStatus(value.status)
    && typeof value.supplier === "string" && value.supplier.trim().length > 0
    && typeof value.unitCost === "number" && Number.isFinite(value.unitCost) && value.unitCost >= 0
    && (value.expirationDate === null || (typeof value.expirationDate === "string" && isDateOnly(value.expirationDate)))
    && (value.isActive === undefined || typeof value.isActive === "boolean");
}

function isInventoryMovement(value: unknown): value is InventoryMovement {
  return isRecord(value)
    && typeof value.id === "string" && value.id.trim().length > 0
    && typeof value.itemId === "string" && value.itemId.trim().length > 0
    && typeof value.productName === "string"
    && typeof value.unit === "string"
    && (value.type === "IN" || value.type === "OUT")
    && typeof value.quantity === "number" && Number.isFinite(value.quantity) && value.quantity > 0
    && typeof value.previousStock === "number" && Number.isFinite(value.previousStock) && value.previousStock >= 0
    && typeof value.resultingStock === "number" && Number.isFinite(value.resultingStock) && value.resultingStock >= 0
    && typeof value.reason === "string" && value.reason.trim().length > 0
    && typeof value.createdAt === "string" && !Number.isNaN(Date.parse(value.createdAt));
}

function withDefaults(item: InventoryItem): InventoryItem {
  return { ...item, isActive: item.isActive ?? true };
}

function readInventoryState(): InventoryState {
  if (typeof window === "undefined") return emptyState();

  let storedValue: string | null;
  try {
    storedValue = window.localStorage.getItem(inventoryStorageKey);
  } catch {
    throw new Error("Inventory storage is unavailable.");
  }
  if (storedValue === null) return emptyState();

  let parsed: unknown;
  try {
    parsed = JSON.parse(storedValue);
  } catch {
    throw new Error("Inventory storage is corrupted. Clear or repair the local inventory data before continuing.");
  }
  if (!isRecord(parsed)) {
    throw new Error("Inventory storage has an invalid format.");
  }

  const updatedItems: Record<string, InventoryItem> = {};
  if (isRecord(parsed.updatedItems)) {
    for (const [id, value] of Object.entries(parsed.updatedItems)) {
      if (isInventoryItem(value) && value.id === id) updatedItems[id] = withDefaults(value);
    }
  }

  return {
    createdItems: Array.isArray(parsed.createdItems) ? parsed.createdItems.filter(isInventoryItem).map(withDefaults) : [],
    updatedItems,
    movements: Array.isArray(parsed.movements) ? parsed.movements.filter(isInventoryMovement) : [],
  };
}

function saveInventoryState(state: InventoryState): void {
  if (typeof window === "undefined") throw new Error("Inventory storage is only available in the browser.");
  try {
    window.localStorage.setItem(inventoryStorageKey, JSON.stringify(state));
  } catch {
    throw new Error("Inventory changes could not be saved. Check browser storage and try again.");
  }
}

function getItems(state: InventoryState): InventoryItem[] {
  const originalIds = new Set(codaMockData.inventory.map((item) => item.id));
  const originals = codaMockData.inventory.map((item) => withDefaults(state.updatedItems[item.id] ?? item));
  const created = state.createdItems.filter((item) => !originalIds.has(item.id));
  return [...originals, ...created];
}

export function getInventoryStatus(
  onHand: number,
  reorderLevel: number,
  existingStatus?: InventoryStatus,
): InventoryStatus {
  if (onHand <= 0) return "OUT_OF_STOCK";
  if (onHand <= reorderLevel) return "LOW_STOCK";
  // Keep the JSON's explicit RESTOCK_SOON status; the data has no separate threshold for it.
  if (existingStatus === "RESTOCK_SOON") return "RESTOCK_SOON";
  return "IN_STOCK";
}

function validateItemInput(input: InventoryItemInput | InventoryItemDetails): void {
  if (!input.name.trim() || !input.sku.trim() || !input.unit.trim() || !input.supplier.trim()) {
    throw new Error("Name, SKU, unit, and supplier are required.");
  }
  if (!isInventoryCategory(input.category)) throw new Error("Select a valid inventory category.");
  if ("onHand" in input && (!Number.isFinite(input.onHand) || input.onHand < 0)) {
    throw new Error("Initial stock must be zero or greater.");
  }
  if (!Number.isFinite(input.reorderLevel) || input.reorderLevel < 0) throw new Error("Reorder level must be zero or greater.");
  if (!Number.isFinite(input.unitCost) || input.unitCost < 0) throw new Error("Unit cost must be zero or greater.");
  if (input.expirationDate !== null && !isDateOnly(input.expirationDate)) throw new Error("Enter a valid expiration date.");
}

function assertUniqueSku(items: InventoryItem[], sku: string, exceptId?: string): void {
  if (items.some((item) => item.id !== exceptId && item.sku.toLowerCase() === sku.trim().toLowerCase())) {
    throw new Error("A product with this SKU already exists.");
  }
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  return getItems(readInventoryState());
}

export async function searchInventory(query: string): Promise<InventoryItem[]> {
  const items = await getInventoryItems();
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;
  return items.filter((item) => [item.name, item.category, item.sku, item.supplier, item.unit]
    .some((value) => value.toLowerCase().includes(normalizedQuery)));
}

export async function getLowStockItems(): Promise<InventoryItem[]> {
  return (await getInventoryItems()).filter((item) => {
    const status = getInventoryStatus(item.onHand, item.reorderLevel);
    return item.isActive !== false && (status === "LOW_STOCK" || status === "OUT_OF_STOCK");
  });
}

export async function getInventoryMovements(): Promise<InventoryMovement[]> {
  return readInventoryState().movements
    .map((movement, index) => ({ movement, index }))
    .sort((left, right) => right.movement.createdAt.localeCompare(left.movement.createdAt) || right.index - left.index)
    .map(({ movement }) => movement);
}

export async function createInventoryItem(input: InventoryItemInput): Promise<InventoryItem> {
  validateItemInput(input);
  const state = readInventoryState();
  const items = getItems(state);
  assertUniqueSku(items, input.sku);
  const item: InventoryItem = {
    ...input,
    id: `inv_${crypto.randomUUID()}`,
    clinicId: codaMockData.clinic.id,
    status: getInventoryStatus(input.onHand, input.reorderLevel),
    isActive: true,
  };
  state.createdItems = [...state.createdItems.filter((existing) => existing.id !== item.id), item];
  if (item.onHand > 0) {
    state.movements = [...state.movements, {
      id: `mov_${crypto.randomUUID()}`,
      itemId: item.id,
      productName: item.name,
      unit: item.unit,
      type: "IN",
      quantity: item.onHand,
      previousStock: 0,
      resultingStock: item.onHand,
      reason: "Initial stock",
      createdAt: new Date().toISOString(),
    }];
  }
  saveInventoryState(state);
  return item;
}

export async function updateInventoryItem(itemId: string, details: InventoryItemDetails): Promise<InventoryItem> {
  validateItemInput(details);
  const state = readInventoryState();
  const current = getItems(state).find((item) => item.id === itemId);
  if (!current) throw new Error("Inventory item could not be found.");
  assertUniqueSku(getItems(state), details.sku, itemId);
  const updated: InventoryItem = {
    ...current,
    ...details,
    onHand: current.onHand,
    status: getInventoryStatus(current.onHand, details.reorderLevel, current.status),
    isActive: current.isActive ?? true,
  };

  const original = codaMockData.inventory.some((item) => item.id === itemId);
  if (original) state.updatedItems[itemId] = updated;
  else state.createdItems = state.createdItems.map((item) => item.id === itemId ? updated : item);
  saveInventoryState(state);
  return updated;
}

export async function adjustInventoryStock(
  itemId: string,
  type: InventoryMovementType,
  quantity: number,
  reason: string,
): Promise<{ item: InventoryItem; movement: InventoryMovement }> {
  if (type !== "IN" && type !== "OUT") throw new Error("Select a valid movement type.");
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Movement quantity must be greater than zero.");
  if (!reason.trim()) throw new Error("A movement reason is required.");

  const state = readInventoryState();
  const item = getItems(state).find((current) => current.id === itemId);
  if (!item) throw new Error("Inventory item could not be found.");
  if (item.isActive === false) throw new Error("Re-activate this item before recording a new movement.");
  const resultingStock = type === "IN" ? item.onHand + quantity : item.onHand - quantity;
  if (resultingStock < 0) throw new Error("This quantity exceeds the available stock.");

  const updatedItem: InventoryItem = {
    ...item,
    onHand: resultingStock,
    status: getInventoryStatus(resultingStock, item.reorderLevel, item.status),
  };
  const movement: InventoryMovement = {
    id: `mov_${crypto.randomUUID()}`,
    itemId: item.id,
    productName: item.name,
    unit: item.unit,
    type,
    quantity,
    previousStock: item.onHand,
    resultingStock,
    reason: reason.trim(),
    createdAt: new Date().toISOString(),
  };

  if (codaMockData.inventory.some((original) => original.id === itemId)) state.updatedItems[itemId] = updatedItem;
  else state.createdItems = state.createdItems.map((current) => current.id === itemId ? updatedItem : current);
  state.movements = [...state.movements, movement];
  saveInventoryState(state);
  return { item: updatedItem, movement };
}

export async function setInventoryItemActive(itemId: string, isActive: boolean): Promise<InventoryItem> {
  const state = readInventoryState();
  const item = getItems(state).find((current) => current.id === itemId);
  if (!item) throw new Error("Inventory item could not be found.");
  const updated = { ...item, isActive };
  if (codaMockData.inventory.some((original) => original.id === itemId)) state.updatedItems[itemId] = updated;
  else state.createdItems = state.createdItems.map((current) => current.id === itemId ? updated : current);
  saveInventoryState(state);
  return updated;
}
