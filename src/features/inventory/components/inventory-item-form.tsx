'use client'

import { useState, type FormEvent } from 'react'
import { Save, X } from 'lucide-react'
import type { InventoryCategory, InventoryItem } from '@/src/types/domain'
import type { InventoryItemInput } from '@/src/lib/repositories/inventory.repository'

const categories: InventoryCategory[] = ['Vaccines', 'Surgical Supplies', 'Medication', 'Medical Supplies']
const fieldClass = 'mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'

type FormValues = {
  name: string
  category: InventoryCategory
  sku: string
  onHand: string
  reorderLevel: string
  unit: string
  supplier: string
  unitCost: string
  expirationDate: string
}

export default function InventoryItemForm({
  item,
  onCancel,
  onSave,
}: {
  item?: InventoryItem
  onCancel: () => void
  onSave: (input: InventoryItemInput) => Promise<void>
}) {
  const [values, setValues] = useState<FormValues>(() => ({
    name: item?.name ?? '',
    category: item?.category ?? 'Medical Supplies',
    sku: item?.sku ?? '',
    onHand: String(item?.onHand ?? ''),
    reorderLevel: String(item?.reorderLevel ?? ''),
    unit: item?.unit ?? '',
    supplier: item?.supplier ?? '',
    unitCost: String(item?.unitCost ?? ''),
    expirationDate: item?.expirationDate ?? '',
  }))
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const update = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrorMessage('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const onHand = Number(values.onHand)
    const reorderLevel = Number(values.reorderLevel)
    const unitCost = Number(values.unitCost)
    if (!item && (!Number.isFinite(onHand) || values.onHand.trim() === '' || onHand < 0)) {
      setErrorMessage('Initial stock must be zero or greater.')
      return
    }
    if (!Number.isFinite(reorderLevel) || values.reorderLevel.trim() === '' || reorderLevel < 0) {
      setErrorMessage('Reorder level must be zero or greater.')
      return
    }
    if (!Number.isFinite(unitCost) || values.unitCost.trim() === '' || unitCost < 0) {
      setErrorMessage('Unit cost must be zero or greater.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    try {
      await onSave({
        name: values.name.trim(),
        category: values.category,
        sku: values.sku.trim(),
        onHand: item ? item.onHand : onHand,
        reorderLevel,
        unit: values.unit.trim(),
        supplier: values.supplier.trim(),
        unitCost,
        expirationDate: values.expirationDate || null,
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The inventory item could not be saved.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-10" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
      <section className="panel w-full max-w-3xl p-6 md:p-8" role="dialog" aria-modal="true" aria-labelledby="inventory-form-title">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="inventory-form-title" className="text-xl font-semibold text-white">{item ? 'Edit Inventory Item' : 'Add Inventory Item'}</h2>
            <p className="mt-1 text-sm text-slate-400">{item ? 'Update product details. Current stock is preserved.' : 'Add a product and its starting stock to the clinic inventory.'}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close product form" onClick={onCancel}><X size={20} /></button>
        </div>
        {errorMessage && <p className="mb-5 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-300" role="alert">{errorMessage}</p>}
        <form onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-200">Product name *<input className={fieldClass} required maxLength={100} value={values.name} onChange={(event) => update('name', event.target.value)} /></label>
            <label className="text-sm font-medium text-slate-200">Category *<select className={fieldClass} value={values.category} onChange={(event) => update('category', event.target.value as InventoryCategory)}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-200">SKU *<input className={fieldClass} required maxLength={60} value={values.sku} onChange={(event) => update('sku', event.target.value)} /></label>
            <label className="text-sm font-medium text-slate-200">Unit *<input className={fieldClass} required maxLength={30} placeholder="units, tablets, pairs..." value={values.unit} onChange={(event) => update('unit', event.target.value)} /></label>
            {!item ? (
              <label className="text-sm font-medium text-slate-200">Initial stock *<input className={fieldClass} required type="number" min="0" step="any" value={values.onHand} onChange={(event) => update('onHand', event.target.value)} /></label>
            ) : (
              <div className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-400">Current stock is preserved: <strong className="text-slate-200">{item.onHand} {item.unit}</strong></div>
            )}
            <label className="text-sm font-medium text-slate-200">Reorder level *<input className={fieldClass} required type="number" min="0" step="any" value={values.reorderLevel} onChange={(event) => update('reorderLevel', event.target.value)} /></label>
            <label className="text-sm font-medium text-slate-200">Supplier *<input className={fieldClass} required maxLength={100} value={values.supplier} onChange={(event) => update('supplier', event.target.value)} /></label>
            <label className="text-sm font-medium text-slate-200">Unit cost *<input className={fieldClass} required type="number" min="0" step="any" value={values.unitCost} onChange={(event) => update('unitCost', event.target.value)} /></label>
            <label className="text-sm font-medium text-slate-200 md:col-span-2">Expiration date <span className="font-normal text-slate-400">(optional)</span><input className={fieldClass} type="date" value={values.expirationDate} onChange={(event) => update('expirationDate', event.target.value)} /></label>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-700 pt-6">
            <button type="button" className="date-button" onClick={onCancel} disabled={isSaving}>Cancel</button>
            <button type="submit" className="new-appointment disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving || !values.name.trim() || !values.sku.trim() || !values.unit.trim() || !values.supplier.trim()}><Save size={18} /> {isSaving ? 'Saving...' : item ? 'Save Changes' : 'Save Item'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
