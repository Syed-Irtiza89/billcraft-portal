import { AlertCircle, ArrowUpRight, CircleDollarSign, Clock } from 'lucide-react'
import type { Client, Invoice } from '../types'
import {
  STATUS_LABEL,
  STATUS_TONE,
  effectiveStatus,
  findClient,
  formatDate,
  formatMoney,
  invoiceTotals,
  todayISO,
} from '../storage'

type DashboardProps = {
  invoices: Invoice[]
  clients: Client[]
  tenantName: string
  isAdmin: boolean
  onOpenInvoice: (id: string) => void
  onCreate: () => void
}

export function Dashboard({
  invoices,
  clients,
  tenantName,
  isAdmin,
  onOpenInvoice,
  onCreate,
}: DashboardProps) {
  const monthKey = todayISO().slice(0, 7)
  const outstanding = invoices
    .filter((invoice) => {
      const status = effectiveStatus(invoice)
      return status === 'sent' || status === 'overdue'
    })
    .reduce((sum, invoice) => sum + invoiceTotals(invoice).total, 0)
  const paidThisMonth = invoices
    .filter((invoice) => invoice.status === 'paid' && invoice.paidAt?.startsWith(monthKey))
    .reduce((sum, invoice) => sum + invoiceTotals(invoice).total, 0)
  const overdueCount = invoices.filter((invoice) => effectiveStatus(invoice) === 'overdue').length
  const recent = [...invoices]
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
    .slice(0, 5)

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Ledger overview</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-forest">{tenantName}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {isAdmin
              ? 'Outstanding balances, collections this month, and the latest bills across this workspace.'
              : 'A quiet view of invoices issued to your company — download anytime.'}
          </p>
        </div>
        {isAdmin ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 border border-gold/70 bg-forest px-4 py-2.5 text-sm text-cream hover:bg-forest-mid"
          >
            New invoice
            <ArrowUpRight size={16} strokeWidth={1.6} />
          </button>
        ) : null}
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="border border-forest/10 bg-white/50 p-5">
          <div className="flex items-center gap-2 text-muted">
            <CircleDollarSign size={16} strokeWidth={1.5} />
            <p className="text-[11px] tracking-[0.2em] uppercase">Outstanding</p>
          </div>
          <p className="mt-4 font-display text-3xl tabular-nums text-forest">{formatMoney(outstanding)}</p>
          <div className="mt-4 h-px w-full bg-gold/40" />
          <p className="mt-3 text-xs text-muted">Sent and overdue, not yet collected.</p>
        </article>
        <article className="border border-forest/10 bg-white/50 p-5">
          <div className="flex items-center gap-2 text-muted">
            <Clock size={16} strokeWidth={1.5} />
            <p className="text-[11px] tracking-[0.2em] uppercase">Paid this month</p>
          </div>
          <p className="mt-4 font-display text-3xl tabular-nums text-forest">{formatMoney(paidThisMonth)}</p>
          <div className="mt-4 h-px w-full bg-gold/40" />
          <p className="mt-3 text-xs text-muted">Closed invoices dated {monthKey}.</p>
        </article>
        <article className="border border-forest/10 bg-white/50 p-5">
          <div className="flex items-center gap-2 text-muted">
            <AlertCircle size={16} strokeWidth={1.5} />
            <p className="text-[11px] tracking-[0.2em] uppercase">Overdue</p>
          </div>
          <p className="mt-4 font-display text-3xl tabular-nums text-forest">{overdueCount}</p>
          <div className="mt-4 h-px w-full bg-gold/40" />
          <p className="mt-3 text-xs text-muted">Due date passed and still unpaid.</p>
        </article>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl text-forest">Recent invoices</h2>
          <p className="text-[11px] tracking-[0.2em] text-muted uppercase">Latest five</p>
        </div>
        <div className="overflow-hidden border border-forest/10 bg-white/40">
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted">No invoices in this workspace yet.</p>
          ) : (
            <ul>
              {recent.map((invoice, index) => {
                const client = findClient(clients, invoice.clientId)
                const status = effectiveStatus(invoice)
                return (
                  <li key={invoice.id}>
                    <button
                      type="button"
                      onClick={() => onOpenInvoice(invoice.id)}
                      className="flex w-full flex-col gap-2 px-5 py-4 text-left transition hover:bg-cream-dark/60 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-mono text-xs text-muted">{invoice.number}</p>
                        <p className="mt-1 font-medium text-forest">
                          {client?.company ?? 'Unknown client'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 sm:text-right">
                        <span className={`px-2 py-0.5 text-[10px] tracking-[0.16em] uppercase ${STATUS_TONE[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                        <div>
                          <p className="tabular-nums text-sm">{formatMoney(invoiceTotals(invoice).total)}</p>
                          <p className="text-[11px] text-muted">Due {formatDate(invoice.dueDate)}</p>
                        </div>
                      </div>
                    </button>
                    {index < recent.length - 1 ? <div className="h-px bg-gold/30" /> : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
