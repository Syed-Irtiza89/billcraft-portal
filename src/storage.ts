import type {
  BillcraftData,
  Client,
  Invoice,
  InvoiceStatus,
  InvoiceTotals,
  Session,
  User,
} from './types'

export const STORAGE_KEY = 'billcraft.v1'

export const TENANT_NORTHSTAR = 'tenant-northstar'
export const TENANT_HARBOR = 'tenant-harbor'

const USER_ADMIN = 'user-admin'
const USER_ACME = 'user-acme'

const CLIENT_ACME = 'client-acme'
const CLIENT_LUMEN = 'client-lumen'
const CLIENT_VERDANT = 'client-verdant'
const CLIENT_PINNACLE = 'client-pinnacle'
const CLIENT_OAK = 'client-oak'
const CLIENT_BLUE = 'client-blue'

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
}

export const STATUS_TONE: Record<InvoiceStatus, string> = {
  draft: 'bg-[#ebe4d4] text-[#5c564c]',
  sent: 'bg-forest/10 text-forest',
  paid: 'bg-gold/20 text-[#7a6230]',
  overdue: 'bg-[#9a3b2f]/12 text-[#9a3b2f]',
}

export function uid(): string {
  return crypto.randomUUID()
}

export function todayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function invoiceTotals(invoice: Pick<Invoice, 'lineItems' | 'taxPercent' | 'discount'>): InvoiceTotals {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0)
  const discount = Math.min(Math.max(0, invoice.discount), subtotal)
  const taxable = Math.max(0, subtotal - discount)
  const tax = taxable * (invoice.taxPercent / 100)
  return { subtotal, discount, tax, total: taxable + tax }
}

export function effectiveStatus(invoice: Invoice, today = todayISO()): InvoiceStatus {
  if (invoice.status === 'paid') return 'paid'
  if (invoice.dueDate < today) return 'overdue'
  return invoice.status
}

export function nextInvoiceNumber(
  sequences: Record<string, number>,
  tenantId: string,
  year = new Date().getFullYear(),
): { number: string; sequences: Record<string, number> } {
  const seq = (sequences[tenantId] ?? 0) + 1
  return {
    number: `INV-${year}-${String(seq).padStart(4, '0')}`,
    sequences: { ...sequences, [tenantId]: seq },
  }
}

