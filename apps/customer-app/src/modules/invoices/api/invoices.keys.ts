export const invoicesKeys = {
  all: ["invoices"] as const,
  list: () => [...invoicesKeys.all, "list"] as const,
  detail: (id: string) => [...invoicesKeys.all, "detail", id] as const,
};
