'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowDownUp, CheckCircle2, Package, Pencil, Power, Plus, Search } from 'lucide-react'
import { StatCard } from '@/components/clinic/stat-card'
import InventoryItemForm from '@/src/features/inventory/components/inventory-item-form'
import StockAdjustmentForm from '@/src/features/inventory/components/stock-adjustment-form'
import {
  adjustInventoryStock,
  createInventoryItem,
  getInventoryItems,
  getInventoryMovements,
  getInventoryStatus,
  setInventoryItemActive,
  updateInventoryItem,
  type InventoryItemInput,
} from '@/src/lib/repositories/inventory.repository'
import type { InventoryItem, InventoryMovement, InventoryMovementType } from '@/src/types/domain'

type StockFilter = 'ALL' | 'IN_STOCK' | 'RESTOCK_SOON' | 'LOW_STOCK' | 'OUT_OF_STOCK'
type ActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

const categoryOptions = ['Vaccines', 'Surgical Supplies', 'Medication', 'Medical Supplies'] as const

function statusLabel(status: ReturnType<typeof getInventoryStatus>): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statusTone(status: ReturnType<typeof getInventoryStatus>): string {
  if (status === 'LOW_STOCK' || status === 'OUT_OF_STOCK') return 'danger'
  if (status === 'RESTOCK_SOON') return 'warning'
  return 'success'
}

function formatMovementDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ACTIVE')
  const [dialog, setDialog] = useState<'item' | 'stock' | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [notice, setNotice] = useState('')
  const [operationError, setOperationError] = useState('')

  useEffect(() => {
    let isCurrent = true
    void Promise.all([getInventoryItems(), getInventoryMovements()])
      .then(([loadedItems, loadedMovements]) => {
        if (!isCurrent) return
        setItems(loadedItems)
        setMovements(loadedMovements)
      })
      .catch((error: unknown) => {
        if (isCurrent) setLoadError(error instanceof Error ? error.message : 'Inventory could not be loaded.')
      })
      .finally(() => { if (isCurrent) setIsLoading(false) })
    return () => { isCurrent = false }
  }, [])

  const activeItems = items.filter((item) => item.isActive !== false)
  const lowStockCount = activeItems.filter((item) => {
    const status = getInventoryStatus(item.onHand, item.reorderLevel, item.status)
    return status === 'LOW_STOCK' || status === 'OUT_OF_STOCK'
  }).length
  const wellStockedCount = activeItems.length - lowStockCount

  const filteredItems = useMemo(() => items.filter((item) => {
    const normalizedSearch = search.trim().toLowerCase()
    const matchesSearch = !normalizedSearch || [item.name, item.category, item.sku, item.supplier, item.unit]
      .some((value) => value.toLowerCase().includes(normalizedSearch))
    const matchesCategory = category === 'ALL' || item.category === category
    const status = getInventoryStatus(item.onHand, item.reorderLevel, item.status)
    const matchesStock = stockFilter === 'ALL' || status === stockFilter
    const matchesActive = activeFilter === 'ALL'
      || (activeFilter === 'ACTIVE' ? item.isActive !== false : item.isActive === false)
    return matchesSearch && matchesCategory && matchesStock && matchesActive
  }), [items, search, category, stockFilter, activeFilter])

  const openItemForm = (item?: InventoryItem) => {
    setSelectedItem(item ?? null)
    setOperationError('')
    setNotice('')
    setDialog('item')
  }

  const handleSaveItem = async (input: InventoryItemInput) => {
    let savedItem: InventoryItem
    if (selectedItem) {
      const { onHand: _initialStock, ...details } = input
      savedItem = await updateInventoryItem(selectedItem.id, details)
      setNotice(`${savedItem.name} updated.`)
    } else {
      savedItem = await createInventoryItem(input)
      setNotice(`${savedItem.name} added to inventory.`)
    }
    setItems((current) => {
      const exists = current.some((item) => item.id === savedItem.id)
      return exists ? current.map((item) => item.id === savedItem.id ? savedItem : item) : [...current, savedItem]
    })
    setOperationError('')
    setDialog(null)
    setSelectedItem(null)
  }

  const openStockForm = (item: InventoryItem) => {
    setSelectedItem(item)
    setOperationError('')
    setNotice('')
    setDialog('stock')
  }

  const handleStockSave = async (type: InventoryMovementType, quantity: number, reason: string) => {
    if (!selectedItem) throw new Error('Select an active product first.')
    const result = await adjustInventoryStock(selectedItem.id, type, quantity, reason)
    setItems((current) => current.map((item) => item.id === result.item.id ? result.item : item))
    setMovements((current) => [result.movement, ...current])
    setNotice(`Stock movement saved for ${result.item.name}.`)
    setOperationError('')
    setDialog(null)
    setSelectedItem(null)
  }

  const handleActiveChange = async (item: InventoryItem) => {
    const isActivating = item.isActive === false
    if (!isActivating && !window.confirm(`Deactivate ${item.name}? The product and its movement history will be retained.`)) return
    setOperationError('')
    setNotice('')
    try {
      const updated = await setInventoryItemActive(item.id, isActivating)
      setItems((current) => current.map((currentItem) => currentItem.id === updated.id ? updated : currentItem))
      setNotice(isActivating ? `${item.name} activated.` : `${item.name} deactivated.`)
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'The product status could not be saved.')
      setNotice('')
    }
  }

  return (
    <div className="content inner-page">
      <div className="page-heading">
        <div><h1>Inventory</h1><p>Track medications, supplies, and clinic reorder levels.</p></div>
        <button type="button" className="new-appointment" onClick={() => openItemForm()}><Plus size={18} /> Add Inventory Item</button>
      </div>

      {notice && <p className="mb-5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-300" role="status">{notice}</p>}
      {operationError && <p className="mb-5 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-300" role="alert">{operationError}</p>}

      <div className="inventory-stats">
        <StatCard icon={Package} label="TOTAL ITEMS" value={String(activeItems.length)} change="Active" tone="blue" />
        <StatCard icon={AlertTriangle} label="LOW STOCK" value={String(lowStockCount)} change="Action" tone="red" />
        <StatCard icon={CheckCircle2} label="WELL STOCKED" value={String(wellStockedCount)} change={activeItems.length ? `${Math.round((wellStockedCount / activeItems.length) * 100)}%` : '0%'} tone="purple" />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex min-w-56 flex-1 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400"><Search size={18} /><input className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" aria-label="Search inventory" placeholder="Search name, SKU, supplier..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <select aria-label="Filter by category" className="date-button" value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">All categories</option>{categoryOptions.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Filter by stock status" className="date-button" value={stockFilter} onChange={(event) => setStockFilter(event.target.value as StockFilter)}><option value="ALL">All stock levels</option><option value="IN_STOCK">In stock</option><option value="RESTOCK_SOON">Restock soon</option><option value="LOW_STOCK">Low stock</option><option value="OUT_OF_STOCK">Out of stock</option></select>
        <select aria-label="Filter by product availability" className="date-button" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}><option value="ACTIVE">Active products</option><option value="INACTIVE">Inactive products</option><option value="ALL">All products</option></select>
      </div>

      <section className="inventory-table" aria-label="Inventory products">
        <div className="directory-head"><span>ITEM</span><span>CATEGORY</span><span>ON HAND</span><span>REORDER LEVEL</span><span>STATUS</span><span>ACTION</span></div>
        {isLoading ? <p className="p-6 text-slate-400" role="status">Loading inventory...</p>
          : loadError ? <p className="p-6 text-rose-300" role="alert">{loadError}</p>
            : filteredItems.length === 0 ? <p className="p-6 text-slate-400" role="status">{items.length ? 'No products match these search and filter settings.' : 'No inventory products are available.'}</p>
              : filteredItems.map((item) => {
                const status = getInventoryStatus(item.onHand, item.reorderLevel, item.status)
                return (
                  <div className="directory-row inventory-row" key={item.id}>
                    <div className="min-w-0"><strong className="block truncate">{item.name}</strong><span className="mt-1 block text-xs text-slate-400">{item.sku}{item.isActive === false ? ' · Inactive' : ''}</span></div>
                    <span>{item.category}</span>
                    <span>{item.onHand} {item.unit}</span>
                    <span>{item.reorderLevel} {item.unit}</span>
                    <b className={statusTone(status)}>{statusLabel(status)}</b>
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" className="icon-button" aria-label={`Edit ${item.name}`} title="Edit product" onClick={() => openItemForm(item)}><Pencil size={17} /></button>
                      {item.isActive !== false && <button type="button" className="icon-button" aria-label={`Adjust stock for ${item.name}`} title="Adjust stock" onClick={() => openStockForm(item)}><ArrowDownUp size={17} /></button>}
                      <button type="button" className="icon-button" aria-label={`${item.isActive === false ? 'Activate' : 'Deactivate'} ${item.name}`} title={item.isActive === false ? 'Activate product' : 'Deactivate product'} onClick={() => void handleActiveChange(item)}><Power size={17} /></button>
                    </div>
                  </div>
                )
              })}
      </section>

      <section className="panel mt-8 overflow-hidden" aria-labelledby="inventory-history-heading">
        <header className="panel-header"><h2 id="inventory-history-heading">Stock Movement History</h2><span className="text-sm text-slate-400">{movements.length} movements</span></header>
        {isLoading ? <p className="p-6 text-slate-400" role="status">Loading movement history...</p>
          : loadError ? <p className="p-6 text-rose-300" role="alert">{loadError}</p>
            : movements.length === 0 ? <p className="p-6 text-slate-400">No stock movements have been recorded yet.</p>
              : <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="text-xs text-slate-400"><tr><th className="px-5 py-4">PRODUCT</th><th className="px-5 py-4">TYPE</th><th className="px-5 py-4">QUANTITY</th><th className="px-5 py-4">REASON</th><th className="px-5 py-4">DATE</th><th className="px-5 py-4">STOCK AFTER</th></tr></thead><tbody>{movements.map((movement) => <tr className="border-t border-slate-700" key={movement.id}><td className="px-5 py-4"><strong>{movement.productName}</strong><span className="block text-xs text-slate-400">{movement.itemId}</span></td><td className={`px-5 py-4 font-semibold ${movement.type === 'IN' ? 'text-emerald-400' : 'text-amber-400'}`}>{movement.type === 'IN' ? 'Stock entry' : 'Stock withdrawal'}</td><td className="px-5 py-4">{movement.quantity} {movement.unit}</td><td className="px-5 py-4">{movement.reason}<span className="block text-xs text-slate-400">Before: {movement.previousStock} {movement.unit}</span></td><td className="px-5 py-4">{formatMovementDate(movement.createdAt)}</td><td className="px-5 py-4">{movement.resultingStock} {movement.unit}</td></tr>)}</tbody></table></div>}
      </section>

      {dialog === 'item' && <InventoryItemForm key={selectedItem?.id ?? 'new'} item={selectedItem ?? undefined} onCancel={() => { setDialog(null); setSelectedItem(null) }} onSave={handleSaveItem} />}
      {dialog === 'stock' && selectedItem && <StockAdjustmentForm key={selectedItem.id} item={selectedItem} onCancel={() => { setDialog(null); setSelectedItem(null) }} onSave={handleStockSave} />}
    </div>
  )
}
