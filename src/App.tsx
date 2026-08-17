import { useMemo, useState } from 'react'
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react'
import type { AppView, BillcraftData, Client, Invoice, InvoiceInput, InvoiceStatus, User } from './types'
import {
  authenticate,
  findClient,
  loadData,
  nextInvoiceNumber,
  resetDemo,
  saveData,
  tenantClients,
  todayISO,
  uid,
  visibleInvoices,
} from './storage'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'
import { Clients } from './components/Clients'
import { InvoiceBuilder } from './components/InvoiceBuilder'
import { InvoiceList } from './components/InvoiceList'
import { downloadInvoicePdf } from './components/PdfExport'

export default function App() {
  const [data, setData] = useState<BillcraftData>(() => loadData())
  const [view, setView] = useState<AppView>('dashboard')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | InvoiceStatus>('all')

  const session = data.session
  const user: User | undefined = session
    ? data.users.find((entry) => entry.id === session.userId)
    : undefined
  const tenant = session
    ? data.tenants.find((entry) => entry.id === session.tenantId)
    : undefined

  const persist = (next: BillcraftData) => {
    saveData(next)
    setData(next)
  }

  const isAdmin = user?.role === 'admin'
  const invoices = useMemo(() => {
    if (!user || !session) return []
    return visibleInvoices(data, user, session.tenantId)
  }, [data, user, session])
  const clients = useMemo(() => {
    if (!session) return []
    return tenantClients(data, session.tenantId)
  }, [data, session])

  const editingInvoice = editingId
    ? (data.invoices.find((invoice) => invoice.id === editingId) ?? null)
    : null

  function handleLogin(email: string, password: string) {
    const nextSession = authenticate(data, email, password)
    if (!nextSession) {
      setLoginError('Those credentials are not in the demo ledger.')
      return
    }
    setLoginError(null)
    setView('dashboard')
    setEditingId(null)
    persist({ ...data, session: nextSession })
  }

  function handleLogout() {
    persist({ ...data, session: null })
    setView('dashboard')
    setEditingId(null)
  }

  function handleReset() {
    const seeded = resetDemo()
    setLoginError(null)
    setView('dashboard')
    setEditingId(null)
    setData(seeded)
  }

  function switchTenant(tenantId: string) {
    if (!session) return
    persist({ ...data, session: { ...session, tenantId } })
    setView('dashboard')
    setEditingId(null)
  }

  function openBuilder(id: string | null) {
    if (!isAdmin) return
    setEditingId(id)
    setView('builder')
  }

  function handleOpenInvoice(id: string) {
    const invoice = data.invoices.find((entry) => entry.id === id)
    if (isAdmin && invoice && invoice.status === 'draft') {
      openBuilder(id)
      return
    }
    setInvoiceFilter('all')
    setView('invoices')
  }

  function saveClient(client: Client) {
    const exists = data.clients.some((entry) => entry.id === client.id)
    persist({
      ...data,
      clients: exists
        ? data.clients.map((entry) => (entry.id === client.id ? client : entry))
        : [...data.clients, client],
    })
  }

  function deleteClient(id: string) {
    persist({
      ...data,
      clients: data.clients.filter((client) => client.id !== id),
    })
  }

  function saveInvoice(input: InvoiceInput) {
    if (!session) return
    const existing = input.id ? data.invoices.find((invoice) => invoice.id === input.id) : undefined
    let sequences = data.sequences
    let number = existing?.number
    if (!number) {
      const minted = nextInvoiceNumber(sequences, session.tenantId)
      sequences = minted.sequences
      number = minted.number
    }
    let storedStatus: Invoice['status'] = 'draft'
    if (existing?.status === 'paid') storedStatus = 'paid'
    else if (input.markSent || existing?.status === 'sent') storedStatus = 'sent'
    const nextInvoice: Invoice = {
      id: existing?.id ?? uid(),
      tenantId: session.tenantId,
      clientId: input.clientId,
      number,
      status: storedStatus,
      issuedAt: existing?.issuedAt ?? todayISO(),
      dueDate: input.dueDate,
      lineItems: input.lineItems,
      taxPercent: input.taxPercent,
      discount: input.discount,
      notes: input.notes,
      paidAt: existing?.paidAt ?? null,
    }
    persist({
      ...data,
      sequences,
      invoices: existing
        ? data.invoices.map((invoice) => (invoice.id === existing.id ? nextInvoice : invoice))
        : [...data.invoices, nextInvoice],
    })
    setEditingId(null)
    setView('invoices')
  }

  function patchInvoice(id: string, patch: Partial<Invoice>) {
    persist({
      ...data,
      invoices: data.invoices.map((invoice) => (invoice.id === id ? { ...invoice, ...patch } : invoice)),
    })
  }

  function handleDownload(id: string) {
    if (!tenant) return
    const invoice = data.invoices.find((entry) => entry.id === id)
    if (!invoice) return
    const client = findClient(data.clients, invoice.clientId)
    if (!client) return
    downloadInvoicePdf({ invoice, client, tenant })
  }

  if (!session || !user || !tenant) {
    return <Login error={loginError} onLogin={handleLogin} onReset={handleReset} />
  }

  const nav: Array<{ id: AppView; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
  ]
  if (isAdmin) nav.push({ id: 'clients', label: 'Clients', icon: Users })

  return (
    <div className="min-h-screen bg-cream text-ink lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-forest text-cream">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <div>
            <p className="text-[11px] tracking-[0.32em] text-gold uppercase">Billcraft</p>
            <p className="mt-2 font-display text-2xl">Ledger</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-xs text-cream/70 hover:text-gold lg:hidden"
          >
            <LogOut size={14} />
            Out
          </button>
        </div>
        <div className="hidden px-5 lg:block">
          <div className="h-px bg-gold/40" />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:block lg:space-y-1 lg:px-3 lg:py-6">
          {nav.map((item) => {
            const Icon = item.icon
            const active = view === item.id || (item.id === 'invoices' && view === 'builder')
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id)
                  if (item.id !== 'builder') setEditingId(null)
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm whitespace-nowrap ${
                  active ? 'bg-forest-deep text-gold' : 'text-cream/75 hover:text-cream'
                }`}
              >
                <Icon size={16} strokeWidth={1.5} />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="hidden px-5 pb-6 lg:block">
          <div className="h-px bg-gold/40" />
          <p className="mt-5 text-[11px] tracking-[0.2em] text-gold/80 uppercase">{user.name}</p>
          <p className="mt-1 text-xs text-cream/60">{user.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex items-center gap-2 text-xs text-cream/70 hover:text-gold"
          >
            <LogOut size={14} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex flex-col gap-3 border-b border-gold/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-muted uppercase">Workspace</p>
            {isAdmin ? (
              <select
                className="mt-1 bg-transparent font-display text-xl text-forest outline-none"
                value={session.tenantId}
                onChange={(event) => switchTenant(event.target.value)}
              >
                {data.tenants.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 font-display text-xl text-forest">{tenant.name}</p>
            )}
          </div>
          <p className="text-xs text-muted">
            {isAdmin ? 'Agency admin' : 'Client portal'} · {effectiveStatusLabel(invoices.length)}
          </p>
        </header>

        <main className="px-4 py-8 sm:px-8">
          {view === 'dashboard' ? (
            <Dashboard
              invoices={invoices}
              clients={clients}
              tenantName={tenant.name}
              isAdmin={isAdmin}
              onOpenInvoice={handleOpenInvoice}
              onCreate={() => openBuilder(null)}
            />
          ) : null}
          {view === 'invoices' ? (
            <InvoiceList
              invoices={invoices}
              clients={clients}
              isAdmin={isAdmin}
              filter={invoiceFilter}
              onFilter={setInvoiceFilter}
              onCreate={() => openBuilder(null)}
              onEdit={(id) => openBuilder(id)}
              onMarkSent={(id) => patchInvoice(id, { status: 'sent' })}
              onMarkPaid={(id) => patchInvoice(id, { status: 'paid', paidAt: todayISO() })}
              onDownload={handleDownload}
            />
          ) : null}
          {view === 'clients' && isAdmin ? (
            <Clients
              clients={clients}
              invoices={invoices}
              tenantId={session.tenantId}
              onSave={saveClient}
              onDelete={deleteClient}
            />
          ) : null}
          {view === 'builder' && isAdmin ? (
            <InvoiceBuilder
              clients={clients}
              invoice={editingInvoice}
              onCancel={() => {
                setEditingId(null)
                setView('invoices')
              }}
              onSave={saveInvoice}
            />
          ) : null}
        </main>
      </div>
    </div>
  )
}

function effectiveStatusLabel(count: number): string {
  return `${count} invoice${count === 1 ? '' : 's'} in view`
}
