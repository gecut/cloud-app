export const servicesKeys = {
  all: ["services"] as const,
  list: () => [...servicesKeys.all, "list"] as const,
  detail: (id: string) => [...servicesKeys.all, "detail", id] as const,
};
