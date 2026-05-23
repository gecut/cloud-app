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

const services: DashboardService[] = [
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
];

export async function mockListDashboardServices() {
  return {
    items: services,
    total: services.length,
    page: 1,
    pageSize: 20,
  };
}
