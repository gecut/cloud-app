export function formatInvoiceNumber(raw?: string | number | null): string {
  if (!raw) return "30001";
  const str = String(raw).trim();
  // Strip INV-YYYY- or INV- prefixes
  const cleaned = str.replace(/^INV(-\d+)?-/i, "").replace(/^INV/i, "");
  if (/^\d+$/.test(cleaned)) {
    const num = parseInt(cleaned, 10);
    return num < 30000 ? String(30000 + num) : String(num);
  }
  return cleaned;
}

export function formatCustomerSystemId(raw?: string | number | null): string {
  if (!raw) return "30001";
  const str = String(raw).trim();
  const cleaned = str.replace(/^CUST-/i, "").replace(/^cust_/i, "");
  if (/^\d+$/.test(cleaned)) {
    const num = parseInt(cleaned, 10);
    return num < 30000 ? String(30000 + (num % 1000 || 1)) : String(num);
  }
  return cleaned;
}
