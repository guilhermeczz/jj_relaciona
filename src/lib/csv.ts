export function exportCSV(rows: Record<string, unknown>[], filename = 'export.csv') {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escapeCell = (value: unknown) => {
    const str = value === null || value === undefined ? '' : String(value)
    return `"${str.replace(/"/g, '""')}"`
  }
  const lines = [headers.join(';'), ...rows.map((r) => headers.map((h) => escapeCell(r[h])).join(';'))]
  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
