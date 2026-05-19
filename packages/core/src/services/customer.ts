import prisma from "@gecut-cloud/db";

import { assertAmountMatches } from "../utils/money";
import { toPaginatedResult, toSkipTake } from "../utils/pagination";
import { AppError, assertOrThrow } from "../utils/errors";

function applyServerVisibility(service: {
  serverVisibilityLevel: "NONE" | "BASIC" | "DETAILED";
  server: null | {
    id: string;
    name: string;
    provider: string;
    status: string;
    ipAddress: string | null;
    domain: string | null;
    location: string | null;
    cpu: string | null;
    ram: string | null;
    storage: string | null;
    monthlyCostToman: number | null;
    internalNotes: string | null;
  };
}) {
  if (!service.server) {
    return null;
  }

  if (service.serverVisibilityLevel === "NONE") {
    return null;
  }

  if (service.serverVisibilityLevel === "BASIC") {
    return {
      id: service.server.id,
      name: service.server.name,
      provider: service.server.provider,
      status: service.server.status,
      location: service.server.location,
      domain: service.server.domain,
    };
  }

  return {
    id: service.server.id,
    name: service.server.name,
    provider: service.server.provider,
    status: service.server.status,
    ipAddress: service.server.ipAddress,
    domain: service.server.domain,
    location: service.server.location,
    cpu: service.server.cpu,
    ram: service.server.ram,
    storage: service.server.storage,
  };
}

export async function listMyServices(
  customerId: string,
  input: { page: number; pageSize: number; search?: string }
) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const where = {
    customerId,
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            {
              description: {
                contains: input.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        serviceType: {
          select: { id: true, name: true },
        },
        server: true,
        endpoints: true,
        serviceGroup: true,
      },
    }),
    prisma.service.count({ where }),
  ]);

  const mapped = items.map((item) => ({
    ...item,
    server: applyServerVisibility(item),
  }));

  return toPaginatedResult(mapped, total, page, pageSize);
}

export async function getMyServiceById(customerId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      customerId,
    },
    include: {
      serviceType: true,
      serviceGroup: true,
      server: true,
    },
  });

  if (!service) {
    throw new AppError(
      "RESOURCE_NOT_FOUND",
      "Service not found",
      "سرویس موردنظر یافت نشد"
    );
  }

  return {
    ...service,
    server: applyServerVisibility(service),
  };
}

