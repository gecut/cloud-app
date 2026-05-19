import { AppError } from "./errors";

type InvoiceItemLike = {
  quantity: number;
  unitPriceToman: number;
};

export function computeInvoiceTotals<T extends InvoiceItemLike>(items: T[]) {
  const normalizedItems = items.map((item) => {
    if (item.quantity <= 0) {
      throw new AppError("VALIDATION_FAILED", "Item quantity must be positive", "تعداد آیتم باید بزرگ‌تر از صفر باشد");
    }

    if (item.unitPriceToman < 0) {
      throw new AppError("VALIDATION_FAILED", "Unit price cannot be negative", "مبلغ آیتم نامعتبر است");
    }

    const totalToman = item.quantity * item.unitPriceToman;

    return {
      ...item,
      totalToman,
    };
  });

  const subtotalToman = normalizedItems.reduce((sum, item) => sum + item.totalToman, 0);

  return {
    normalizedItems,
    subtotalToman,
    totalToman: subtotalToman,
  };
}

export function assertAmountMatches(invoiceTotalToman: number, paymentAmountToman: number) {
  if (invoiceTotalToman !== paymentAmountToman) {
    throw new AppError(
      "PAYMENT_AMOUNT_MISMATCH",
      `Payment amount mismatch. expected=${invoiceTotalToman}, got=${paymentAmountToman}`,
      "مبلغ پرداخت با مبلغ فاکتور مطابقت ندارد",
    );
  }
}