function createSeed(): BillcraftData {
  return {
    version: 1,
    session: null,
    sequences: {
      [TENANT_NORTHSTAR]: 5,
      [TENANT_HARBOR]: 4,
    },
    tenants: [
      {
        id: TENANT_NORTHSTAR,
        name: 'Northstar Studio',
        legalName: 'Northstar Studio LLC',
        tagline: 'Brand, product & motion',
        address: '418 Everett Avenue\nPortland, OR 97209',
        email: 'billing@northstar.dev',
        phone: '+1 (503) 555-0148',
      },
      {
        id: TENANT_HARBOR,
        name: 'Harbor Agency',
        legalName: 'Harbor Agency Co.',
        tagline: 'Maritime brands, inland craft',
        address: '90 Clay Street, Suite 4\nSeattle, WA 98121',
        email: 'accounts@harbor.agency',
        phone: '+1 (206) 555-0192',
      },
    ],
    users: [
      {
        id: USER_ADMIN,
        email: 'admin@northstar.dev',
        password: 'demo123',
        name: 'Mira Chen',
        role: 'admin',
        tenantId: TENANT_NORTHSTAR,
        clientId: null,
      },
      {
        id: USER_ACME,
        email: 'client@acme.io',
        password: 'demo123',
        name: 'Jonah Hale',
        role: 'client',
        tenantId: TENANT_NORTHSTAR,
        clientId: CLIENT_ACME,
      },
    ],
    clients: [
      {
        id: CLIENT_ACME,
        tenantId: TENANT_NORTHSTAR,
        name: 'Jonah Hale',
        company: 'Acme Industries',
        email: 'client@acme.io',
        address: '1200 Market Street\nSan Francisco, CA 94103',
        phone: '+1 (415) 555-0110',
      },
      {
        id: CLIENT_LUMEN,
        tenantId: TENANT_NORTHSTAR,
        name: 'Priya Shah',
        company: 'Lumen Labs',
        email: 'hello@lumen.test',
        address: '88 Pioneer Way\nAustin, TX 78701',
        phone: '+1 (512) 555-0166',
      },
      {
        id: CLIENT_VERDANT,
        tenantId: TENANT_NORTHSTAR,
        name: 'Ellis Ward',
        company: 'Verdant Co.',
        email: 'studio@verdant.test',
        address: '14 Cedar Row\nBoulder, CO 80302',
        phone: '+1 (303) 555-0188',
      },
      {
        id: CLIENT_PINNACLE,
        tenantId: TENANT_HARBOR,
        name: 'Claire Duvall',
        company: 'Pinnacle Legal',
        email: 'finance@pinnacle.test',
        address: '600 5th Avenue\nNew York, NY 10020',
        phone: '+1 (212) 555-0134',
      },
      {
        id: CLIENT_OAK,
        tenantId: TENANT_HARBOR,
        name: 'Sam Rivera',
        company: 'Oak & Iron',
        email: 'hello@oakiron.test',
        address: '31 Wharf Lane\nPortland, ME 04101',
        phone: '+1 (207) 555-0177',
      },
      {
        id: CLIENT_BLUE,
        tenantId: TENANT_HARBOR,
        name: 'Nina Solis',
        company: 'Blue Harbor Yachts',
        email: 'billing@blueharbor.test',
        address: '2 Marina Green\nNewport, RI 02840',
        phone: '+1 (401) 555-0129',
      },
    ],
    invoices: [
      {
        id: 'inv-ns-1',
        tenantId: TENANT_NORTHSTAR,
        clientId: CLIENT_ACME,
        number: 'INV-2026-0001',
        status: 'paid',
        issuedAt: '2026-07-02',
        dueDate: '2026-07-16',
        paidAt: '2026-07-14',
        taxPercent: 8.5,
        discount: 0,
        notes: 'Brand identity system, phase one. Thank you for the swift turnaround on feedback.',
        lineItems: [
          { id: 'li-1', description: 'Identity system — wordmark, palette, type', quantity: 1, rate: 12000 },
          { id: 'li-2', description: 'Brand guidelines (print + digital)', quantity: 1, rate: 4500 },
          { id: 'li-3', description: 'Launch stationery suite', quantity: 1, rate: 2000 },
        ],
      },
      {
        id: 'inv-ns-2',
        tenantId: TENANT_NORTHSTAR,
        clientId: CLIENT_ACME,
        number: 'INV-2026-0002',
        status: 'sent',
        issuedAt: '2026-08-01',
        dueDate: '2026-09-12',
        paidAt: null,
        taxPercent: 8.5,
        discount: 400,
        notes: 'August product-site retainer. Hours billed against the 40-hour block.',
        lineItems: [
          { id: 'li-4', description: 'Product site retainer — August', quantity: 40, rate: 185 },
          { id: 'li-5', description: 'CMS training session', quantity: 2, rate: 220 },
        ],
      },
      {
        id: 'inv-ns-3',
        tenantId: TENANT_NORTHSTAR,
        clientId: CLIENT_ACME,
        number: 'INV-2026-0003',
        status: 'sent',
        issuedAt: '2026-06-18',
        dueDate: '2026-07-20',
        paidAt: null,
        taxPercent: 8.5,
        discount: 0,
        notes: 'Motion pack for Q2 campaign. Please remit to the studio account on file.',
        lineItems: [
          { id: 'li-6', description: 'Motion design — 6 hero loops', quantity: 6, rate: 1450 },
          { id: 'li-7', description: 'Sound design pass', quantity: 1, rate: 1800 },
          { id: 'li-8', description: 'Export package (social + web)', quantity: 1, rate: 650 },
        ],
      },
      {
        id: 'inv-ns-4',
        tenantId: TENANT_NORTHSTAR,
        clientId: CLIENT_LUMEN,
        number: 'INV-2026-0004',
        status: 'draft',
        issuedAt: '2026-08-14',
        dueDate: '2026-09-30',
        paidAt: null,
        taxPercent: 8.25,
        discount: 1000,
        notes: 'Draft only — awaiting Priya’s confirmation on the launch timeline.',
        lineItems: [
          { id: 'li-9', description: 'Product launch website', quantity: 1, rate: 18500 },
          { id: 'li-10', description: 'Component library (React)', quantity: 1, rate: 6200 },
        ],
      },
      {
        id: 'inv-ns-5',
        tenantId: TENANT_NORTHSTAR,
        clientId: CLIENT_VERDANT,
        number: 'INV-2026-0005',
        status: 'paid',
        issuedAt: '2026-08-03',
        dueDate: '2026-08-17',
        paidAt: '2026-08-08',
        taxPercent: 8.5,
        discount: 250,
        notes: 'Packaging refresh for the autumn line. Files delivered via the studio vault.',
        lineItems: [
          { id: 'li-11', description: 'Packaging system — 4 SKUs', quantity: 4, rate: 1100 },
          { id: 'li-12', description: 'Print production art', quantity: 1, rate: 1400 },
        ],
      },
      {
        id: 'inv-hb-1',
        tenantId: TENANT_HARBOR,
        clientId: CLIENT_PINNACLE,
        number: 'INV-2026-0001',
        status: 'paid',
        issuedAt: '2026-08-04',
        dueDate: '2026-08-18',
        paidAt: '2026-08-11',
        taxPercent: 8.875,
        discount: 0,
        notes: 'Annual report art direction and layout. Press-ready PDFs attached in the portal.',
        lineItems: [
          { id: 'li-13', description: 'Annual report — art direction', quantity: 1, rate: 9800 },
          { id: 'li-14', description: 'Typesetting & print prep (64pp)', quantity: 1, rate: 4200 },
        ],
      },
      {
        id: 'inv-hb-2',
        tenantId: TENANT_HARBOR,
        clientId: CLIENT_OAK,
        number: 'INV-2026-0002',
        status: 'sent',
        issuedAt: '2026-08-10',
        dueDate: '2026-09-08',
        paidAt: null,
        taxPercent: 5.5,
        discount: 500,
        notes: 'Fall catalog. Photography licensed for two years, print + web.',
        lineItems: [
          { id: 'li-15', description: 'Catalog design (48pp)', quantity: 1, rate: 7600 },
          { id: 'li-16', description: 'Copy edit & proof', quantity: 1, rate: 900 },
        ],
      },
      {
        id: 'inv-hb-3',
        tenantId: TENANT_HARBOR,
        clientId: CLIENT_BLUE,
        number: 'INV-2026-0003',
        status: 'sent',
        issuedAt: '2026-06-22',
        dueDate: '2026-07-15',
        paidAt: null,
        taxPercent: 7,
        discount: 0,
        notes: 'Past due. Please advise if a split payment would help close this out.',
        lineItems: [
          { id: 'li-17', description: 'Location photography — 2 days', quantity: 2, rate: 3200 },
          { id: 'li-18', description: 'Retouching & color', quantity: 18, rate: 95 },
        ],
      },
      {
        id: 'inv-hb-4',
        tenantId: TENANT_HARBOR,
        clientId: CLIENT_PINNACLE,
        number: 'INV-2026-0004',
        status: 'draft',
        issuedAt: '2026-08-16',
        dueDate: '2026-10-01',
        paidAt: null,
        taxPercent: 8.875,
        discount: 0,
        notes: 'Proposal draft for the autumn partner dinner invitations.',
        lineItems: [
          { id: 'li-19', description: 'Invitation suite — letterpress', quantity: 1, rate: 3400 },
          { id: 'li-20', description: 'Calligraphy & envelope design', quantity: 1, rate: 1100 },
        ],
      },
    ],
  }
}

