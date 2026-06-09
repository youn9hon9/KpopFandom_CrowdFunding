function escapeCsvCell(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvCell(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(',')
  );
  return `\uFEFF${[header, ...lines].join('\r\n')}`;
}

function sendCsv(res, filename, rows, columns) {
  const body = toCsv(rows, columns);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(body);
}

module.exports = { toCsv, sendCsv, escapeCsvCell };
