import React from "react";
import {
  FileText,
  X,
  Printer,
  Edit2,
  CheckCircle,
  Clock,
  Ban,
  Building2,
  User,
  ShieldCheck,
} from "lucide-react";
import { formatInvoiceNumber } from "@/utils/format";
import { Button } from "@gecut-cloud/ui/components/button";
import { formatJalaliDate, formatJalaliDateTime } from "@gecut-cloud/contracts";

interface InvoiceDetailModalProps {
  invoice: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (invoice: any) => void;
  onCancel?: (invoiceId: string) => void;
  onReactivate?: (invoiceId: string) => void;
}

export function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onEdit,
  onCancel,
  onReactivate,
}: InvoiceDetailModalProps) {
  if (!isOpen || !invoice) return null;

  const items =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            title: invoice.title || "صورت‌حساب خدمات ابری و زیرساخت",
            quantity: 1,
            unitPriceToman: invoice.totalToman || 0,
          },
        ];

  const subtotal = items.reduce(
    (sum: number, it: any) => sum + (it.unitPriceToman || 0) * (it.quantity || 1),
    0,
  );
  const total = invoice.totalToman || subtotal;

  const handlePrint = () => {
    const printContent = document.getElementById("isolated-invoice-printable");
    if (!printContent) {
      window.print();
      return;
    }
    const printWindow = window.open("", "_blank", "width=850,height=950");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
        <head>
          <meta charset="utf-8">
          <title>فاکتور ${formatInvoiceNumber(invoice.invoiceNumber || invoice.id)}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
            body { background: white; color: #0f172a; direction: rtl; padding: 24px; font-size: 12px; line-height: 1.5; }
            .print\\:hidden, .print-hidden { display: none !important; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; }
            th { background-color: #f1f5f9; font-weight: 700; color: #334155; }
            .border { border: 1px solid #e2e8f0; }
            .rounded-xl { border-radius: 12px; }
            .rounded-lg { border-radius: 8px; }
            .p-4 { padding: 16px; }
            .p-5 { padding: 20px; }
            .mb-4 { margin-bottom: 16px; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .gap-3 { gap: 12px; }
            .gap-4 { gap: 16px; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .text-sm { font-size: 13px; }
            .text-xs { font-size: 11px; }
            .text-muted-foreground { color: #64748b; }
            .bg-muted\\/20, .bg-muted\\/10 { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <div style="max-width: 800px; margin: 0 auto;">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              window.focus();
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #isolated-invoice-printable, #isolated-invoice-printable * {
            visibility: visible !important;
          }
          #isolated-invoice-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-hidden, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      <div
        id="isolated-invoice-printable"
        className="relative w-full max-w-3xl rounded-2xl border bg-card p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto print:shadow-none print:border-none print:max-w-none print:p-6 print:text-black"
      >
        {/* Top Actions Bar (Hidden on Print) */}
        <div className="flex items-center justify-between pb-4 border-b mb-6 print-hidden print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">جزئیات صورت‌حساب</h3>
              <p className="text-xs text-muted-foreground">
                شماره فاکتور: {formatInvoiceNumber(invoice.invoiceNumber || invoice.id)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs h-8"
            >
              <Printer className="h-4 w-4" />
              چاپ فاکتور
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(invoice);
                }}
                className="gap-1.5 text-xs h-8 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50"
              >
                <Edit2 className="h-3.5 w-3.5" />
                ویرایش
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Official Printable Invoice Sheet */}
        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border bg-muted/20 print:bg-gray-50 print:border-gray-300">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
                JC
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">جیکات کلود | Gecut Cloud</h2>
                <p className="text-xs text-muted-foreground">
                  صورت‌حساب رسمی خدمات ابری، هاستینگ و زیرساخت
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-muted-foreground">شماره صورت‌حساب:</span>
                <span className="font-bold text-foreground text-sm">
                  {formatInvoiceNumber(invoice.invoiceNumber || invoice.id)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    invoice.status === "PAID"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      : invoice.status === "UNPAID"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {invoice.status === "PAID" ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      تسویه‌شده (پرداخت موفق)
                    </>
                  ) : invoice.status === "UNPAID" ? (
                    <>
                      <Clock className="h-3 w-3" />
                      در انتظار پرداخت
                    </>
                  ) : (
                    <>
                      <Ban className="h-3 w-3" />
                      لغو شده
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Issue & Due Dates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border bg-card">
              <span className="text-muted-foreground block text-[11px] mb-1">تاریخ صدور:</span>
              <span className="font-medium font-mono">
                {formatJalaliDate(invoice.issuedAt || invoice.createdAt)}
              </span>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <span className="text-muted-foreground block text-[11px] mb-1">مهلت پرداخت:</span>
              <span className="font-medium font-mono text-amber-600 dark:text-amber-400">
                {formatJalaliDate(invoice.dueDate)}
              </span>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <span className="text-muted-foreground block text-[11px] mb-1">نوع تسویه:</span>
              <span className="font-medium">درگاه پرداخت شتابی</span>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <span className="text-muted-foreground block text-[11px] mb-1">واحد مالی:</span>
              <span className="font-medium">تومان ایران</span>
            </div>
          </div>

          {/* Seller & Customer Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Seller */}
            <div className="p-5 rounded-2xl border bg-muted/10 space-y-3">
              <div className="flex items-center gap-2.5 font-semibold text-foreground pb-2.5 border-b">
                <Building2 className="h-4 w-4 text-primary" />
                <span>مشخصات فروشنده (ارائه‌دهنده خدمت)</span>
              </div>
              <div className="space-y-1.5 text-muted-foreground">
                <p>
                  <strong className="text-foreground">نام:</strong> شرکت جیکات کلود (Gecut Cloud)
                </p>
                <p>
                  <strong className="text-foreground">موضوع فعالیت:</strong> خدمات زیرساخت ابری،
                  هاستینگ سازمانی و سرور اختصاصی
                </p>
                <p>
                  <strong className="text-foreground">پشتیبانی و مالی:</strong> support@gecut.local
                </p>
              </div>
            </div>

            {/* Customer */}
            <div className="p-5 rounded-2xl border bg-muted/10 space-y-3">
              <div className="flex items-center gap-2.5 font-semibold text-foreground pb-2.5 border-b">
                <User className="h-4 w-4 text-primary" />
                <span>مشخصات خریدار (مشتری)</span>
              </div>
              <div className="space-y-1.5 text-muted-foreground">
                <p>
                  <strong className="text-foreground">نام مشترک:</strong>{" "}
                  {invoice.customer?.name || "نامشخص"}
                </p>
                <p>
                  <strong className="text-foreground">عنوان سازمانی:</strong>{" "}
                  {invoice.customer?.displayName || invoice.customer?.company || "حقیقی / سازمانی"}
                </p>
                <p>
                  <strong className="text-foreground">شماره تماس:</strong>{" "}
                  <span className="font-mono">{invoice.customer?.phone || "---"}</span>
                </p>
                <p>
                  <strong className="text-foreground">شناسه کاربری:</strong>{" "}
                  <span className="font-mono text-[11px]">
                    {invoice.customerId || invoice.customer?.id || "---"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="py-3.5 px-5 w-12 text-center">ردیف</th>
                  <th className="py-3.5 px-5">شرح خدمات / بسته</th>
                  <th className="py-3.5 px-5 text-center w-24">تعداد / دوره</th>
                  <th className="py-3.5 px-5 text-left w-36">قیمت واحد (تومان)</th>
                  <th className="py-3.5 px-5 text-left w-36">مبلغ کل (تومان)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item: any, idx: number) => {
                  const qty = item.quantity || 1;
                  const unitPrice = item.unitPriceToman || 0;
                  const itemTotal = unitPrice * qty;
                  return (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="py-3.5 px-5 text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-foreground">
                        {item.title || "خدمات زیرساخت جیکات کلود"}
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono">{qty}</td>
                      <td className="py-3.5 px-5 text-left font-mono">
                        {unitPrice.toLocaleString("fa-IR")}
                      </td>
                      <td className="py-3.5 px-5 text-left font-mono font-semibold text-foreground">
                        {itemTotal.toLocaleString("fa-IR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-5 p-5 rounded-2xl border bg-muted/20">
            <div className="text-xs text-muted-foreground max-w-sm space-y-1">
              <p className="font-medium text-foreground">توضیحات و شرایط:</p>
              <p>
                کلیه مبالغ صورت‌حساب به تومان محاسبه گردیده است. خدمات پس از تایید تراکنش به صورت
                آنی فعال یا تمدید می‌گردد.
              </p>
              {invoice.notes && (
                <p className="text-primary font-medium mt-1">
                  یادداشت: {invoice.notes}
                </p>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>جمع ردیف‌ها:</span>
                <span className="font-mono">{subtotal.toLocaleString("fa-IR")} تومان</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>تخفیف / مالیات:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">0 تومان</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t font-bold text-sm text-foreground">
                <span>مبلغ قابل پرداخت:</span>
                <span className="font-mono text-primary text-base">
                  {total.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>
          </div>

          {/* Payment Receipt / Online Gateway Info (if available or paid) */}
          {invoice.payment ? (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400 pb-1.5 border-b border-emerald-500/20">
                <ShieldCheck className="h-4 w-4" />
                <span>رسید پرداخت آنلاین موفق (شاپرک)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-muted-foreground pt-1">
                <div>
                  <span className="block text-[11px]">درگاه پرداخت:</span>
                  <span className="font-medium text-foreground">
                    {invoice.payment.provider || "درگاه اینترنتی بانک"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px]">شماره پیگیری / مرجع بانکی:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {invoice.payment.gatewayRef || "---"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px]">زمان تایید تراکنش:</span>
                  <span className="font-mono text-foreground">
                    {formatJalaliDateTime(invoice.payment.paidAt || invoice.paidAt)}
                  </span>
                </div>
              </div>
            </div>
          ) : invoice.status === "UNPAID" ? (
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>این صورت‌حساب در انتظار پرداخت است و مشتری می‌تواند آن را به صورت آنلاین تسویه کند.</span>
              </div>
              {onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onCancel(invoice.id);
                  }}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/50 h-7 text-[11px] shrink-0 print:hidden"
                >
                  لغو این فاکتور
                </Button>
              )}
            </div>
          ) : invoice.status === "CANCELLED" ? (
            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>این صورت‌حساب لغو شده است.</span>
              </div>
              {onReactivate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onReactivate(invoice.id);
                  }}
                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-950/50 h-7 text-[11px] shrink-0 print:hidden font-medium cursor-pointer"
                >
                  فعال‌سازی مجدد این فاکتور
                </Button>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions (Hidden on Print) */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6 print:hidden">
          <Button variant="outline" onClick={onClose}>
            بستن
          </Button>
          <Button onClick={handlePrint} className="gap-1.5">
            <Printer className="h-4 w-4" />
            چاپ / دریافت پرینت
          </Button>
        </div>
      </div>
    </div>
  );
}
