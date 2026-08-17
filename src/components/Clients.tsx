import type { FormEvent } from 'react'
import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { Client, Invoice } from '../types'
import { uid } from '../storage'

type ClientForm = {
  name: string
  company: string
  email: string
  address: string
  phone: string
}

const EMPTY: ClientForm = {
  name: '',
  company: '',
  email: '',
  address: '',
  phone: '',
}

type ClientsProps = {
  clients: Client[]
  invoices: Invoice[]
  onSave: (client: Client) => void
  onDelete: (id: string) => void
  tenantId: string
}

export function Clients({ clients, invoices, onSave, onDelete, tenantId }: ClientsProps) {
  const [editingId, setEditingId] = useState<string | null | 'new'>(null)
  const [form, setForm] = useState<ClientForm>(EMPTY)
  const [query, setQuery] = useState('')

  const filtered = clients.filter((client) => {
    const haystack = `${client.company} ${client.name} ${client.email}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  function startCreate() {
    setEditingId('new')
    setForm(EMPTY)
  }

  function startEdit(client: Client) {
    setEditingId(client.id)
    setForm({
      name: client.name,
      company: client.company,
      email: client.email,
      address: client.address,
      phone: client.phone,
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.company.trim() || !form.email.trim()) return
    onSave({
      id: editingId && editingId !== 'new' ? editingId : uid(),
      tenantId,
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
    })
    setEditingId(null)
    setForm(EMPTY)
  }

  function handleDelete(id: string) {
    const linked = invoices.some((invoice) => invoice.clientId === id)
    if (linked) {
      window.alert('This client still has invoices. Remove or reassign those bills first.')
      return
    }
    if (window.confirm('Delete this client from the workspace?')) onDelete(id)
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Roster</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-forest">Clients</h1>
          <p className="mt-2 text-sm text-muted">Companies you bill from this workspace.</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 bg-forest px-4 py-2.5 text-sm text-cream hover:bg-forest-mid"
        >
          <Plus size={16} strokeWidth={1.6} />
          Add client
        </button>
      </header>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search company, contact, or email"
        className="w-full border border-forest/15 bg-white/50 px-3 py-2.5 text-sm outline-none focus:border-gold"
      />

      {editingId ? (
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 border border-gold/50 bg-white/60 p-5 sm:grid-cols-2"
        >
          <p className="sm:col-span-2 font-display text-xl text-forest">
            {editingId === 'new' ? 'New client' : 'Edit client'}
          </p>
          <label className="block text-[11px] tracking-[0.18em] text-muted uppercase">
            Company
            <input
              required
              className="mt-1 w-full border border-forest/15 bg-cream px-3 py-2 text-sm text-ink normal-case tracking-normal outline-none focus:border-gold"
              value={form.company}
              onChange={(event) => setForm({ ...form, company: event.target.value })}
            />
          </label>
          <label className="block text-[11px] tracking-[0.18em] text-muted uppercase">
            Contact
            <input
              className="mt-1 w-full border border-forest/15 bg-cream px-3 py-2 text-sm text-ink normal-case tracking-normal outline-none focus:border-gold"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="block text-[11px] tracking-[0.18em] text-muted uppercase">
            Email
            <input
              required
              type="email"
              className="mt-1 w-full border border-forest/15 bg-cream px-3 py-2 text-sm text-ink normal-case tracking-normal outline-none focus:border-gold"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label className="block text-[11px] tracking-[0.18em] text-muted uppercase">
            Phone
            <input
              className="mt-1 w-full border border-forest/15 bg-cream px-3 py-2 text-sm text-ink normal-case tracking-normal outline-none focus:border-gold"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>
          <label className="sm:col-span-2 block text-[11px] tracking-[0.18em] text-muted uppercase">
            Address
            <textarea
              rows={3}
              className="mt-1 w-full border border-forest/15 bg-cream px-3 py-2 text-sm text-ink normal-case tracking-normal outline-none focus:border-gold"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </label>
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="bg-forest px-4 py-2 text-sm text-cream hover:bg-forest-mid">
              Save client
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm(EMPTY)
              }}
              className="px-4 py-2 text-sm text-muted hover:text-forest"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden border border-forest/10 bg-white/40">
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted">No clients match that search.</p>
        ) : (
          <ul>
            {filtered.map((client, index) => {
              const count = invoices.filter((invoice) => invoice.clientId === client.id).length
              return (
                <li key={client.id}>
                  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-forest">{client.company}</p>
                      <p className="mt-1 text-sm text-muted">
                        {client.name || 'No contact'} · {client.email}
                      </p>
                      <p className="mt-1 text-[11px] tracking-wide text-muted uppercase">
                        {count} invoice{count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(client)}
                        className="inline-flex items-center gap-1.5 border border-forest/15 px-3 py-1.5 text-xs text-forest hover:border-gold"
                      >
                        <Pencil size={13} strokeWidth={1.6} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(client.id)}
                        className="inline-flex items-center gap-1.5 border border-[#9a3b2f]/20 px-3 py-1.5 text-xs text-[#9a3b2f] hover:bg-[#9a3b2f]/8"
                      >
                        <Trash2 size={13} strokeWidth={1.6} />
                        Delete
                      </button>
                    </div>
                  </div>
                  {index < filtered.length - 1 ? <div className="h-px bg-gold/30" /> : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
