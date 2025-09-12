export function excelSerialToISO(serial: number) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().slice(0, 10);
}

export function parseDateString(dateStr: string | number | Date | null | undefined): string | null {
  if (!dateStr) return null;

  if (typeof dateStr === 'number') {
    return excelSerialToISO(dateStr);
  }

  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return null;
    const year = dateStr.getUTCFullYear();
    const month = String(dateStr.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateStr.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof dateStr === 'string') {
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dateStr.slice(0, 10);
    }
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (d && m && y && y.length === 4) {
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
  }
  return null;
}