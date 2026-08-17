import { Check, Download, Pencil, Send } from 'lucide-react'
import type { Client, Invoice, InvoiceStatus } from '../types'
import {
  STATUS_LABEL,
  STATUS_TONE,
  effectiveStatus,
  findClient,
  formatDate,
  formatMoney,
  invoiceTotals,
} from '../storage'

const FILTERS: Array<{ id: 'all' | InvoiceStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
]

type InvoiceListProps = {
  invoices: Invoice[]
  clients: Client[]
  isAdmin: boolean
  filter: 'all' | InvoiceStatus
  onFilter: (filter: 'all' | InvoiceStatus) => void
  onCreate: () => void
  onEdit: (id: string) => void
  onMarkSent: (id: string) => void
  onMarkPaid: (id: string) => void
  onDownload: (id: string) => void
}

export function InvoiceList({
  invoices,
  clients,
  isAdmin,
  filter,
  onFilter,
  onCreate,
  onEdit,
  onMarkSent,
  onMarkPaid,
  onDownload,
}: InvoiceListProps) {
  const visible = invoices.filter((invoice) => {
    if (filter === 'all') return true
    return effectiveStatus(invoice) === filter
  })

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Bills</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-forest">Invoices</h1>
          <p className="mt-2 text-sm text-muted">
            {isAdmin
              ? 'Draft, send, collect, and export branded PDFs.'
              : 'Your company’s invoices — download a copy whenever you need one.'}
          </p>
        </div>
        {isAdmin ? (
          <button
            type="button"
            onClick={onCreate}
            className="bg-forest px-4 py-2.5 text-sm text-cream hover:bg-forest-mid"
          >
            New invoice
          </button>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.filter((item) => isAdmin || item.id !== 'draft').map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilter(item.id)}
            className={`px-3 py-1.5 text-[11px] tracking-[0.16em] uppercase ${
              filter === item.id
                ? 'bg-forest text-cream'
                : 'border border-forest/15 text-muted hover:border-gold'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-forest/10 bg-white/40">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-gold/40 text-[11px] tracking-[0.18em] text-muted uppercase">
              <th className="px-4 py-3 font-medium">Number</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Issued</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-muted">
                  No invoices in this view.
                </td>
              </tr>
            ) : (
              visible.map((invoice) => {
                const status = effectiveStatus(invoice)
                const client = findClient(clients, invoice.clientId)
                return (
                  <tr key={invoice.id} className="border-b border-gold/20 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{invoice.number}</td>
                    <td className="px-4 py-3">{client?.company ?? '—'}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(invoice.issuedAt)}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(invoice.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[10px] tracking-[0.16em] uppercase ${STATUS_TONE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(invoiceTotals(invoice).total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Download PDF"
                          onClick={() => onDownload(invoice.id)}
                          className="p-1.5 text-forest hover:bg-cream-dark"
                        >
                          <Download size={15} strokeWidth={1.6} />
                        </button>
                        {isAdmin && invoice.status !== 'paid' ? (
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => onEdit(invoice.id)}
                            className="p-1.5 text-forest hover:bg-cream-dark"
                          >
                            <Pencil size={15} strokeWidth={1.6} />
                          </button>
                        ) : null}
                        {isAdmin && invoice.status === 'draft' ? (
                          <button
                            type="button"
                            title="Mark sent"
                            onClick={() => onMarkSent(invoice.id)}
                            className="p-1.5 text-forest hover:bg-cream-dark"
                          >
                            <Send size={15} strokeWidth={1.6} />
                          </button>
                        ) : null}
                        {isAdmin && invoice.status !== 'paid' && invoice.status !== 'draft' ? (
                          <button
                            type="button"
                            title="Mark paid"
                            onClick={() => onMarkPaid(invoice.id)}
                            className="p-1.5 text-forest hover:bg-cream-dark"
                          >
                            <Check size={15} strokeWidth={1.6} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
