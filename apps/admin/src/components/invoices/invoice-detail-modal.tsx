import React from "react";
import {
  FileText,
  X,
  Printer,
  Edit2,
  Ban,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatInvoiceNumber } from "@/utils/format";
import { Button } from "@gecut-cloud/ui/components/button";
import { formatJalaliDateWords, toPersianDigits } from "@gecut-cloud/contracts";
import { ModalPortal } from "../common/modal-portal";

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

  const isSupplier = Boolean(invoice.supplierId) || invoice.counterpartyType === "SUPPLIER";

  const items =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            title: invoice.title || (isSupplier ? "صورت‌حساب خدمات تامین‌کننده" : "خدمات میزبانی سرور (خارج)"),
            description: invoice.description || "مهر ماه",
            quantity: 1,
            unitPriceToman: invoice.totalToman || 0,
          },
        ];

  // Helper to determine accurate line item total, quantity, and unit price
  const getItemPricing = (it: any) => {
    const rawTotal = it.totalToman != null ? Number(it.totalToman) : null;
    const rawUnit = Number(it.unitPriceToman) || 0;
    const rawQty = Number(it.quantity) || 1;

    // Check if this is a package where quantity and unit price shouldn't multiply:
    // Capacity is stored in quantity or title, but unitPrice is the total package price
    const isPackageOrCapacity =
      it.service?.trackingType === "QUANTITY" ||
      it.title?.includes("بسته") ||
      it.title?.includes("تعداد:") ||
      (rawQty > 1 && rawTotal !== null && (rawTotal === rawUnit || invoice.totalToman === rawUnit));

    let qty = rawQty;
    let unit = rawUnit;
    let lineTotal = rawTotal != null ? rawTotal : rawUnit * rawQty;

    if (isPackageOrCapacity) {
      qty = 1;
      lineTotal = rawUnit || rawTotal || 0;
      unit = lineTotal;
    }

    return { qty, unit, lineTotal };
  };

  const hasPackageMultiplicationBug = items.some(
    (it: any) =>
      (it.service?.trackingType === "QUANTITY" || it.title?.includes("بسته") || it.title?.includes("تعداد:")) &&
      it.quantity > 1 &&
      invoice.totalToman === it.quantity * it.unitPriceToman,
  );

  const total =
    invoice.totalToman && !hasPackageMultiplicationBug
      ? invoice.totalToman
      : items.reduce((sum: number, it: any) => sum + getItemPricing(it).lineTotal, 0);

  const formatPrice = (n: number) => Number(n || 0).toLocaleString("fa-IR");

  const supplierName = invoice.supplier?.name || invoice.supplierName || "تامین‌کننده زیرساخت";
  const supplierContact = invoice.supplier?.contactPerson || "";
  const supplierPhone = toPersianDigits(invoice.supplier?.phone || "-");
  const supplierNotes = invoice.supplier?.notes || "";

  const customerName =
    invoice.customer?.name ||
    invoice.customer?.displayName ||
    "مشتری";

  const projectName =
    invoice.customer?.displayName ||
    invoice.customer?.company ||
    items[0]?.serviceNameSnapshot ||
    items[0]?.service?.name ||
    (isSupplier ? "تامین زیرساخت" : "-");

  const customerPhone = toPersianDigits(
    invoice.customer?.phone ||
      invoice.customer?.user?.phone ||
      "-",
  );

  const invoiceNum = toPersianDigits(invoice.invoiceNumber || invoice.id || "753");
  const jalaliDateStr = formatJalaliDateWords(invoice.issuedAt || invoice.createdAt || new Date());

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=850,height=950");
    const logoUrl = `${window.location.origin}/logo.png`;

    const rowsHtml = items
      .map((it: any, idx: number) => {
        const { qty, unit, lineTotal } = getItemPricing(it);
        const title = it.title || it.serviceNameSnapshot || it.service?.name || "خدمات میزبانی سرور";
        const desc = it.description || it.period || "";
        return `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 12px 6px; text-align: center; font-weight: 700; font-size: 13px; color: #1f2937;">
              ${toPersianDigits(idx + 1)}
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 12px 14px; text-align: center; font-size: 12.5px; color: #1f2937;">
              <div style="font-weight: 600;">${title}</div>
              ${desc ? `<div style="color: #6b7280; font-size: 11px; margin-top: 3px;">${desc}</div>` : ""}
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 12px 6px; text-align: center; font-size: 13px; color: #1f2937;">
              ${toPersianDigits(qty)}
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 12px 8px; text-align: center; font-size: 13px; color: #1f2937;">
              ${formatPrice(unit)}
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 12px 8px; text-align: center; font-size: 13px; font-weight: 600; color: #1f2937;">
              ${formatPrice(lineTotal)}
            </td>
          </tr>
        `;
      })
      .join("");

    const fullHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
        <head>
          <meta charset="utf-8">
          <title>فاکتور ${invoiceNum}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm 15mm; }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, 'Vazirmatn', 'Peyda', sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: #ffffff;
              color: #111827;
              direction: rtl;
              padding: 24px;
              font-size: 12px;
              line-height: 1.6;
            }
            .invoice-wrapper {
              max-width: 760px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <!-- 1. Header Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 36px; padding-top: 8px;">
              <div style="font-size: 12.5px; font-weight: 500; color: #1f2937;">
                شماره فاکتور: <span style="font-weight: 700;">${invoiceNum}</span>
              </div>
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; text-align: center;">
                ${isSupplier ? "فاکتور خرید و تامین خدمات" : "فاکتور فروش خدمات"}
              </div>
              <div style="font-size: 12.5px; font-weight: 500; color: #1f2937;">
                تاریخ: <span>${jalaliDateStr}</span>
              </div>
            </div>

            <!-- 2. Parties Info (Seller on Right, Buyer on Left) -->
            <div style="display: grid; grid-template-columns: 1fr 1px 1fr; gap: 24px; align-items: stretch; margin-bottom: 32px;">
              ${
                isSupplier
                  ? `
              <!-- Right: Seller (Supplier) -->
              <div style="text-align: right; line-height: 1.8;">
                <div style="font-weight: 800; font-size: 13.5px; color: #111827; margin-bottom: 4px;">مشخصات فروشنده (تامین‌کننده)</div>
                <div style="font-size: 12px; color: #374151; font-weight: 600;">${supplierName}</div>
                ${supplierContact ? `<div style="font-size: 12px; color: #374151;">مسئول / رابط: ${supplierContact}</div>` : ""}
                <div style="font-size: 12px; color: #374151;">
                  <span>شماره تماس: </span>
                  <span style="font-weight: 600; color: #111827;">${supplierPhone}</span>
                </div>
                <div style="font-size: 11px; color: #7c3aed; font-weight: 700; margin-top: 4px;">وضعیت: بستانکار (طلبکار از جیکات وب)</div>
              </div>

              <!-- Center Divider -->
              <div style="border-left: 1px dashed #d1d5db; height: 100%;"></div>

              <!-- Left: Buyer (Gecut Web) -->
              <div style="text-align: right; line-height: 1.8;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <div style="text-align: left; line-height: 1.1;">
                    <div style="color: #059669; font-weight: 800; font-size: 11px;">جیکات وب</div>
                    <div style="color: #1f2937; font-weight: 900; font-size: 10px; letter-spacing: 0.5px;">GECUT WEB</div>
                  </div>
                  <img src="${logoUrl}" alt="Gecut" style="width: 26px; height: 26px; object-fit: contain;" onerror="this.style.display='none'" />
                </div>
                <div style="font-weight: 800; font-size: 13.5px; color: #111827; margin-bottom: 4px;">مشخصات خریدار</div>
                <div style="font-size: 12px; color: #374151;">شرکت طراحی سایت جیکات وب</div>
                <div style="font-size: 12px; color: #374151;">
                  <span>شماره تماس : </span>
                  <span style="font-weight: 600; color: #111827;">۰۹۳۰۴۷۱۳۰۵۸</span>
                </div>
                <div style="font-size: 11px; color: #dc2626; font-weight: 700; margin-top: 4px;">وضعیت: بدهکار به تامین‌کننده</div>
              </div>
              `
                  : `
              <!-- Right: Seller (Gecut Web) -->
              <div style="text-align: right; line-height: 1.8;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <div style="text-align: left; line-height: 1.1;">
                    <div style="color: #059669; font-weight: 800; font-size: 11px;">جیکات وب</div>
                    <div style="color: #1f2937; font-weight: 900; font-size: 10px; letter-spacing: 0.5px;">GECUT WEB</div>
                  </div>
                  <img src="${logoUrl}" alt="Gecut" style="width: 26px; height: 26px; object-fit: contain;" onerror="this.style.display='none'" />
                </div>
                <div style="font-weight: 800; font-size: 13.5px; color: #111827; margin-bottom: 4px;">مشخصات فروشنده</div>
                <div style="font-size: 12px; color: #374151;">شرکت طراحی سایت جیکات وب</div>
                <div style="font-size: 12px; color: #374151;">
                  <span>شماره تماس : </span>
                  <span style="font-weight: 600; color: #111827;">۰۹۳۰۴۷۱۳۰۵۸</span>
                </div>
                <div style="font-size: 11px; color: #059669; font-weight: 700; margin-top: 4px;">وضعیت: بستانکار (طلبکار از مشتری)</div>
              </div>

              <!-- Center Divider -->
              <div style="border-left: 1px dashed #d1d5db; height: 100%;"></div>

              <!-- Left: Customer (Buyer) -->
              <div style="text-align: right; line-height: 1.8;">
                <div style="font-weight: 800; font-size: 13.5px; color: #111827; margin-bottom: 6px; padding-top: 4px;">مشخصات مشتری (خریدار)</div>
                <div style="font-size: 12px; color: #374151;">
                  <span>نام و نام خانوادگی:</span>
                  <span style="font-weight: 600; color: #111827; margin-right: 4px;">${customerName}</span>
                </div>
                <div style="font-size: 12px; color: #374151;">
                  <span>پروژه:</span>
                  <span style="font-weight: 600; color: #111827; margin-right: 4px;">${projectName}</span>
                </div>
                <div style="font-size: 12px; color: #374151;">
                  <span>شماره تماس :</span>
                  <span style="font-weight: 600; color: #111827; margin-right: 4px;">${customerPhone}</span>
                </div>
                <div style="font-size: 11px; color: #d97706; font-weight: 700; margin-top: 4px;">وضعیت: بدهکار به شرکت</div>
              </div>
              `
              }
            </div>

            <!-- 3. Items Table -->
            <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 24px;">
              <thead>
                <tr>
                  <th style="padding: 0 3px 10px 3px; width: 50px;">
                    <div style="background: #f1f3f5; border-radius: 8px; padding: 10px 4px; text-align: center; font-weight: 700; font-size: 12.5px; color: #1e293b;">
                      ردیف
                    </div>
                  </th>
                  <th style="padding: 0 3px 10px 3px;">
                    <div style="background: #f1f3f5; border-radius: 8px; padding: 10px 14px; text-align: center; font-weight: 700; font-size: 12.5px; color: #1e293b;">
                      شرح کالا یا خدمات
                    </div>
                  </th>
                  <th style="padding: 0 3px 10px 3px; width: 65px;">
                    <div style="background: #f1f3f5; border-radius: 8px; padding: 10px 4px; text-align: center; font-weight: 700; font-size: 12.5px; color: #1e293b;">
                      تعداد
                    </div>
                  </th>
                  <th style="padding: 0 3px 10px 3px; width: 140px;">
                    <div style="background: #f1f3f5; border-radius: 8px; padding: 10px 8px; text-align: center; font-weight: 700; font-size: 12.5px; color: #1e293b;">
                      قیمت واحد (تومان)
                    </div>
                  </th>
                  <th style="padding: 0 3px 10px 3px; width: 140px;">
                    <div style="background: #f1f3f5; border-radius: 8px; padding: 10px 8px; text-align: center; font-weight: 700; font-size: 12.5px; color: #1e293b;">
                      قیمت کل (تومان)
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <!-- 4. Totals Block -->
            <div style="display: flex; justify-content: center; margin-top: 18px; margin-bottom: 24px;">
              <div style="display: flex; flex-direction: column; gap: 8px; width: 330px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="background: #c3eccd; color: #166534; font-size: 12.5px; font-weight: 800; border-radius: 8px; padding: 7px 22px; text-align: center; width: 120px;">
                    قیمت کل
                  </div>
                  <div style="font-size: 14px; font-weight: 800; color: #111827; text-align: left;">
                    ${formatPrice(total)} تومان
                  </div>
                </div>
              </div>
            </div>

            <!-- 5. Horizontal Dashed Separator -->
            <div style="border-top: 1px dashed #d1d5db; width: 100%; margin: 24px 0;"></div>

            <!-- 6. Bank / Settlement Information -->
            ${
              isSupplier
                ? `
            <div style="text-align: right; line-height: 1.9; font-size: 12.5px; color: #1f2937;">
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">اطلاعات تسویه بدهی به تامین‌کننده</div>
              <div style="color: #374151;">طرف حساب: <span style="font-weight: 700; color: #111827;">${supplierName}</span></div>
              <div style="color: #4b5563; font-size: 12px;">شرکت جیکات وب خریدار خدمت بوده و بدهکار به تامین‌کننده است (واریز توسط جیکات وب).</div>
              ${supplierNotes ? `<div style="color: #6b7280; font-size: 11px; margin-top: 2px;">مشخصات حساب / یادداشت: ${supplierNotes}</div>` : ""}
            </div>
            `
                : `
            <div style="text-align: right; line-height: 1.9; font-size: 12.5px; color: #1f2937;">
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">اطلاعات بانکی</div>
              <div style="font-size: 14px; font-weight: 800; color: #0f172a;">
                شماره کارت: ${toPersianDigits("6219861073760684")}
              </div>
              <div style="color: #374151;">بانک: سامان</div>
              <div style="color: #374151;">نام صاحب حساب: مهدیار صهبائی احمدی</div>
              <div style="color: #374151;">
                لینک کارت آنلاین: <a href="https://k32.ir/sahbaee" target="_blank" style="color: #1f2937; text-decoration: underline; font-weight: 500;">k32.ir/sahbaee</a>
              </div>
            </div>
            `
            }
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
    `;

    if (printWindow) {
      printWindow.document.write(fullHtml);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
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
                شماره فاکتور: {invoiceNum}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs h-8 cursor-pointer"
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
                className="gap-1.5 text-xs h-8 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                ویرایش
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Exact Printable Invoice Sheet */}
        <div className="bg-white text-gray-900 rounded-xl p-6 sm:p-10 shadow-xs border border-gray-200 print:border-none print:shadow-none print:p-0 my-2">
          {/* 1. Header Bar: Date (Right) | Title (Center) | Invoice Number (Left) in RTL */}
          <div className="flex items-center justify-between w-full mb-8 pt-1">
            <div className="text-xs font-medium text-gray-800">
              شماره فاکتور <span className="font-bold">{invoiceNum}</span>
            </div>
            <div className="text-lg font-bold text-gray-900 text-center">
              {isSupplier ? "فاکتور خرید و تامین خدمات" : "فاکتور فروش خدمات"}
            </div>
            <div className="text-xs font-medium text-gray-800">
              تاریخ: <span>{jalaliDateStr}</span>
            </div>
          </div>

          {/* 2. Parties Info: Seller (Right) | Divider | Buyer (Left) */}
          <div className="grid grid-cols-[1fr_1px_1fr] gap-6 items-stretch mb-8">
            {/* Right: Seller */}
            {isSupplier ? (
              <div className="text-right leading-relaxed space-y-1">
                <div className="font-bold text-sm text-gray-900">مشخصات فروشنده (تامین‌کننده)</div>
                <div className="text-xs text-gray-800 font-semibold">{supplierName}</div>
                {supplierContact && (
                  <div className="text-xs text-gray-700">رابط / مسئول: {supplierContact}</div>
                )}
                <div className="text-xs text-gray-800">
                  <span>شماره تماس : </span>
                  <span className="font-semibold text-gray-900 font-mono">{supplierPhone}</span>
                </div>
                <div className="text-[11px] font-bold text-purple-700 bg-purple-50 inline-block px-2 py-0.5 rounded mt-1">
                  وضعیت: بستانکار (طلبکار از جیکات وب)
                </div>
              </div>
            ) : (
              <div className="text-right leading-relaxed space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-left leading-none">
                    <div className="text-[#059669] font-bold text-[11px]">جیکات وب</div>
                    <div className="text-gray-900 font-extrabold text-[10px] tracking-wider">GECUT WEB</div>
                  </div>
                  <img
                    src="/logo.png"
                    alt="Gecut"
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as any).style.display = "none";
                    }}
                  />
                </div>
                <div className="font-bold text-sm text-gray-900">مشخصات فروشنده</div>
                <div className="text-xs text-gray-800">شرکت طراحی سایت جیکات وب</div>
                <div className="text-xs text-gray-800">
                  <span>شماره تماس : </span>
                  <span className="font-semibold text-gray-900">{toPersianDigits("09304713058")}</span>
                </div>
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded mt-1">
                  وضعیت: بستانکار (طلبکار از مشتری)
                </div>
              </div>
            )}

            {/* Center Divider */}
            <div className="border-l border-dashed border-gray-300 h-full" />

            {/* Left: Buyer */}
            {isSupplier ? (
              <div className="text-right leading-relaxed space-y-1 pt-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-left leading-none">
                    <div className="text-[#059669] font-bold text-[11px]">جیکات وب</div>
                    <div className="text-gray-900 font-extrabold text-[10px] tracking-wider">GECUT WEB</div>
                  </div>
                  <img
                    src="/logo.png"
                    alt="Gecut"
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as any).style.display = "none";
                    }}
                  />
                </div>
                <div className="font-bold text-sm text-gray-900">مشخصات خریدار</div>
                <div className="text-xs text-gray-800">شرکت طراحی سایت جیکات وب</div>
                <div className="text-xs text-gray-800">
                  <span>شماره تماس : </span>
                  <span className="font-semibold text-gray-900">{toPersianDigits("09304713058")}</span>
                </div>
                <div className="text-[11px] font-bold text-rose-700 bg-rose-50 inline-block px-2 py-0.5 rounded mt-1">
                  وضعیت: بدهکار به تامین‌کننده (ما بدهکاریم)
                </div>
              </div>
            ) : (
              <div className="text-right leading-relaxed space-y-1 pt-1">
                <div className="font-bold text-sm text-gray-900 mb-2">مشخصات مشتری (خریدار)</div>
                <div className="text-xs text-gray-800">
                  <span className="text-gray-600">نام و نام خانوادگی: </span>
                  <span className="font-semibold text-gray-900">{customerName}</span>
                </div>
                <div className="text-xs text-gray-800">
                  <span className="text-gray-600">پروژه: </span>
                  <span className="font-semibold text-gray-900 font-mono">{projectName}</span>
                </div>
                <div className="text-xs text-gray-800">
                  <span className="text-gray-600">شماره تماس : </span>
                  <span className="font-semibold text-gray-900 font-mono">{customerPhone}</span>
                </div>
                <div className="text-[11px] font-bold text-amber-700 bg-amber-50 inline-block px-2 py-0.5 rounded mt-1">
                  وضعیت: بدهکار به شرکت
                </div>
              </div>
            )}
          </div>

          {/* 3. Items Table */}
          <table className="w-full border-collapse separate [border-spacing:0] mb-6">
            <thead>
              <tr>
                <th className="p-0.5 w-12 font-bold text-xs text-gray-800">
                  <div className="bg-[#f1f3f5] rounded-md py-2.5 px-1 text-center">ردیف</div>
                </th>
                <th className="p-0.5 font-bold text-xs text-gray-800">
                  <div className="bg-[#f1f3f5] rounded-md py-2.5 px-3 text-center">شرح کالا یا خدمات</div>
                </th>
                <th className="p-0.5 w-16 font-bold text-xs text-gray-800">
                  <div className="bg-[#f1f3f5] rounded-md py-2.5 px-1 text-center">تعداد</div>
                </th>
                <th className="p-0.5 w-36 font-bold text-xs text-gray-800">
                  <div className="bg-[#f1f3f5] rounded-md py-2.5 px-2 text-center">قیمت واحد (تومان)</div>
                </th>
                <th className="p-0.5 w-36 font-bold text-xs text-gray-800">
                  <div className="bg-[#f1f3f5] rounded-md py-2.5 px-2 text-center">قیمت کل (تومان)</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any, idx: number) => {
                const { qty, unit, lineTotal } = getItemPricing(it);
                const title = it.title || it.serviceNameSnapshot || it.service?.name || "خدمات میزبانی سرور";
                const desc = it.description || it.period || "";
                return (
                  <tr key={idx}>
                    <td className="border border-gray-200 py-3 px-1.5 text-center text-xs font-bold text-gray-800">
                      {toPersianDigits(idx + 1)}
                    </td>
                    <td className="border border-gray-200 py-3 px-3 text-center text-xs text-gray-800">
                      <div className="font-semibold text-gray-900">{title}</div>
                      {desc && <div className="text-[11px] text-gray-500 mt-0.5">{desc}</div>}
                    </td>
                    <td className="border border-gray-200 py-3 px-1.5 text-center text-xs text-gray-800">
                      {toPersianDigits(qty)}
                    </td>
                    <td className="border border-gray-200 py-3 px-2 text-center text-xs text-gray-800">
                      {formatPrice(unit)}
                    </td>
                    <td className="border border-gray-200 py-3 px-2 text-center text-xs font-semibold text-gray-900">
                      {formatPrice(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 4. Financial Totals Section */}
          <div className="flex justify-center my-6">
            <div className="flex flex-col gap-2 w-80">
              <div className="flex items-center justify-between">
                <div className="bg-[#c3eccd] text-[#166534] text-xs font-extrabold rounded-lg py-1.5 px-5 text-center w-32">
                  قیمت کل
                </div>
                <div className="text-sm font-bold text-gray-900 text-left">
                  {formatPrice(total)} تومان
                </div>
              </div>
            </div>
          </div>

          {/* 5. Horizontal Dashed Divider */}
          <div className="border-t border-dashed border-gray-300 w-full my-6" />

          {/* 6. Bank / Settlement Information Section */}
          {isSupplier ? (
            <div className="text-right leading-relaxed text-xs text-gray-800 space-y-1">
              <div className="text-sm font-bold text-gray-900 mb-1">اطلاعات تسویه بدهی به تامین‌کننده</div>
              <div className="text-gray-700">
                طرف‌حساب: <span className="font-bold text-gray-900">{supplierName}</span>
              </div>
              <div className="text-gray-600 text-[11px]">
                شرکت جیکات وب در این فاکتور خریدار خدمت بوده و بدهکار به تامین‌کننده می‌باشد (تسویه توسط مدیریت).
              </div>
              {supplierNotes && (
                <div className="text-gray-600 text-[11px]">
                  <span>مشخصات حساب / یادداشت: </span>
                  <span className="font-medium text-gray-800">{supplierNotes}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-right leading-relaxed text-xs text-gray-800 space-y-1">
              <div className="text-sm font-bold text-gray-900 mb-1">اطلاعات بانکی</div>
              <div className="text-sm font-bold text-gray-900 font-mono">
                شماره کارت: {toPersianDigits("6219861073760684")}
              </div>
              <div className="text-gray-700">بانک: سامان</div>
              <div className="text-gray-700">نام صاحب حساب: مهدیار صهبائی احمدی</div>
              <div className="text-gray-700">
                <span>لینک کارت آنلاین: </span>
                <a
                  href="https://k32.ir/sahbaee"
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-900 underline font-medium"
                >
                  k32.ir/sahbaee
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Status notice if Unpaid / Cancelled / Paid (Hidden on Print) */}
        {invoice.status === "UNPAID" ? (
          <div className="mt-4 p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                {isSupplier
                  ? "این صورت‌حساب خرید در انتظار پرداخت و تسویه توسط جیکات وب است (ما به تامین‌کننده بدهکاریم)."
                  : "این صورت‌حساب در انتظار پرداخت است و مشتری می‌تواند آن را به صورت آنلاین تسویه کند (طلب از مشتری)."}
              </span>
            </div>
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onCancel(invoice.id);
                }}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/50 h-7 text-[11px] shrink-0 font-medium cursor-pointer"
              >
                لغو این فاکتور
              </Button>
            )}
          </div>
        ) : invoice.status === "CANCELLED" ? (
          <div className="mt-4 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between print:hidden">
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
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-950/50 h-7 text-[11px] shrink-0 font-medium cursor-pointer"
              >
                فعال‌سازی مجدد این فاکتور
              </Button>
            )}
          </div>
        ) : invoice.status === "PAID" ? (
          <div className="mt-4 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 print:hidden">
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {isSupplier
                ? "این صورت‌حساب به تامین‌کننده پرداخت و تسویه شده است (بدهی تسویه گردید)."
                : "این صورت‌حساب تسویه و دریافت گردیده است (طلب وصول شد)."}
            </span>
          </div>
        ) : null}

        {/* Footer Actions (Hidden on Print) */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6 print:hidden">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            بستن
          </Button>
          <Button onClick={handlePrint} className="gap-1.5 cursor-pointer">
            <Printer className="h-4 w-4" />
            چاپ / دریافت پرینت
          </Button>
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}

