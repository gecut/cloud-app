import { mockListDashboardServices } from "@/modules/dashboard/_mock/dashboard.mock";

export async function mockListServices(input?: { search?: string }) {
  const data = await mockListDashboardServices();
  const search = input?.search?.trim().toLowerCase();
  const items = search
    ? data.items.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search)
      )
    : data.items;

  return { ...data, items, total: items.length };
}

export async function mockGetServiceById(id: string) {
  const data = await mockListDashboardServices();
  const service = data.items.find((item) => item.id === id);
  if (!service) throw new Error("سرویس موردنظر یافت نشد");
  return service;
}

export async function mockListServiceEndpoints(serviceId: string) {
  const endpoints = [
    {
      id: "ep_1",
      serviceId: "svc_1",
      name: "Main Website",
      url: "https://choobinooo.ir",
      status: "UP",
    },
    {
      id: "ep_2",
      serviceId: "svc_1",
      name: "CMS",
      url: "https://cms.choobinooo.ir",
      status: "DEGRADED",
    },
  ];

  return endpoints.filter((item) => item.serviceId === serviceId);
}
