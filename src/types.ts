export type UserRole = 'admin' | 'client'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export type AppView = 'dashboard' | 'invoices' | 'clients' | 'builder'

export type Tenant = {
  id: string
  name: string
  legalName: string
  tagline: string
  address: string
  email: string
  phone: string
}

export type User = {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  tenantId: string
  clientId: string | null
}

export type Client = {
  id: string
  tenantId: string
  name: string
  company: string
  email: string
  address: string
  phone: string
}

export type LineItem = {
  id: string
  description: string
  quantity: number
  rate: number
}

export type Invoice = {
  id: string
  tenantId: string
  clientId: string
  number: string
  status: 'draft' | 'sent' | 'paid'
  issuedAt: string
  dueDate: string
  lineItems: LineItem[]
  taxPercent: number
  discount: number
  notes: string
  paidAt: string | null
}

export type Session = {
  userId: string
  tenantId: string
}

export type BillcraftData = {
  version: 1
  tenants: Tenant[]
  users: User[]
  clients: Client[]
  invoices: Invoice[]
  sequences: Record<string, number>
  session: Session | null
}

export type InvoiceInput = {
  id: string | null
  clientId: string
  dueDate: string
  lineItems: LineItem[]
  taxPercent: number
  discount: number
  notes: string
  markSent: boolean
}

export type InvoiceTotals = {
  subtotal: number
  discount: number
  tax: number
  total: number
}