export async function getMyServiceEndpoints(
  customerId: string,
  serviceId: string
) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, customerId },
    select: { id: true },
  });

  if (!service) {
    throw new AppError(
      "TENANT_ACCESS_DENIED",
      "Service does not belong to customer",
      "دسترسی به این سرویس مجاز نیست"
    );
  }

  return prisma.endpoint.findMany({
    where: {
      serviceId,
      isPublic: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listMyInvoices(
  customerId: string,
  input: {
    page: number;
    pageSize: number;
    search?: string;
    status?: "UNPAID" | "PAID" | "CANCELLED";
  }
) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const where = {
    customerId,
    status: input.status,
    ...(input.search
      ? {
          invoiceNumber: {
            contains: input.search,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        payment: {
          select: {
            id: true,
            provider: true,
            gatewayRef: true,
            paidAt: true,
          },
        },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return toPaginatedResult(items, total, page, pageSize);
}

export async function getMyInvoiceById(customerId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      customerId,
    },
    include: {
      payment: true,
      paymentAttempts: {
        orderBy: { attemptedAt: "desc" },
      },
    },
  });

  if (!invoice) {
    throw new AppError(
      "RESOURCE_NOT_FOUND",
      "Invoice not found",
      "فاکتور موردنظر یافت نشد"
    );
  }

  return invoice;
}

export async function getMyInvoiceItems(customerId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      customerId,
    },
    select: { id: true },
  });

  if (!invoice) {
    throw new AppError(
      "RESOURCE_NOT_FOUND",
      "Invoice not found",
      "فاکتور موردنظر یافت نشد"
    );
  }

  return prisma.invoiceItem.findMany({
    where: { invoiceId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getInvoicePaymentStatus(
  customerId: string,
  invoiceId: string
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, customerId },
    include: {
      payment: true,
      paymentAttempts: {
        orderBy: { attemptedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!invoice) {
    throw new AppError(
      "RESOURCE_NOT_FOUND",
      "Invoice not found",
      "فاکتور موردنظر یافت نشد"
    );
  }

  return {
    invoiceId: invoice.id,
    status: invoice.status,
    paidAt: invoice.paidAt,
    payment: invoice.payment,
    lastAttempts: invoice.paymentAttempts,
  };
}

export async function listMyPaymentAttempts(
  customerId: string,
  input: {
    page: number;
    pageSize: number;
    status?: "FAILED" | "CANCELLED" | "EXPIRED" | "UNKNOWN";
  }
) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const [items, total] = await Promise.all([
    prisma.paymentAttempt.findMany({
      where: {
        status: input.status,
        invoice: {
          customerId,
        },
      },
      skip,
      take,
      orderBy: { attemptedAt: "desc" },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
          },
        },
      },
    }),
    prisma.paymentAttempt.count({
      where: {
        status: input.status,
        invoice: {
          customerId,
        },
      },
    }),
  ]);

  return toPaginatedResult(items, total, page, pageSize);
}

export async function simulatePayInvoice(
  customerId: string,
  input: {
    invoiceId: string;
    provider: string;
    gatewayRef: string;
    amountToman: number;
  }
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: {
        id: input.invoiceId,
        customerId,
      },
      include: {
        payment: true,
      },
    });

    assertOrThrow(
      invoice,
      "RESOURCE_NOT_FOUND",
      "Invoice not found",
      "فاکتور موردنظر یافت نشد"
    );

    if (invoice.status === "CANCELLED") {
      throw new AppError(
        "INVOICE_INVALID_STATUS",
        "Cancelled invoice cannot be paid",
        "امکان پرداخت فاکتور لغوشده وجود ندارد"
      );
    }

    if (invoice.status === "PAID" || invoice.payment) {
      throw new AppError(
        "PAYMENT_DUPLICATE_CALLBACK",
        "Invoice already paid",
        "برای این فاکتور قبلاً پرداخت ثبت شده است"
      );
    }

    assertAmountMatches(invoice.totalToman, input.amountToman);

    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        provider: input.provider,
        gatewayRef: input.gatewayRef,
        amountToman: input.amountToman,
        paidAt: new Date(),
      },
    });

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        paidAt: payment.paidAt,
      },
    });

    await tx.auditLog.create({
      data: {
        actorType: "SYSTEM",
        actorDisplayNameSnapshot: "شبیه‌ساز پرداخت مشتری",
        action: "payment.simulated.by.customer",
        entityType: "Payment",
        entityId: payment.id,
        after: {
          invoiceId: invoice.id,
          amountToman: payment.amountToman,
        },
      },
    });

    return {
      payment,
      invoice: updatedInvoice,
    };
  });
}

export async function getCustomerDashboardSummary(customerId: string) {
  const [services, invoices, endpointUptime] = await Promise.all([
    prisma.service.count({
      where: {
        customerId,
        status: "ACTIVE",
      },
    }),
    prisma.invoice.aggregate({
      where: {
        customerId,
        status: "UNPAID",
      },
      _count: { _all: true },
      _sum: { totalToman: true },
    }),
    prisma.endpoint.aggregate({
      where: {
        service: {
          customerId,
        },
        isPublic: true,
      },
      _avg: { uptimePercentage30d: true },
      _count: { _all: true },
    }),
  ]);

  return {
    invoices: {
      unpaidCount: invoices._count._all,
      unpaidTotalToman: invoices._sum.totalToman ?? 0,
    },
    services: {
      activeCount: services,
    },
    uptime: {
      endpointCount: endpointUptime._count._all,
      avgUptimePercentage30d: endpointUptime._avg.uptimePercentage30d ?? null,
    },
  };
}
