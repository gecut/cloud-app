export const paymentsKeys = {
  all: ["payments"] as const,
  list: () => [...paymentsKeys.all, "list"] as const,
  detail: (id: string) => [...paymentsKeys.all, "detail", id] as const,
};
