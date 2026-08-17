import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Client, Invoice, InvoiceInput, LineItem } from '../types'
import {
  addDaysISO,
  formatMoney,
  invoiceTotals,
  todayISO,
  uid,
} from '../storage'

type InvoiceBuilderProps = {
  clients: Client[]
  invoice: Invoice | null
  onCancel: () => void
  onSave: (input: InvoiceInput) => void
}

function emptyItem(): LineItem {
  return { id: uid(), description: '', quantity: 1, rate: 0 }
}

export function InvoiceBuilder({ clients, invoice, onCancel, onSave }: InvoiceBuilderProps) {
  const [clientId, setClientId] = useState(invoice?.clientId ?? clients[0]?.id ?? '')
  const [dueDate, setDueDate] = useState(invoice?.dueDate ?? addDaysISO(todayISO(), 14))
  const [taxPercent, setTaxPercent] = useState(invoice?.taxPercent ?? 8.5)
  const [discount, setDiscount] = useState(invoice?.discount ?? 0)
  const [notes, setNotes] = useState(invoice?.notes ?? '')
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.lineItems.length ? invoice.lineItems : [emptyItem()],
  )
  const [error, setError] = useState<string | null>(null)

  const totals = useMemo(
    () => invoiceTotals({ lineItems, taxPercent, discount }),
    [lineItems, taxPercent, discount],
  )
  const client = clients.find((entry) => entry.id === clientId)

  function updateItem(id: string, patch: Partial<LineItem>) {
    setLineItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function submit(markSent: boolean) {
    const cleaned = lineItems.filter((item) => item.description.trim().length > 0)
    if (!clientId) {
      setError('Choose a client.')
      return
    }
    if (cleaned.length === 0) {
      setError('Add at least one line item with a description.')
      return
    }
    onSave({
      id: invoice?.id ?? null,
      clientId,
      dueDate,
      lineItems: cleaned.map((item) => ({
        ...item,
        quantity: Math.max(0, item.quantity),
        rate: Math.max(0, item.rate),
      })),
      taxPercent: Math.max(0, taxPercent),
      discount: Math.max(0, discount),
      notes: notes.trim(),
      markSent,
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(false)
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Composer</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-forest">
          {invoice ? invoice.number : 'New invoice'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Line items, tax, and a paper preview. Save as a draft or mark sent.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <label className="block text-[11px] tracking-[0.18em] text-muted uppercase">
            Client
            <select
              required
              className="mt-1 w-full border border-forest/15 bg-white/60 px-3 py-2.5 text-sm text-ink normal-case tracking-normal outline-none focus:border-gold"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
            >
              {clients.length === 0 ? <option value="">Add a client first</option> : null}
              {clients.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.company}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] tracking-[0.18em] text-muted uppercase">
            Due date
            <input
              type="date"
              required
              className="mt-1 w-full border border-forest/15 bg-white/60 px-3 py-2.5 text-sm text-ink normal-case tracking-normal outline-none focus:border-gold"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] tracking-[0.18em] text-muted uppercase">Line items</p>
              <button
                type="button"
                onClick={() => setLineItems((current) => [...current, emptyItem()])}
                className="inline-flex items-center gap-1 text-xs text-forest hover:text-forest-mid"
              >
                <Plus size={14} strokeWidth={1.6} />
                Add row
              </button>
            </div>
            <div className="space-y-2">
              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_70px_90px_36px] gap-2">
                  <input
                    placeholder="Description"
                    className="border border-forest/15 bg-white/60 px-3 py-2 text-sm outline-none focus:border-gold"
                    value={item.description}
                    onChange={(event) => updateItem(item.id, { description: event.target.value })}
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.25}
                    className="border border-forest/15 bg-white/60 px-2 py-2 text-sm tabular-nums outline-none focus:border-gold"
                    value={item.quantity}
                    onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })}
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="border border-forest/15 bg-white/60 px-2 py-2 text-sm tabular-nums outline-none focus:border-gold"
                    value={item.rate}
                    onChange={(event) => updateItem(item.id, { rate: Number(event.target.value) })}
                  />
                  <button
                    type="button"
                    disabled={lineItems.length === 1}
                    onClick={() => setLineItems((current) => current.filter((row) => row.id !== item.id))}
                    className="text-muted hover:text-[#9a3b2f] disabled:opacity-30"
                    aria-label="Remove line"
                  >
                    <Trash2 size={15} strokeWidth={1.6} />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">Columns: description, quantity, rate.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[11px] tracking-[0.18em] text-muted uppercase">
              Tax %
              <input
                type="number"
                min={0}
                step={0.01}
                className="mt-1 w-full border border-forest/15 bg-white/60 px-3 py-2 text-sm tabular-nums text-ink normal-case tracking-normal outline-none focus:border-gold"
                value={taxPercent}
                onChange={(event) => setTaxPercent(Number(event.target.value))}
              />
            </label>
            <label className="block text-[11px] tracking-[0.18em] text-muted uppercase">
              Discount ($)
              <input
                type="number"
                min={0}
                step={0.01}
                className="mt-1 w-full border border-forest/15 bg-white/60 px-3 py-2 text-sm tabular-nums text-ink normal-case tracking-normal outline-none focus:border-gold"
                value={discount}
                onChange={(event) => setDiscount(Number(event.target.value))}
              />
            </label>
          </div>
          <label className="block text-[11px] tracking-[0.18em] text-muted uppercase">
            Notes
            <textarea
              rows={4}
              className="mt-1 w-full border border-forest/15 bg-white/60 px-3 py-2 text-sm text-ink normal-case tracking-normal outline-none focus:border-gold"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-[#9a3b2f]">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="border border-forest/20 px-4 py-2.5 text-sm text-forest hover:border-gold">
              Save draft
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              className="bg-forest px-4 py-2.5 text-sm text-cream hover:bg-forest-mid"
            >
              Save & mark sent
            </button>
            <button type="button" onClick={onCancel} className="px-4 py-2.5 text-sm text-muted hover:text-forest">
              Cancel
            </button>
          </div>
        </div>

        <aside className="border border-gold/50 bg-cream p-6 shadow-[0_18px_50px_rgba(15,61,50,0.08)]">
          <p className="text-[10px] tracking-[0.32em] text-gold uppercase">Preview</p>
          <p className="mt-2 font-display text-2xl text-forest">{invoice?.number ?? 'INV-2026-····'}</p>
          <div className="mt-4 h-px bg-gold" />
          <p className="mt-4 text-xs text-muted">Bill to</p>
          <p className="mt-1 font-medium text-forest">{client?.company ?? 'Select a client'}</p>
          <p className="mt-1 whitespace-pre-line text-xs text-muted">{client?.address}</p>
          <ul className="mt-6 space-y-2 text-sm">
            {lineItems
              .filter((item) => item.description.trim())
              .map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>{item.description}</span>
                  <span className="tabular-nums">{formatMoney(item.quantity * item.rate)}</span>
                </li>
              ))}
          </ul>
          <div className="mt-6 space-y-1 border-t border-gold/40 pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Discount</span>
              <span className="tabular-nums">−{formatMoney(totals.discount)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Tax</span>
              <span className="tabular-nums">{formatMoney(totals.tax)}</span>
            </div>
            <div className="flex justify-between pt-2 font-display text-xl text-forest">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(totals.total)}</span>
            </div>
          </div>
          {notes ? <p className="mt-6 text-xs leading-relaxed text-muted">{notes}</p> : null}
        </aside>
      </form>
    </div>
  )
}
