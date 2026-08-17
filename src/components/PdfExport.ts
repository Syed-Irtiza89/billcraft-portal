import { jsPDF } from 'jspdf'
import type { Client, Invoice, Tenant } from '../types'
import { STATUS_LABEL, effectiveStatus, formatDate, formatMoney, invoiceTotals } from '../storage'

const FOREST: [number, number, number] = [15, 61, 50]
const CREAM: [number, number, number] = [247, 243, 234]
const GOLD: [number, number, number] = [196, 163, 90]
const INK: [number, number, number] = [28, 25, 20]
const MUTED: [number, number, number] = [107, 100, 88]

type PdfArgs = {
  invoice: Invoice
  client: Client
  tenant: Tenant
}

export function downloadInvoicePdf({ invoice, client, tenant }: PdfArgs): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const totals = invoiceTotals(invoice)
  const status = effectiveStatus(invoice)

  doc.setFillColor(...FOREST)
  doc.rect(0, 0, pageW, 118, 'F')
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1)
  doc.line(48, 118, pageW - 48, 118)

  doc.setTextColor(...GOLD)
  doc.setFont('times', 'italic')
  doc.setFontSize(11)
  doc.text('Billcraft  ·  Ledger', 48, 36)

  doc.setTextColor(...CREAM)
  doc.setFont('times', 'bold')
  doc.setFontSize(26)
  doc.text(tenant.name, 48, 68)
  doc.setFont('times', 'italic')
  doc.setFontSize(11)
  doc.text(tenant.tagline, 48, 88)

  doc.setFont('times', 'bold')
  doc.setFontSize(22)
  doc.text('INVOICE', pageW - 48, 62, { align: 'right' })
  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  doc.text(invoice.number, pageW - 48, 82, { align: 'right' })
  doc.setTextColor(...GOLD)
  doc.text(STATUS_LABEL[status].toUpperCase(), pageW - 48, 98, { align: 'right' })

  let y = 156
  doc.setTextColor(...MUTED)
  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.text('FROM', 48, y)
  doc.text('BILL TO', 320, y)
  y += 16
  doc.setTextColor(...FOREST)
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.text(tenant.legalName, 48, y)
  doc.text(client.company, 320, y)
  y += 16
  doc.setFont('times', 'normal')
  doc.setTextColor(...INK)
  doc.setFontSize(10)
  const fromLines = [...tenant.address.split('\n'), tenant.email, tenant.phone]
  const toLines = [client.name, ...client.address.split('\n'), client.email, client.phone].filter(Boolean)
  const blockLines = Math.max(fromLines.length, toLines.length)
  for (let i = 0; i < blockLines; i += 1) {
    const left = fromLines[i]
    const right = toLines[i]
    if (left) doc.text(left, 48, y)
    if (right) doc.text(right, 320, y)
    y += 14
  }

  y += 10
  doc.setTextColor(...MUTED)
  doc.setFontSize(9)
  doc.text(`Issued  ${formatDate(invoice.issuedAt)}`, 48, y)
  doc.text(`Due  ${formatDate(invoice.dueDate)}`, 220, y)
  if (invoice.paidAt) doc.text(`Paid  ${formatDate(invoice.paidAt)}`, 380, y)

  y += 24
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.8)
  doc.line(48, y, pageW - 48, y)
  y += 18
  doc.setFont('times', 'bold')
  doc.setTextColor(...FOREST)
  doc.setFontSize(9)
  doc.text('DESCRIPTION', 48, y)
  doc.text('QTY', 360, y)
  doc.text('RATE', 430, y)
  doc.text('AMOUNT', pageW - 48, y, { align: 'right' })
  y += 10
  doc.line(48, y, pageW - 48, y)
  y += 16

  doc.setFont('times', 'normal')
  doc.setTextColor(...INK)
  doc.setFontSize(10)
  for (const item of invoice.lineItems) {
    if (y > 680) {
      doc.addPage()
      y = 64
    }
    const wrapped = doc.splitTextToSize(item.description, 290)
    doc.text(wrapped, 48, y)
    doc.text(String(item.quantity), 360, y)
    doc.text(formatMoney(item.rate), 430, y)
    doc.text(formatMoney(item.quantity * item.rate), pageW - 48, y, { align: 'right' })
    y += Math.max(18, wrapped.length * 13)
  }

  y += 8
  doc.setDrawColor(...GOLD)
  doc.line(320, y, pageW - 48, y)
  y += 20
  const rows: Array<[string, string]> = [
    ['Subtotal', formatMoney(totals.subtotal)],
    [`Discount`, `−${formatMoney(totals.discount)}`],
    [`Tax (${invoice.taxPercent}%)`, formatMoney(totals.tax)],
  ]
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  for (const [label, value] of rows) {
    doc.text(label, 360, y)
    doc.setTextColor(...INK)
    doc.text(value, pageW - 48, y, { align: 'right' })
    doc.setTextColor(...MUTED)
    y += 16
  }
  y += 6
  doc.setDrawColor(...GOLD)
  doc.line(320, y - 8, pageW - 48, y - 8)
  doc.setFont('times', 'bold')
  doc.setTextColor(...FOREST)
  doc.setFontSize(14)
  doc.text('Total', 360, y + 6)
  doc.text(formatMoney(totals.total), pageW - 48, y + 6, { align: 'right' })

  if (invoice.notes) {
    y += 40
    doc.setFont('times', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(...MUTED)
    doc.text('Notes', 48, y)
    y += 14
    doc.setFont('times', 'normal')
    doc.setTextColor(...INK)
    const noteLines = doc.splitTextToSize(invoice.notes, pageW - 96)
    doc.text(noteLines, 48, y)
  }

  if (status === 'paid') {
    doc.setTextColor(196, 163, 90)
    doc.setFont('times', 'bold')
    doc.setFontSize(32)
    doc.text('PAID', pageW - 140, 210, { angle: 12 })
  }

  doc.setFillColor(...FOREST)
  doc.rect(0, 762, pageW, 30, 'F')
  doc.setTextColor(...GOLD)
  doc.setFont('times', 'italic')
  doc.setFontSize(9)
  doc.text(`${tenant.legalName}  ·  ${tenant.email}`, 48, 780)

  doc.save(`${invoice.number}.pdf`)
}
