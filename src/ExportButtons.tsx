import { FileSpreadsheet, FileText } from 'lucide-react'
import { useState } from 'react'
import { useApp } from './ui'

/** Scarica il resoconto del mese in Excel o PDF. */
export function ExportButtons({ month }: { month: string }) {
  const { settings, txs, toast } = useApp()
  const [busy, setBusy] = useState<'xlsx' | 'pdf' | null>(null)
  async function run(kind: 'xlsx' | 'pdf') {
    setBusy(kind)
    try {
      const m = await import('./export')
      await (kind === 'xlsx' ? m.exportExcel : m.exportPdf)(settings, txs, month)
      toast(kind === 'xlsx' ? 'Excel scaricato ✓' : 'PDF scaricato ✓')
    } catch (e) {
      console.error(e)
      toast('Errore durante il download')
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <button className="btn" disabled={!!busy} onClick={() => run('xlsx')}>
        <FileSpreadsheet style={{ color: '#3ccf6a' }} /> {busy === 'xlsx' ? 'Preparo…' : 'Excel'}
      </button>
      <button className="btn" disabled={!!busy} onClick={() => run('pdf')}>
        <FileText style={{ color: '#ef5b5b' }} /> {busy === 'pdf' ? 'Preparo…' : 'PDF'}
      </button>
    </div>
  )
}
