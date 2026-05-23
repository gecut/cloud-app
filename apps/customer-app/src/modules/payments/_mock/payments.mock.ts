import { mockGetInvoiceById } from "@/modules/invoices/_mock/invoices.mock";

let attempts: Array<{
  id: string;
  invoiceId: string;
  amountToman: number;
  provider: string;
  gatewayRef: string | null;
  status: "FAILED" | "CANCELLED" | "EXPIRED" | "UNKNOWN";
  attemptedAt: Date;
  errorMessage: string | null;
}> = [
  {
    id: "pat_1",
    invoiceId: "inv_1",
    amountToman: 3250000,
    provider: "zarinpal",
    gatewayRef: null as string | null,
    status: "FAILED" as const,
    attemptedAt: new Date("2026-05-15T11:20:00.000Z"),
    errorMessage: "Insufficient funds",
  },
];

const payments = [
  {
    id: "pay_1",
    invoiceId: "inv_2",
    amountToman: 2100000,
    provider: "zarinpal",
    gatewayRef: "ZP-REF-1001",
    paidAt: new Date("2026-04-10T10:30:00.000Z"),
  },
];

export async function mockGetInvoicePaymentStatus(invoiceId: string) {
  const invoice = await mockGetInvoiceById(invoiceId);
  const payment = payments.find((item) => item.invoiceId === invoiceId) ?? null;
  return {
    invoiceId: invoice.id,
    status: invoice.status,
    paidAt: invoice.paidAt,
    payment,
    lastAttempts: attempts.filter((item) => item.invoiceId === invoiceId).slice(0, 5),
  };
}

export async function mockListPaymentAttempts(input?: { status?: "FAILED" | "CANCELLED" | "EXPIRED" | "UNKNOWN" }) {
  const filtered = attempts.filter((item) => (input?.status ? item.status === input.status : true));
  return {
    items: filtered,
    total: filtered.length,
    page: 1,
    pageSize: 20,
  };
}

export async function mockSimulatePayInvoice(input: {
  invoiceId: string;
  provider: string;
  gatewayRef: string;
  amountToman: number;
}) {
  await mockGetInvoiceById(input.invoiceId);

  return {
    id: `pay_${Date.now()}`,
    invoiceId: input.invoiceId,
    amountToman: input.amountToman,
    provider: input.provider,
    gatewayRef: input.gatewayRef,
    paidAt: new Date(),
  };
}
