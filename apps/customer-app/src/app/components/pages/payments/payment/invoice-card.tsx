import { Payments } from "@/app/data";
import { Server2 } from "@solar-icons/react-perf/category/devices/Bold";
import { GalleryWide } from "@solar-icons/react-perf/category/video/Bold";
import { cn } from "tailwind-variants";
import { Table } from "../table";
import { Button } from "@heroui/react/button";
import { getActiveCustomerUser } from "@/lib/api-client";
import { formatJalaliDateWords, toPersianDigits } from "@gecut-cloud/contracts";

export function InvoiceCard({
  data,
  className,
  onPay,
  isPaying = false,
}: {
  data: Payments;
  className?: string;
  onPay?: (invoice: Payments) => void;
  isPaying?: boolean;
}) {
  const deadlineDate = data.paymentDeadline ? new Date(data.paymentDeadline) : null;
  const isOverdue =
    data.status === "Awaiting payment" &&
    deadlineDate !== null &&
    !isNaN(deadlineDate.getTime()) &&
    Date.now() > deadlineDate.getTime();

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const overdueDays = isOverdue
    ? Math.max(1, Math.floor((Date.now() - deadlineDate!.getTime()) / MS_PER_DAY))
    : 0;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=850,height=950");
    const logoUrl = `${window.location.origin}/logo.png`;
    const user = getActiveCustomerUser();
    const customerName = user.name || "جناب آقای طباطبایی";
    const projectName = data.title || "rasta-company.com";
    const customerPhone = toPersianDigits(user.phone || "090136891759");
    const invoiceNum = toPersianDigits(data.factorNumber || "753");
    const jalaliDateStr = formatJalaliDateWords(data.factorCreated || new Date());
    const formatPrice = (n: number) => Number(n || 0).toLocaleString("fa-IR");
    const priceVal = Number(data.price || 0);

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
                فاکتور فروش خدمات
              </div>
              <div style="font-size: 12.5px; font-weight: 500; color: #1f2937;">
                تاریخ: <span>${jalaliDateStr}</span>
              </div>
            </div>

            <!-- 2. Parties Info (Seller on Right, Customer on Left) -->
            <div style="display: grid; grid-template-columns: 1fr 1px 1fr; gap: 24px; align-items: stretch; margin-bottom: 32px;">
              <!-- Right: Seller -->
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
              </div>

              <!-- Center Divider -->
              <div style="border-left: 1px dashed #d1d5db; height: 100%;"></div>

              <!-- Left: Customer -->
              <div style="text-align: right; line-height: 1.8;">
                <div style="font-weight: 800; font-size: 13.5px; color: #111827; margin-bottom: 6px; padding-top: 4px;">مشخصات مشتری</div>
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
              </div>
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
                <tr>
                  <td style="border: 1px solid #e5e7eb; padding: 12px 6px; text-align: center; font-weight: 700; font-size: 13px; color: #1f2937;">
                    ${toPersianDigits(1)}
                  </td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px 14px; text-align: center; font-size: 12.5px; color: #1f2937;">
                    <div style="font-weight: 600;">${data.title}</div>
                    ${data.subTitle ? `<div style="color: #6b7280; font-size: 11px; margin-top: 3px;">${data.subTitle}</div>` : ""}
                  </td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px 6px; text-align: center; font-size: 13px; color: #1f2937;">
                    ${toPersianDigits(data.volume || 1)}
                  </td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px 8px; text-align: center; font-size: 13px; color: #1f2937;">
                    ${formatPrice(priceVal)}
                  </td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px 8px; text-align: center; font-size: 13px; font-weight: 600; color: #1f2937;">
                    ${formatPrice(priceVal)}
                  </td>
                </tr>
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
                    ${formatPrice(priceVal)} تومان
                  </div>
                </div>
              </div>
            </div>

            <!-- 5. Horizontal Dashed Separator -->
            <div style="border-top: 1px dashed #d1d5db; width: 100%; margin: 24px 0;"></div>

            <!-- 6. Bank Information -->
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
    <div
      className={cn(
        "w-full flex flex-col gap-5 bg-surface p-6 sm:p-7 rounded-3xl border border-border/40 shadow-xs",
        isOverdue && "border-rose-500/40 ring-1 ring-rose-500/20",
        className,
      )}
    >
      <div className="w-full flex items-center justify-between pb-3 border-b border-border/30 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">شماره فاکتور:</span>
          <span className="text-accent font-semibold font-mono text-sm">
            {typeof data.factorNumber === "number"
              ? data.factorNumber.toLocaleString("fa-IR")
              : data.factorNumber}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onPress={handlePrint}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer px-2 border border-border/50 rounded-lg"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            چاپ فاکتور
          </Button>
          {isOverdue && (
            <span className="text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
              منقضی شده ({overdueDays.toLocaleString("fa-IR")} روز معوقه)
            </span>
          )}
          {data.status === "paid" && (
            <span className="text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              پرداخت شده
            </span>
          )}
        </div>
      </div>
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col justify-center gap-2.5">
            <span className="leading-none font-medium">{data.title}</span>
            <span className="text-xs leading-none text-accent">{data.subTitle}</span>
          </div>
        </div>
        {data.type === "DOMAIN" ? (
          <GalleryWide size={48} />
        ) : (
          <Server2 size={48} />
        )}
      </div>

      {isOverdue && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
          <svg className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-rose-800 dark:text-rose-200">
              ⚠️ خطا: مهلت پرداخت این صورت‌حساب به پایان رسیده است
            </span>
            <span className="text-[11px] opacity-90">
              این صورت‌حساب {overdueDays.toLocaleString("fa-IR")} روز گذشته از سررسید معوقه دارد. لطفاً هرچه سریع‌تر نسبت به پرداخت اقدام نمایید.
            </span>
          </div>
        </div>
      )}

      <Table payments={data} />

      {data.status === "paid" && (
        <div className="flex items-center justify-between w-full p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs">
          <span className="text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            وضعیت فاکتور:
          </span>
          <span className="text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-1 bg-emerald-500/15 rounded-lg flex items-center gap-1">
            پرداخت شده و تسویه گردید
          </span>
        </div>
      )}

      {data.status === "Awaiting payment" && (
        <div className="flex flex-col gap-2.5 w-full">
          <Button
            variant={isOverdue ? "danger" : "primary"}
            className="w-full rounded-xl font-medium py-2.5 cursor-pointer shadow-xs transition-opacity"
            isDisabled={isPaying}
            onPress={() => onPay?.(data)}
          >
            {isPaying ? "در حال اتصال به درگاه و ثبت پرداخت..." : isOverdue ? "پرداخت فوری فاکتور معوقه" : "پرداخت آنلاین"}
          </Button>
        </div>
      )}

      {data.status === "cancelled" && (
        <div className="flex items-center justify-between w-full p-4 bg-muted/20 border border-border/40 rounded-2xl text-xs">
          <span className="text-muted-foreground font-medium">وضعیت فاکتور:</span>
          <span className="text-rose-500 font-semibold px-2.5 py-1 bg-rose-500/10 rounded-lg">لغو شده توسط مدیریت</span>
        </div>
      )}
    </div>
  );
}
