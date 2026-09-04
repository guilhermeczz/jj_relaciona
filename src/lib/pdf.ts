import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type ReportRow = Record<string, unknown>

function cellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

export function exportPDF(rows: ReportRow[], title: string, filename: string) {
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const orientation = headers.length > 4 ? 'landscape' : 'portrait'
  const document = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true })
  const pageWidth = document.internal.pageSize.getWidth()
  const totalPagesToken = '{total_pages_count_string}'
  const generatedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date())

  document.setProperties({ title, subject: 'Relatório ConstruJota Relaciona' })
  document.setFont('helvetica', 'bold')
  document.setFontSize(15)
  document.setTextColor(32, 32, 28)
  document.text(title, 14, 15, { maxWidth: pageWidth - 28 })
  document.setFont('helvetica', 'normal')
  document.setFontSize(8)
  document.setTextColor(100, 96, 80)
  document.text(`ConstruJota Relaciona - Emitido em ${generatedAt}`, 14, 21)

  autoTable(document, {
    startY: 26,
    head: [headers],
    body: rows.map((row) => headers.map((header) => cellValue(row[header]))),
    theme: 'grid',
    margin: { top: 15, right: 12, bottom: 15, left: 12 },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      overflow: 'linebreak',
      valign: 'middle',
      lineColor: [218, 211, 184],
      lineWidth: 0.15,
      textColor: [42, 40, 32],
    },
    headStyles: {
      fillColor: [255, 202, 5],
      textColor: [25, 24, 18],
      fontStyle: 'bold',
      minCellHeight: 8,
    },
    alternateRowStyles: { fillColor: [250, 248, 239] },
    rowPageBreak: 'avoid',
    didDrawPage: () => {
      const pageHeight = document.internal.pageSize.getHeight()
      document.setFont('helvetica', 'normal')
      document.setFontSize(7.5)
      document.setTextColor(115, 110, 91)
      document.text(
        `Página ${document.getNumberOfPages()} de ${totalPagesToken}`,
        pageWidth - 12,
        pageHeight - 7,
        { align: 'right' },
      )
    },
  })

  if (typeof document.putTotalPages === 'function') document.putTotalPages(totalPagesToken)
  document.save(filename.replace(/\.csv$/i, '.pdf'))
}