export function saveData(data: BillcraftData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function seedData(): BillcraftData {
  const data = createSeed()
  saveData(data)
  return data
}

export function loadData(): BillcraftData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedData()
    const parsed = JSON.parse(raw) as BillcraftData
    if (parsed.version !== 1 || !parsed.tenants?.length || !parsed.users?.length) {
      return seedData()
    }
    return parsed
  } catch {
    return seedData()
  }
}

export function resetDemo(): BillcraftData {
  localStorage.removeItem(STORAGE_KEY)
  return seedData()
}

export function authenticate(data: BillcraftData, email: string, password: string): Session | null {
  const normalized = email.trim().toLowerCase()
  const user = data.users.find((entry) => entry.email.toLowerCase() === normalized && entry.password === password)
  if (!user) return null
  return { userId: user.id, tenantId: user.tenantId }
}

export function visibleInvoices(data: BillcraftData, user: User, tenantId: string): Invoice[] {
  return data.invoices.filter((invoice) => {
    if (invoice.tenantId !== tenantId) return false
    if (user.role === 'client') {
      return invoice.clientId === user.clientId && invoice.status !== 'draft'
    }
    return true
  })
}

export function tenantClients(data: BillcraftData, tenantId: string): Client[] {
  return data.clients.filter((client) => client.tenantId === tenantId)
}

export function findClient(clients: Client[], id: string): Client | undefined {
  return clients.find((client) => client.id === id)
}
