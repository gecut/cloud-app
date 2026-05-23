const invoices = [
  {
    id: "inv_1",
    invoiceNumber: "INV-1405-1001",
    status: "UNPAID" as const,
    amountToman: 3250000,
    issuedAt: new Date("2026-05-01T00:00:00.000Z"),
    dueAt: new Date("2026-05-31T00:00:00.000Z"),
    paidAt: null,
  },
  {
    id: "inv_2",
    invoiceNumber: "INV-1405-1000",
    status: "PAID" as const,
    amountToman: 2100000,
    issuedAt: new Date("2026-04-01T00:00:00.000Z"),
    dueAt: new Date("2026-04-30T00:00:00.000Z"),
    paidAt: new Date("2026-04-10T10:30:00.000Z"),
  },
];

const items = [
  {
    id: "ii_1",
    invoiceId: "inv_1",
    title: "تمدید سرویس هاستینگ",
    description: "دوره یک‌ماهه",
    amountToman: 3250000,
  },
];

export async function mockListInvoices(input?: { search?: string; status?: "UNPAID" | "PAID" | "CANCELLED" }) {
  const filtered = invoices.filter((invoice) => {
    if (input?.status && invoice.status !== input.status) return false;
    if (input?.search && !invoice.invoiceNumber.toLowerCase().includes(input.search.toLowerCase())) return false;
    return true;
  });

  return { items: filtered, total: filtered.length, page: 1, pageSize: 20 };
}

export async function mockGetInvoiceById(id: string) {
  const invoice = invoices.find((item) => item.id === id);
  if (!invoice) throw new Error("فاکتور موردنظر یافت نشد");
  return invoice;
}

export async function mockGetInvoiceItems(id: string) {
  return items.filter((item) => item.invoiceId === id);
}
