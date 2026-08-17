# Billcraft

A multi-tenant client portal and invoice generator. Frontend demo — data lives in `localStorage` under `billcraft.v1`. No backend.

## Demo credentials

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| Agency admin | `admin@northstar.dev` | `demo123` | Both workspaces, clients CRUD, invoice builder, mark sent/paid |
| Client | `client@acme.io` | `demo123` | Acme Industries invoices only (view + PDF) |

Workspaces for the admin switcher:

- **Northstar Studio**
- **Harbor Agency**

Click a demo card on the login screen to sign in immediately. Use **Reset demo data** on that screen to restore the seed ledger.

## Features

- Dashboard: outstanding amount, paid this month, overdue count, recent invoices
- Clients CRUD (admin)
- Invoice builder with line items, tax %, discount, notes, and due date
- Auto invoice numbers `INV-2026-00XX`
- Statuses: draft, sent, paid, overdue (overdue when the due date has passed and the bill is unpaid)
- Branded PDF download via jsPDF
- Payment tracking: mark sent / paid
- Client role cannot create invoices

## Run locally

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Stack

Vite, React 19, TypeScript, Tailwind CSS v4, lucide-react, jsPDF.
