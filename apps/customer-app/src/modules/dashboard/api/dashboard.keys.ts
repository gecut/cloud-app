export const dashboardKeys = {
  all: ["dashboard"] as const,
  myServices: () => [...dashboardKeys.all, "my-services"] as const,
};
