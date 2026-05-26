export type DashboardService = {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  priceToman: number;
  startDate: Date;
  renewalDate: Date;
  serviceType: { id: string; name: string };
};

export const services: DashboardService[] = [
  {
    id: "svc_1",
    name: "وب‌سایت اصلی چوبینو",
    description: "هاست و نگهداری پلتفرم اصلی",
    status: "ACTIVE",
    priceToman: 3250000,
    startDate: new Date("2025-11-01T00:00:00.000Z"),
    renewalDate: new Date("2026-06-01T00:00:00.000Z"),
    serviceType: { id: "st_1", name: "Managed Hosting" },
  },

  {
    id: "svc_2",
    name: "زیرساخت API",
    description: "سرویس API و مانیتورینگ داخلی",
    status: "SUSPENDED",
    priceToman: 2100000,
    startDate: new Date("2025-12-15T00:00:00.000Z"),
    renewalDate: new Date("2026-06-15T00:00:00.000Z"),
    serviceType: { id: "st_2", name: "API Infra" },
  },

  {
    id: "svc_3",
    name: "دامنه choobino.ir",
    description: "دامنه اصلی برند",
    status: "ACTIVE",
    priceToman: 890000,
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    renewalDate: new Date("2027-01-01T00:00:00.000Z"),
    serviceType: { id: "st_3", name: "Domain" },
  },

  {
    id: "svc_4",
    name: "سرور آلمان Hetzner",
    description: "سرور اختصاصی پردازش بک‌اند",
    status: "ACTIVE",
    priceToman: 7800000,
    startDate: new Date("2025-10-10T00:00:00.000Z"),
    renewalDate: new Date("2026-10-10T00:00:00.000Z"),
    serviceType: { id: "st_4", name: "VPS Server" },
  },

  {
    id: "svc_5",
    name: "اشتراک Cloudflare Pro",
    description: "CDN و محافظت امنیتی",
    status: "ACTIVE",
    priceToman: 1450000,
    startDate: new Date("2026-02-01T00:00:00.000Z"),
    renewalDate: new Date("2027-02-01T00:00:00.000Z"),
    serviceType: { id: "st_5", name: "CDN Subscription" },
  },

  {
    id: "svc_6",
    name: "سرویس ایمیل سازمانی",
    description: "ایمیل داخلی تیم",
    status: "INACTIVE",
    priceToman: 990000,
    startDate: new Date("2025-09-01T00:00:00.000Z"),
    renewalDate: new Date("2026-09-01T00:00:00.000Z"),
    serviceType: { id: "st_6", name: "Business Email" },
  },

  {
    id: "svc_7",
    name: "بکاپ ابری روزانه",
    description: "پشتیبان‌گیری اتوماتیک دیتابیس",
    status: "ACTIVE",
    priceToman: 1250000,
    startDate: new Date("2025-08-20T00:00:00.000Z"),
    renewalDate: new Date("2026-08-20T00:00:00.000Z"),
    serviceType: { id: "st_7", name: "Cloud Backup" },
  },

  {
    id: "svc_8",
    name: "گواهی SSL Wildcard",
    description: "امنیت دامنه و ساب‌دامین‌ها",
    status: "SUSPENDED",
    priceToman: 670000,
    startDate: new Date("2025-07-01T00:00:00.000Z"),
    renewalDate: new Date("2026-07-01T00:00:00.000Z"),
    serviceType: { id: "st_8", name: "SSL Certificate" },
  },

  {
    id: "svc_9",
    name: "مانیتورینگ سرور",
    description: "بررسی uptime و سلامت سرویس‌ها",
    status: "ACTIVE",
    priceToman: 540000,
    startDate: new Date("2026-03-01T00:00:00.000Z"),
    renewalDate: new Date("2027-03-01T00:00:00.000Z"),
    serviceType: { id: "st_9", name: "Monitoring" },
  },

  {
    id: "svc_10",
    name: "هاست دانلود فایل",
    description: "فضای ذخیره‌سازی فایل کاربران",
    status: "ACTIVE",
    priceToman: 3100000,
    startDate: new Date("2025-06-01T00:00:00.000Z"),
    renewalDate: new Date("2026-06-01T00:00:00.000Z"),
    serviceType: { id: "st_10", name: "Download Host" },
  },
];
export async function mockListDashboardServices() {
  return {
    items: services,
    total: services.length,
    page: 1,
    pageSize: 20,
  };
}
