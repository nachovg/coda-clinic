'use client'

import { useState, type FormEvent } from 'react'
import { ArrowDownUp, X } from 'lucide-react'
import type { InventoryItem, InventoryMovementType } from '@/src/types/domain'

const fieldClass = 'mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
const reasons = ['Purchase', 'Usage', 'Return', 'Damaged', 'Expired', 'Correction', 'Other']

export default function StockAdjustmentForm({
  item,
  onCancel,
  onSave,
}: {
  item: InventoryItem
  onCancel: () => void
  onSave: (type: InventoryMovementType, quantity: number, reason: string) => Promise<void>
}) {
  const [type, setType] = useState<InventoryMovementType>('IN')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState(reasons[0])
  const [details, setDetails] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsedQuantity = Number(quantity)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setErrorMessage('Enter a quantity greater than zero.')
      return
    }
    if (type === 'OUT' && parsedQuantity > item.onHand) {
      setErrorMessage(`Only ${item.onHand} ${item.unit} are available.`)
      return
    }
    if (reason === 'Other' && !details.trim()) {
      setErrorMessage('Enter a reason for this movement.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    try {
      await onSave(type, parsedQuantity, reason === 'Other' ? details.trim() : reason)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The stock movement could not be saved.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-10" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
      <section className="panel w-full max-w-xl p-6 md:p-8" role="dialog" aria-modal="true" aria-labelledby="stock-form-title">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><h2 id="stock-form-title" className="text-xl font-semibold text-white">Adjust Stock</h2><p className="mt-1 text-sm text-slate-400">{item.name} · Current stock: {item.onHand} {item.unit}</p></div>
          <button type="button" className="icon-button" aria-label="Close stock adjustment" onClick={onCancel}><X size={20} /></button>
        </div>
        {errorMessage && <p className="mb-5 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-300" role="alert">{errorMessage}</p>}
        <form onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-200">Movement type *<select className={fieldClass} value={type} onChange={(event) => setType(event.target.value as InventoryMovementType)}><option value="IN">Stock entry</option><option value="OUT">Stock withdrawal</option></select></label>
            <label className="text-sm font-medium text-slate-200">Quantity *<input className={fieldClass} type="number" min="0" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
            <label className="text-sm font-medium text-slate-200 md:col-span-2">Reason *<select className={fieldClass} value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map((value) => <option key={value}>{value}</option>)}</select></label>
            {reason === 'Other' && <label className="text-sm font-medium text-slate-200 md:col-span-2">Reason details *<input className={fieldClass} value={details} onChange={(event) => setDetails(event.target.value)} /></label>}
          </div>
          <p className="mt-5 text-sm text-slate-400">{type === 'IN' ? 'Stock after entry' : 'Stock after withdrawal'}: <strong className="text-slate-200">{type === 'IN' ? item.onHand + (Number(quantity) || 0) : Math.max(0, item.onHand - (Number(quantity) || 0))} {item.unit}</strong></p>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-700 pt-6">
            <button type="button" className="date-button" onClick={onCancel} disabled={isSaving}>Cancel</button>
            <button type="submit" className="new-appointment disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving || !quantity}><ArrowDownUp size={18} /> {isSaving ? 'Saving...' : 'Save Movement'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
