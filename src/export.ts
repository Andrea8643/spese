import { catOf, computeBalances, euroPart, summarizeMonth, voucherPart } from './finance'
import type { Settings, Tx } from './types'
import { monthLabel, parseISO, round2 } from './utils'

const METHOD: Record<string, string> = { carta: 'Carta', bancomat: 'Carta', contanti: 'Contanti', buoni: 'Buoni pasto' }
const GROUP: Record<string, string> = { necessita: 'Necessità', personale: 'Personale' }

/** Dati del resoconto mensile, condivisi tra Excel e PDF. */
function buildReport(settings: Settings, txs: Tx[], month: string) {
  const s = summarizeMonth(settings, txs, month)
  const b = computeBalances(settings, txs)
  const fundRow = b.fundRows.find((r) => r.month === month)
  const expenses = s.expenses.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const rows = expenses.map((t) => {
    const cat = catOf(settings.categories, t.categoryId)
    const sub = cat.subs.find((x) => x.id === t.subId)
    return {
      date: t.date,
      description: t.description,
      group: GROUP[cat.group],
      category: cat.name,
      sub: sub?.name ?? '',
      method: t.vouchers ? (euroPart(t, settings.voucherValue) > 0 ? `Buoni + ${METHOD[t.method ?? 'carta'] ?? 'Carta'}` : 'Buoni pasto') : METHOD[t.method ?? 'carta'] ?? '',
      vouchers: t.vouchers ?? 0,
      voucherValue: voucherPart(t, settings.voucherValue),
      euro: euroPart(t, settings.voucherValue),
      total: t.amount,
    }
  })
  const incomes = txs.filter((t) => t.type === 'income' && t.date.startsWith(month)).sort((a, b) => (a.date < b.date ? -1 : 1))
  const summary: [string, number | string][] = [
    ['Entrate del mese', s.income],
    ...(s.incomeIsEstimate ? [['(budget calcolato su stima)', s.base] as [string, number]] : []),
    ['Quota risparmio', s.savingsAlloc],
    ['Budget Personale', s.personalBudget],
    ['Speso Personale (euro)', s.personalSpent],
    ['Avanzo Personale', s.personalLeft],
    ['Budget Necessità (senza Fondo auto)', s.needsOperative],
    ['Speso Necessità (euro)', s.needsSpent],
    ['Avanzo Necessità', s.needsLeft],
    ['Quota Fondo auto', s.fundQuota],
    ['Spese auto dal fondo', s.fundSpent],
    ['Saldo Fondo auto', fundRow?.balanceAfter ?? 0],
    ['Buoni pasto usati', `${s.vouchersUsed} (${s.voucherSpent.toFixed(2).replace('.', ',')} €)`],
    ['Totale uscite (euro + buoni)', s.totalExpense],
    ['Saldo risparmi attuale', b.savings],
  ]
  const cats = s.categories
    .filter((c) => c.spentTotal > 0 || c.budget > 0)
    .sort((a, b) => (a.cat.group === b.cat.group ? b.spentTotal - a.spentTotal : a.cat.group === 'personale' ? -1 : 1))
    .map((c) => ({ group: GROUP[c.cat.group], name: c.cat.name, budget: c.budget, euro: c.spentEuro, total: c.spentTotal, left: round2(c.budget - c.spentEuro), fund: !!c.cat.fund, count: c.count }))
  return { s, rows, incomes, summary, cats, title: `Resoconto ${monthLabel(month)}` }
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export async function exportExcel(settings: Settings, txs: Tx[], month: string) {
  const { default: writeExcelFile } = await import('write-excel-file/universal')
  const r = buildReport(settings, txs, month)
  const H = (value: string) => ({ value, fontWeight: 'bold' as const, backgroundColor: '#E8D9AE', color: '#1A1408' })
  const EUR = '#,##0.00 "€"'
  const n = (value: number, extra: object = {}) => ({ value: round2(value), type: Number, format: EUR, ...extra })
  const d = (iso: string) => ({ value: parseISO(iso), type: Date, format: 'dd/mm/yyyy' })

  const summarySheet = [
    [{ value: r.title, fontWeight: 'bold' as const, fontSize: 14 }],
    [],
    [H('Voce'), H('Importo')],
    ...r.summary.map(([k, v]) => [{ value: k }, typeof v === 'number' ? n(v, v < 0 ? { textColor: '#C0392B' } : {}) : { value: v }]),
  ]
  const expenseSheet = [
    ['Data', 'Descrizione', 'Gruppo', 'Categoria', 'Sottocategoria', 'Pagamento', 'Buoni', 'Pagato con buoni', 'Pagato in euro', 'Totale'].map(H),
    ...r.rows.map((x) => [d(x.date), { value: x.description }, { value: x.group }, { value: x.category }, { value: x.sub }, { value: x.method }, { value: x.vouchers || null }, n(x.voucherValue), n(x.euro), n(x.total, { fontWeight: 'bold' as const })]),
    [{ value: 'TOTALE', fontWeight: 'bold' as const }, null, null, null, null, null, { value: r.rows.reduce((a, x) => a + x.vouchers, 0), type: Number }, n(r.rows.reduce((a, x) => a + x.voucherValue, 0), { fontWeight: 'bold' as const }), n(r.rows.reduce((a, x) => a + x.euro, 0), { fontWeight: 'bold' as const }), n(r.rows.reduce((a, x) => a + x.total, 0), { fontWeight: 'bold' as const })],
  ]
  const catSheet = [
    ['Gruppo', 'Categoria', 'N. spese', 'Budget', 'Speso in euro', 'Totale (con buoni)', 'Rimasto'].map(H),
    ...r.cats.map((c) => [{ value: c.group }, { value: c.name + (c.fund ? ' (fondo)' : '') }, { value: c.count, type: Number }, n(c.budget), n(c.euro), n(c.total), c.fund ? { value: '—' } : n(c.left, c.left < 0 ? { textColor: '#C0392B' } : {})]),
  ]
  const incomeSheet = [
    ['Data', 'Tipo', 'Nota', 'Importo'].map(H),
    ...r.incomes.map((t) => [d(t.date), { value: t.incomeSource ?? 'Entrata' }, { value: t.description }, n(t.amount)]),
  ]
  const blob = await writeExcelFile([
    { sheet: 'Riepilogo', data: summarySheet as never, columns: [{ width: 38 }, { width: 18 }] },
    { sheet: 'Uscite', data: expenseSheet as never, columns: [{ width: 12 }, { width: 32 }, { width: 12 }, { width: 24 }, { width: 22 }, { width: 18 }, { width: 8 }, { width: 16 }, { width: 15 }, { width: 13 }], stickyRowsCount: 1 },
    { sheet: 'Per categoria', data: catSheet as never, columns: [{ width: 12 }, { width: 28 }, { width: 10 }, { width: 13 }, { width: 15 }, { width: 18 }, { width: 13 }], stickyRowsCount: 1 },
    { sheet: 'Entrate', data: incomeSheet as never, columns: [{ width: 12 }, { width: 16 }, { width: 28 }, { width: 14 }] },
  ]).toBlob()
  download(blob, `spese-${month}.xlsx`)
}

export async function exportPdf(settings: Settings, txs: Tx[], month: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const r = buildReport(settings, txs, month)
  const eur = (v: number) => `${v.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
  const date = (iso: string) => parseISO(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  // intestazione
  doc.setFillColor(20, 21, 27)
  doc.rect(0, 0, W, 86, 'F')
  doc.setFillColor(214, 178, 100)
  doc.roundedRect(40, 26, 34, 34, 8, 8, 'F')
  doc.setTextColor(26, 20, 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('€', 57, 49, { align: 'center' })
  doc.setTextColor(244, 243, 239)
  doc.setFontSize(18)
  doc.text(r.title, 86, 42)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(180, 178, 170)
  doc.text(`Le mie spese · generato il ${new Date().toLocaleDateString('it-IT')}`, 86, 58)

  // riquadri principali
  const boxes: [string, string][] = [
    ['Uscite totali', eur(r.s.totalExpense)],
    ['Avanzo Personale', eur(r.s.personalLeft)],
    ['Avanzo Necessità', eur(r.s.needsLeft)],
    ['Quota risparmio', eur(r.s.savingsAlloc)],
  ]
  const bw = (W - 80 - 30) / 4
  boxes.forEach(([k, v], i) => {
    const x = 40 + i * (bw + 10)
    doc.setFillColor(246, 243, 235)
    doc.roundedRect(x, 104, bw, 52, 8, 8, 'F')
    doc.setFontSize(8.5)
    doc.setTextColor(110, 108, 100)
    doc.text(k, x + 10, 122)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(v.startsWith('-') ? 192 : 26, v.startsWith('-') ? 57 : 26, v.startsWith('-') ? 43 : 26)
    doc.text(v, x + 10, 143)
    doc.setFont('helvetica', 'normal')
  })

  const head = { fillColor: [232, 217, 174] as [number, number, number], textColor: [26, 20, 8] as [number, number, number], fontStyle: 'bold' as const }
  autoTable(doc, {
    startY: 176,
    head: [['Riepilogo', 'Importo']],
    body: r.summary.map(([k, v]) => [k, typeof v === 'number' ? eur(v) : v]),
    headStyles: head,
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 40, right: 40 },
    tableWidth: (W - 80) / 2 - 8,
  })
  const y1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  autoTable(doc, {
    startY: 176,
    head: [['Categoria', 'Budget', 'Speso']],
    body: r.cats.filter((c) => c.total > 0).map((c) => [`${c.name}${c.fund ? ' (fondo)' : ''}`, c.fund ? '—' : eur(c.budget), eur(c.total)]),
    headStyles: head,
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: W / 2 + 8, right: 40 },
  })

  const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  autoTable(doc, {
    startY: Math.max(lastY, y1) + 26,
    head: [['Data', 'Descrizione', 'Categoria', 'Pagamento', 'Euro', 'Totale']],
    body: r.rows.map((x) => [date(x.date), x.description, `${x.category}${x.sub ? ' › ' + x.sub : ''}`, x.vouchers ? `${x.method} (${x.vouchers})` : x.method, eur(x.euro), eur(x.total)]),
    foot: [['', 'Totale', '', '', eur(r.rows.reduce((a, x) => a + x.euro, 0)), eur(r.rows.reduce((a, x) => a + x.total, 0))]],
    headStyles: head,
    footStyles: { fillColor: [246, 243, 235], textColor: [26, 26, 26], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 249, 246] },
    styles: { fontSize: 8.5, cellPadding: 4.5, overflow: 'linebreak' },
    columnStyles: { 0: { cellWidth: 40 }, 4: { halign: 'right', cellWidth: 62 }, 5: { halign: 'right', cellWidth: 62, fontStyle: 'bold' } },
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      const H = doc.internal.pageSize.getHeight()
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(`${r.title} · pagina ${doc.getNumberOfPages()}`, W / 2, H - 20, { align: 'center' })
    },
  })
  download(doc.output('blob'), `spese-${month}.pdf`)
}
