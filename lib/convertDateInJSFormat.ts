export function excelSerialToISO(serial: number) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().slice(0, 10);
}

export function parseDateString(dateStr: string | number) {
  if (!dateStr) return null;
  if (typeof dateStr === "number") return excelSerialToISO(dateStr);
  const [d, m, y] = dateStr.split("/");
  if (d && m && y) return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const dt = new Date(dateStr);
  return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
}