import prisma from "@gecut-cloud/db";
import {
  CustomerStatus,
  InvoiceStatus,
  PaymentAttemptStatus,
  type Role,
  ServerStatus,
  ServiceGroupStatus,
  ServiceStatus,
  type Prisma,
} from "@gecut-cloud/db";

import { hashPassword } from "../auth/password";
import { assertAmountMatches, computeInvoiceTotals } from "../utils/money";
import { toPaginatedResult, toSkipTake } from "../utils/pagination";
import { AppError, assertOrThrow } from "../utils/errors";

type Actor = {
  userId?: string;
  role?: Role;
  displayName?: string;
};

async function createAudit(
  tx: Prisma.TransactionClient,
  actor: Actor,
  action: string,
  entityType: string,
  entityId: string,
  args?: {
    before?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    after?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    reason?: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await tx.auditLog.create({
    data: {
      actorType: actor.userId ? "USER" : "SYSTEM",
      userId: actor.userId,
      actorRole: actor.role,
      actorDisplayNameSnapshot: actor.displayName,
      action,
      entityType,
      entityId,
      before: args?.before,
      after: args?.after,
      reason: args?.reason,
      metadata: args?.metadata,
    },
  });
}

function buildInvoiceNumber(year: number, sequence: number) {
  return `GC-${year}-${sequence.toString().padStart(4, "0")}`;
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getUTCFullYear();

  const sequence = await tx.invoiceSequence.upsert({
    where: { year },
    update: {
      lastNumber: {
        increment: 1,
      },
    },
    create: {
      year,
      lastNumber: 1,
    },
  });

  return buildInvoiceNumber(year, sequence.lastNumber);
}

function assertInvoiceEditable(status: InvoiceStatus) {
  if (status !== "UNPAID") {
    throw new AppError("INVOICE_LOCKED", "Only unpaid invoices can be modified", "فقط فاکتورهای پرداخت‌نشده قابل ویرایش هستند");
  }
}

export async function listCustomers(input: {
  page: number;
  pageSize: number;
  search?: string;
  status?: CustomerStatus;
}) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const where: Prisma.CustomerWhereInput = {
    status: input.status,
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { displayName: { contains: input.search, mode: "insensitive" } },
            { phone: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
            { user: { phone: { contains: input.search, mode: "insensitive" } } },
            { user: { email: { contains: input.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return toPaginatedResult(items, total, page, pageSize);
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          lastLoginAt: true,
        },
      },
    },
  });
}

export async function createCustomer(
  actor: Actor,
  input: {
    name: string;
    displayName?: string;
    phone: string;
    email?: string;
    password: string;
  },
) {
  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.displayName ?? input.name,
        phone: input.phone,
        email: input.email,
        role: "CUSTOMER",
        passwordHash,
      },
    });

    const customer = await tx.customer.create({
      data: {
        userId: user.id,
        name: input.name,
        displayName: input.displayName,
        phone: input.phone,
        email: input.email,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            name: true,
          },
        },
      },
    });

    await createAudit(tx, actor, "customer.created", "Customer", customer.id, {
      after: {
        status: customer.status,
        name: customer.name,
      },
    });

    return customer;
  });
}

export async function updateCustomer(
  actor: Actor,
  input: {
    id: string;
    name?: string;
    displayName?: string | null;
    email?: string | null;
    phone?: string;
  },
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.customer.findUnique({
      where: { id: input.id },
      include: { user: true },
    });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "Customer not found", "مشتری موردنظر یافت نشد");

    const updated = await tx.customer.update({
      where: { id: input.id },
      data: {
        name: input.name,
        displayName: input.displayName,
        email: input.email,
        phone: input.phone,
      },
    });

    const nextUserData: Prisma.UserUpdateInput = {};

    if (input.phone !== undefined && input.phone !== current.user.phone) {
      nextUserData.phone = input.phone;
    }

    if (input.email !== undefined && input.email !== current.user.email) {
      nextUserData.email = input.email;
    }

    if (Object.keys(nextUserData).length > 0) {
      await tx.user.update({
        where: { id: current.userId },
        data: nextUserData,
      });
    }

    await createAudit(tx, actor, "customer.updated", "Customer", input.id, {
      before: {
        name: current.name,
        status: current.status,
      },
      after: {
        name: updated.name,
        status: updated.status,
      },
    });

    return updated;
  });
}

export async function setCustomerStatus(actor: Actor, id: string, status: CustomerStatus) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.customer.findUnique({ where: { id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "Customer not found", "مشتری موردنظر یافت نشد");

    const updated = await tx.customer.update({
      where: { id },
      data: { status },
    });

    await createAudit(tx, actor, "customer.status.changed", "Customer", id, {
      before: { status: current.status },
      after: { status: updated.status },
    });

    return updated;
  });
}

export async function listServiceGroups(input: {
  page: number;
  pageSize: number;
  search?: string;
  customerId?: string;
  status?: ServiceGroupStatus;
}) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const where: Prisma.ServiceGroupWhereInput = {
    customerId: input.customerId,
    status: input.status,
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { description: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.serviceGroup.findMany({
      where,
      skip,
      take,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { customer: { select: { id: true, name: true } } },
    }),
    prisma.serviceGroup.count({ where }),
  ]);

  return toPaginatedResult(items, total, page, pageSize);
}

export async function getServiceGroupById(id: string) {
  return prisma.serviceGroup.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      services: { select: { id: true, name: true, status: true } },
    },
  });
}

export async function createServiceGroup(
  actor: Actor,
  input: { customerId: string; name: string; description?: string; sortOrder?: number },
) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.serviceGroup.create({
      data: {
        customerId: input.customerId,
        name: input.name,
        description: input.description,
        sortOrder: input.sortOrder,
        status: "ACTIVE",
      },
    });

    await createAudit(tx, actor, "serviceGroup.created", "ServiceGroup", group.id, {
      after: { name: group.name, status: group.status },
    });

    return group;
  });
}

export async function updateServiceGroup(
  actor: Actor,
  input: { id: string; name?: string; description?: string | null; sortOrder?: number | null },
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.serviceGroup.findUnique({ where: { id: input.id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "ServiceGroup not found", "گروه سرویس یافت نشد");

    const updated = await tx.serviceGroup.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
        sortOrder: input.sortOrder,
      },
    });

    await createAudit(tx, actor, "serviceGroup.updated", "ServiceGroup", input.id, {
      before: { name: current.name, status: current.status },
      after: { name: updated.name, status: updated.status },
    });

    return updated;
  });
}

export async function setServiceGroupStatus(actor: Actor, id: string, status: ServiceGroupStatus) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.serviceGroup.findUnique({ where: { id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "ServiceGroup not found", "گروه سرویس یافت نشد");

    const updated = await tx.serviceGroup.update({
      where: { id },
      data: { status },
    });

    await createAudit(tx, actor, "serviceGroup.status.changed", "ServiceGroup", id, {
      before: { status: current.status },
      after: { status: updated.status },
    });

    return updated;
  });
}

export async function reorderServiceGroups(actor: Actor, input: { customerId: string; groupIds: string[] }) {
  return prisma.$transaction(async (tx) => {
    await Promise.all(
      input.groupIds.map((id, index) =>
        tx.serviceGroup.update({
          where: { id },
          data: { sortOrder: index + 1, customerId: input.customerId },
        }),
      ),
    );

    await createAudit(tx, actor, "serviceGroup.reordered", "ServiceGroup", input.customerId, {
      metadata: { groupIds: input.groupIds },
    });

    return { success: true };
  });
}

export async function listServiceTypes(input: { page: number; pageSize: number; search?: string }) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const where: Prisma.ServiceTypeWhereInput = input.search
    ? {
        OR: [
          { name: { contains: input.search, mode: "insensitive" } },
          { slug: { contains: input.search, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.serviceType.findMany({
      where,
      skip,
      take,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.serviceType.count({ where }),
  ]);

  return toPaginatedResult(items, total, page, pageSize);
}

export async function createServiceType(actor: Actor, input: {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.serviceType.create({
      data: {
        ...input,
        isActive: true,
      },
    });

    await createAudit(tx, actor, "serviceType.created", "ServiceType", created.id, {
      after: { name: created.name, isActive: created.isActive },
    });

    return created;
  });
}

export async function updateServiceType(actor: Actor, input: {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number | null;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.serviceType.findUnique({ where: { id: input.id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "ServiceType not found", "نوع سرویس یافت نشد");

    const updated = await tx.serviceType.update({
      where: { id: input.id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        sortOrder: input.sortOrder,
      },
    });

    await createAudit(tx, actor, "serviceType.updated", "ServiceType", input.id, {
      before: { name: current.name },
      after: { name: updated.name },
    });

    return updated;
  });
}

export async function setServiceTypeActive(actor: Actor, id: string, isActive: boolean) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.serviceType.findUnique({ where: { id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "ServiceType not found", "نوع سرویس یافت نشد");

    const updated = await tx.serviceType.update({
      where: { id },
      data: { isActive },
    });

    await createAudit(tx, actor, "serviceType.activation.changed", "ServiceType", id, {
      before: { isActive: current.isActive },
      after: { isActive: updated.isActive },
    });

    return updated;
  });
}

export async function listServices(input: {
  page: number;
  pageSize: number;
  search?: string;
  customerId?: string;
  status?: ServiceStatus;
  serviceTypeId?: string;
  from?: Date;
  to?: Date;
}) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const where: Prisma.ServiceWhereInput = {
    customerId: input.customerId,
    status: input.status,
    serviceTypeId: input.serviceTypeId,
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { description: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(input.from || input.to
      ? {
          renewalDate: {
            gte: input.from,
            lte: input.to,
          },
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
        customer: { select: { id: true, name: true } },
        serviceType: { select: { id: true, name: true } },
        serviceGroup: { select: { id: true, name: true } },
      },
    }),
    prisma.service.count({ where }),
  ]);

  return toPaginatedResult(items, total, page, pageSize);
}

export async function getServiceById(id: string) {
  return prisma.service.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      serviceType: true,
      serviceGroup: true,
      server: true,
      endpoints: true,
    },
  });
}

export async function createService(actor: Actor, input: {
  customerId: string;
  serviceGroupId?: string | null;
  serviceTypeId: string;
  serverId?: string | null;
  name: string;
  description?: string;
  status: ServiceStatus;
  priceToman: number;
  startDate: Date;
  renewalDate: Date;
  serverVisibilityLevel: "NONE" | "BASIC" | "DETAILED";
}) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.service.create({
      data: input,
    });

    await createAudit(tx, actor, "service.created", "Service", created.id, {
      after: { name: created.name, status: created.status },
    });

    return created;
  });
}

export async function updateService(actor: Actor, input: {
  id: string;
  serviceGroupId?: string | null;
  serviceTypeId?: string;
  serverId?: string | null;
  name?: string;
  description?: string | null;
  status?: ServiceStatus;
  priceToman?: number;
  startDate?: Date;
  renewalDate?: Date;
  serverVisibilityLevel?: "NONE" | "BASIC" | "DETAILED";
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.service.findUnique({ where: { id: input.id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "Service not found", "سرویس یافت نشد");

    const updated = await tx.service.update({
      where: { id: input.id },
      data: {
        serviceGroupId: input.serviceGroupId,
        serviceTypeId: input.serviceTypeId,
        serverId: input.serverId,
        name: input.name,
        description: input.description,
        status: input.status,
        priceToman: input.priceToman,
        startDate: input.startDate,
        renewalDate: input.renewalDate,
        serverVisibilityLevel: input.serverVisibilityLevel,
      },
    });

    await createAudit(tx, actor, "service.updated", "Service", input.id, {
      before: { status: current.status, name: current.name },
      after: { status: updated.status, name: updated.name },
    });

    return updated;
  });
}

export async function setServiceStatus(actor: Actor, id: string, status: ServiceStatus) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.service.findUnique({ where: { id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "Service not found", "سرویس یافت نشد");

    const updated = await tx.service.update({
      where: { id },
      data: { status },
    });

    if (status === "INACTIVE") {
      await tx.endpoint.updateMany({
        where: { serviceId: id },
        data: { isActive: false },
      });
    }

    await createAudit(tx, actor, "service.status.changed", "Service", id, {
      before: { status: current.status },
      after: { status: updated.status },
    });

    return updated;
  });
}

export async function updateServiceServerVisibility(
  actor: Actor,
  id: string,
  serverVisibilityLevel: "NONE" | "BASIC" | "DETAILED",
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.service.findUnique({ where: { id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "Service not found", "سرویس یافت نشد");

    const updated = await tx.service.update({
      where: { id },
      data: { serverVisibilityLevel },
    });

    await createAudit(tx, actor, "service.serverVisibility.changed", "Service", id, {
      before: { serverVisibilityLevel: current.serverVisibilityLevel },
      after: { serverVisibilityLevel: updated.serverVisibilityLevel },
    });

    return updated;
  });
}

export async function listEndpoints(input: { page: number; pageSize: number; search?: string; serviceId?: string }) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const where: Prisma.EndpointWhereInput = {
    serviceId: input.serviceId,
    ...(input.search
      ? {
          OR: [
            { label: { contains: input.search, mode: "insensitive" } },
            { url: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.endpoint.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            customerId: true,
          },
        },
      },
    }),
    prisma.endpoint.count({ where }),
  ]);

  return toPaginatedResult(items, total, page, pageSize);
}

export async function getEndpointById(id: string) {
  return prisma.endpoint.findUnique({
    where: { id },
    include: {
      service: {
        include: {
          customer: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function createEndpoint(actor: Actor, input: {
  serviceId: string;
  label: string;
  url: string;
  type: "HTTP" | "TCP" | "PING" | "KEYWORD" | "OTHER";
  isPublic: boolean;
  isActive: boolean;
  provider?: string;
  externalMonitorId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.endpoint.create({ data: input });

    await createAudit(tx, actor, "endpoint.created", "Endpoint", created.id, {
      after: { label: created.label, isPublic: created.isPublic },
    });

    return created;
  });
}

export async function updateEndpoint(actor: Actor, input: {
  id: string;
  label?: string;
  url?: string;
  type?: "HTTP" | "TCP" | "PING" | "KEYWORD" | "OTHER";
  isPublic?: boolean;
  isActive?: boolean;
  provider?: string | null;
  externalMonitorId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.endpoint.findUnique({ where: { id: input.id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "Endpoint not found", "اندپوینت یافت نشد");

    const updated = await tx.endpoint.update({
      where: { id: input.id },
      data: {
        label: input.label,
        url: input.url,
        type: input.type,
        isPublic: input.isPublic,
        isActive: input.isActive,
        provider: input.provider,
        externalMonitorId: input.externalMonitorId,
      },
    });

    await createAudit(tx, actor, "endpoint.updated", "Endpoint", input.id, {
      before: { label: current.label, isPublic: current.isPublic, isActive: current.isActive },
      after: { label: updated.label, isPublic: updated.isPublic, isActive: updated.isActive },
    });

    return updated;
  });
}

export async function setEndpointActive(actor: Actor, id: string, isActive: boolean) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.endpoint.findUnique({ where: { id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "Endpoint not found", "اندپوینت یافت نشد");

    const updated = await tx.endpoint.update({ where: { id }, data: { isActive } });

    await createAudit(tx, actor, "endpoint.activation.changed", "Endpoint", id, {
      before: { isActive: current.isActive },
      after: { isActive: updated.isActive },
    });

    return updated;
  });
}

export async function setEndpointVisibility(actor: Actor, id: string, isPublic: boolean) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.endpoint.findUnique({ where: { id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "Endpoint not found", "اندپوینت یافت نشد");

    const updated = await tx.endpoint.update({ where: { id }, data: { isPublic } });

    await createAudit(tx, actor, "endpoint.visibility.changed", "Endpoint", id, {
      before: { isPublic: current.isPublic },
      after: { isPublic: updated.isPublic },
    });

    return updated;
  });
}

export async function updateEndpointUptimeSummary(actor: Actor, input: {
  id: string;
  status?: string;
  uptimePercentage30d?: number;
  responseTimeMs?: number;
  lastCheckedAt?: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const endpoint = await tx.endpoint.findUnique({ where: { id: input.id } });

    assertOrThrow(endpoint, "RESOURCE_NOT_FOUND", "Endpoint not found", "اندپوینت یافت نشد");

    const updated = await tx.endpoint.update({
      where: { id: input.id },
      data: {
        status: input.status,
        uptimePercentage30d: input.uptimePercentage30d,
        responseTimeMs: input.responseTimeMs,
        lastCheckedAt: input.lastCheckedAt,
      },
    });

    await createAudit(tx, actor, "endpoint.uptime.updated", "Endpoint", input.id, {
      metadata: {
        status: updated.status,
        uptimePercentage30d: updated.uptimePercentage30d,
      },
    });

    return updated;
  });
}

export async function listServers(input: { page: number; pageSize: number; search?: string; status?: ServerStatus }) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const where: Prisma.ServerWhereInput = {
    status: input.status,
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { provider: { contains: input.search, mode: "insensitive" } },
            { ipAddress: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.server.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.server.count({ where }),
  ]);

  return toPaginatedResult(items, total, page, pageSize);
}

export async function getServerById(id: string) {
  return prisma.server.findUnique({
    where: { id },
    include: {
      services: {
        select: {
          id: true,
          name: true,
          status: true,
          customerId: true,
        },
      },
    },
  });
}

export async function createServer(actor: Actor, input: {
  name: string;
  provider: string;
  status: ServerStatus;
  ipAddress?: string;
  domain?: string;
  location?: string;
  cpu?: string;
  ram?: string;
  storage?: string;
  monthlyCostToman?: number;
  internalNotes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.server.create({ data: input });

    await createAudit(tx, actor, "server.created", "Server", created.id, {
      after: {
        name: created.name,
        status: created.status,
      },
    });

    return created;
  });
}

export async function updateServer(actor: Actor, input: {
  id: string;
  name?: string;
  provider?: string;
  status?: ServerStatus;
  ipAddress?: string | null;
  domain?: string | null;
  location?: string | null;
  cpu?: string | null;
  ram?: string | null;
  storage?: string | null;
  monthlyCostToman?: number | null;
  internalNotes?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.server.findUnique({ where: { id: input.id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "Server not found", "سرور یافت نشد");

    const updated = await tx.server.update({
      where: { id: input.id },
      data: input,
    });

    await createAudit(tx, actor, "server.updated", "Server", input.id, {
      before: { status: current.status, name: current.name },
      after: { status: updated.status, name: updated.name },
    });

    return updated;
  });
}

export async function setServerStatus(actor: Actor, id: string, status: ServerStatus) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.server.findUnique({ where: { id } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "Server not found", "سرور یافت نشد");

    const updated = await tx.server.update({ where: { id }, data: { status } });

    await createAudit(tx, actor, "server.status.changed", "Server", id, {
      before: { status: current.status },
      after: { status: updated.status },
    });

    return updated;
  });
}

export async function getServerHostedServices(serverId: string) {
  return prisma.service.findMany({
    where: { serverId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      customer: { select: { id: true, name: true } },
    },
  });
}

export async function listInvoices(input: {
  page: number;
  pageSize: number;
  search?: string;
  customerId?: string;
  status?: InvoiceStatus;
  from?: Date;
  to?: Date;
}) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const where: Prisma.InvoiceWhereInput = {
    customerId: input.customerId,
    status: input.status,
    ...(input.search
      ? {
          invoiceNumber: {
            contains: input.search,
            mode: "insensitive",
          },
        }
      : {}),
    ...(input.from || input.to
      ? {
          issuedAt: {
            gte: input.from,
            lte: input.to,
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
        customer: { select: { id: true, name: true } },
        payment: { select: { id: true, paidAt: true, provider: true, gatewayRef: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return toPaginatedResult(items, total, page, pageSize);
}

export async function getInvoiceById(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      items: true,
      payment: true,
      paymentAttempts: {
        orderBy: { attemptedAt: "desc" },
      },
    },
  });
}

export async function getInvoiceItems(invoiceId: string) {
  return prisma.invoiceItem.findMany({
    where: { invoiceId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createInvoice(
  actor: Actor,
  input: {
    customerId: string;
    dueDate: Date;
    notes?: string;
    items: Array<{
      serviceId?: string | null;
      title: string;
      description?: string;
      quantity: number;
      unitPriceToman: number;
    }>;
  },
) {
  return prisma.$transaction(async (tx) => {
    const invoiceNumber = await nextInvoiceNumber(tx);
    const totals = computeInvoiceTotals(input.items);

    const invoice = await tx.invoice.create({
      data: {
        customerId: input.customerId,
        invoiceNumber,
        status: "UNPAID",
        subtotalToman: totals.subtotalToman,
        totalToman: totals.totalToman,
        dueDate: input.dueDate,
        notes: input.notes,
      },
    });

    const items = await Promise.all(
      totals.normalizedItems.map(async (item) => {
        let snapshot: {
          serviceNameSnapshot?: string;
          serviceTypeSnapshot?: string;
          servicePriceSnapshotToman?: number;
          serviceRenewalDateSnapshot?: Date;
        } = {};

        if (item.serviceId) {
          const service = await tx.service.findUnique({
            where: { id: item.serviceId },
            include: { serviceType: true },
          });

          if (service) {
            snapshot = {
              serviceNameSnapshot: service.name,
              serviceTypeSnapshot: service.serviceType.name,
              servicePriceSnapshotToman: service.priceToman,
              serviceRenewalDateSnapshot: service.renewalDate,
            };
          }
        }

        return tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            serviceId: item.serviceId,
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unitPriceToman: item.unitPriceToman,
            totalToman: item.totalToman,
            ...snapshot,
          },
        });
      }),
    );

    await createAudit(tx, actor, "invoice.created", "Invoice", invoice.id, {
      after: {
        status: invoice.status,
        totalToman: invoice.totalToman,
        items: items.length,
      },
    });

    return tx.invoice.findUniqueOrThrow({
      where: { id: invoice.id },
      include: {
        items: true,
      },
    });
  });
}

export async function updateUnpaidInvoice(
  actor: Actor,
  input: {
    id: string;
    dueDate?: Date;
    notes?: string | null;
    items?: Array<{
      serviceId?: string | null;
      title: string;
      description?: string;
      quantity: number;
      unitPriceToman: number;
    }>;
  },
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.invoice.findUnique({
      where: { id: input.id },
      include: { items: true },
    });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "Invoice not found", "فاکتور یافت نشد");
    assertInvoiceEditable(current.status);

    let totals = {
      subtotalToman: current.subtotalToman,
      totalToman: current.totalToman,
    };

    if (input.items) {
      const computed = computeInvoiceTotals(input.items);
      totals = {
        subtotalToman: computed.subtotalToman,
        totalToman: computed.totalToman,
      };

      await tx.invoiceItem.deleteMany({ where: { invoiceId: input.id } });

      await Promise.all(
        computed.normalizedItems.map(async (item) => {
          let snapshot: {
            serviceNameSnapshot?: string;
            serviceTypeSnapshot?: string;
            servicePriceSnapshotToman?: number;
            serviceRenewalDateSnapshot?: Date;
          } = {};

          if (item.serviceId) {
            const service = await tx.service.findUnique({
              where: { id: item.serviceId },
              include: { serviceType: true },
            });

            if (service) {
              snapshot = {
                serviceNameSnapshot: service.name,
                serviceTypeSnapshot: service.serviceType.name,
                servicePriceSnapshotToman: service.priceToman,
                serviceRenewalDateSnapshot: service.renewalDate,
              };
            }
          }

          await tx.invoiceItem.create({
            data: {
              invoiceId: input.id,
              serviceId: item.serviceId,
              title: item.title,
              description: item.description,
              quantity: item.quantity,
              unitPriceToman: item.unitPriceToman,
              totalToman: item.totalToman,
              ...snapshot,
            },
          });
        }),
      );
    }

    const updated = await tx.invoice.update({
      where: { id: input.id },
      data: {
        dueDate: input.dueDate,
        notes: input.notes,
        subtotalToman: totals.subtotalToman,
        totalToman: totals.totalToman,
      },
      include: { items: true },
    });

    await createAudit(tx, actor, "invoice.updated", "Invoice", input.id, {
      before: { totalToman: current.totalToman, status: current.status },
      after: { totalToman: updated.totalToman, status: updated.status },
    });

    return updated;
  });
}

export async function cancelUnpaidInvoice(actor: Actor, invoiceId: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.invoice.findUnique({ where: { id: invoiceId } });

    assertOrThrow(current, "RESOURCE_NOT_FOUND", "Invoice not found", "فاکتور یافت نشد");
    assertInvoiceEditable(current.status);

    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    await createAudit(tx, actor, "invoice.cancelled", "Invoice", invoiceId, {
      before: { status: current.status },
      after: { status: updated.status },
    });

    return updated;
  });
}

export async function listSuccessfulPayments(input: {
  page: number;
  pageSize: number;
  search?: string;
}) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const where: Prisma.PaymentWhereInput = input.search
    ? {
        OR: [
          { provider: { contains: input.search, mode: "insensitive" } },
          { gatewayRef: { contains: input.search, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take,
      orderBy: { paidAt: "desc" },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customerId: true,
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return toPaginatedResult(items, total, page, pageSize);
}

export async function listPaymentAttempts(input: {
  page: number;
  pageSize: number;
  status?: PaymentAttemptStatus;
}) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const where: Prisma.PaymentAttemptWhereInput = {
    status: input.status,
  };

  const [items, total] = await Promise.all([
    prisma.paymentAttempt.findMany({
      where,
      skip,
      take,
      orderBy: { attemptedAt: "desc" },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customerId: true,
          },
        },
      },
    }),
    prisma.paymentAttempt.count({ where }),
  ]);

  return toPaginatedResult(items, total, page, pageSize);
}

export async function getPaymentByInvoiceId(invoiceId: string) {
  const [payment, attempts] = await Promise.all([
    prisma.payment.findUnique({
      where: { invoiceId },
    }),
    prisma.paymentAttempt.findMany({
      where: { invoiceId },
      orderBy: { attemptedAt: "desc" },
    }),
  ]);

  return { payment, attempts };
}

export async function simulatePaymentSuccess(
  actor: Actor,
  input: {
    invoiceId: string;
    provider: string;
    gatewayRef: string;
    amountToman: number;
  },
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: input.invoiceId },
      include: { payment: true },
    });

    assertOrThrow(invoice, "RESOURCE_NOT_FOUND", "Invoice not found", "فاکتور یافت نشد");

    assertAmountMatches(invoice.totalToman, input.amountToman);

    if (invoice.status === "CANCELLED") {
      await createAudit(tx, actor, "payment.callback.ignored", "Invoice", invoice.id, {
        reason: "Invoice is cancelled",
        metadata: { provider: input.provider, gatewayRef: input.gatewayRef },
      });

      throw new AppError(
        "PAYMENT_CALLBACK_IGNORED",
        "Cancelled invoice cannot be paid",
        "پرداخت برای فاکتور لغوشده مجاز نیست",
      );
    }

    if (invoice.status === "PAID" || invoice.payment) {
      await createAudit(tx, actor, "payment.callback.duplicate", "Invoice", invoice.id, {
        reason: "Duplicate successful callback",
        metadata: { provider: input.provider, gatewayRef: input.gatewayRef },
      });

      throw new AppError(
        "PAYMENT_DUPLICATE_CALLBACK",
        "Invoice already paid",
        "برای این فاکتور قبلاً پرداخت موفق ثبت شده است",
      );
    }

    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amountToman: input.amountToman,
        provider: input.provider,
        gatewayRef: input.gatewayRef,
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

    await createAudit(tx, actor, "payment.succeeded", "Payment", payment.id, {
      before: { status: invoice.status },
      after: { status: updatedInvoice.status, provider: payment.provider },
    });

    return {
      payment,
      invoice: updatedInvoice,
    };
  });
}

export async function simulatePaymentFailure(
  actor: Actor,
  input: {
    invoiceId: string;
    provider: string;
    gatewayRef: string;
    amountToman: number;
    status: PaymentAttemptStatus;
    errorCode: string;
    errorMessage: string;
  },
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });

    assertOrThrow(invoice, "RESOURCE_NOT_FOUND", "Invoice not found", "فاکتور یافت نشد");

    const attempt = await tx.paymentAttempt.create({
      data: {
        invoiceId: input.invoiceId,
        amountToman: input.amountToman,
        provider: input.provider,
        gatewayRef: input.gatewayRef,
        status: input.status,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        attemptedAt: new Date(),
      },
    });

    await createAudit(tx, actor, "payment.failed", "PaymentAttempt", attempt.id, {
      metadata: {
        invoiceId: input.invoiceId,
        status: input.status,
        errorCode: input.errorCode,
      },
    });

    return attempt;
  });
}

export async function retryFailedAttempt(actor: Actor, input: { attemptId: string; gatewayRef: string }) {
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { id: input.attemptId },
  });

  assertOrThrow(attempt, "RESOURCE_NOT_FOUND", "Payment attempt not found", "تلاش پرداخت یافت نشد");

  return simulatePaymentSuccess(actor, {
    invoiceId: attempt.invoiceId,
    provider: attempt.provider,
    gatewayRef: input.gatewayRef,
    amountToman: attempt.amountToman,
  });
}

export async function listAudit(input: {
  page: number;
  pageSize: number;
  entityType?: string;
  entityId?: string;
  actor?: string;
  action?: string;
  from?: Date;
  to?: Date;
}) {
  const { page, pageSize, skip, take } = toSkipTake(input);

  const where: Prisma.AuditLogWhereInput = {
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    ...(input.actor
      ? {
          OR: [
            { actorDisplayNameSnapshot: { contains: input.actor, mode: "insensitive" } },
            { user: { phone: { contains: input.actor, mode: "insensitive" } } },
            { user: { email: { contains: input.actor, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(input.from || input.to
      ? {
          createdAt: {
            gte: input.from,
            lte: input.to,
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return toPaginatedResult(items, total, page, pageSize);
}

export async function getAuditById(id: string) {
  return prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, phone: true, email: true, name: true } },
    },
  });
}

export async function getAdminDashboardSummary() {
  const now = new Date();
  const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    activeCustomers,
    suspendedCustomers,
    unpaidInvoices,
    activeServices,
    endpointUptime,
    nearDueInvoices,
  ] = await Promise.all([
    prisma.customer.count({ where: { status: "ACTIVE" } }),
    prisma.customer.count({ where: { status: "SUSPENDED" } }),
    prisma.invoice.aggregate({
      where: { status: "UNPAID" },
      _sum: { totalToman: true },
      _count: { _all: true },
    }),
    prisma.service.count({ where: { status: "ACTIVE" } }),
    prisma.endpoint.aggregate({
      where: { isActive: true },
      _avg: { uptimePercentage30d: true },
      _count: { _all: true },
    }),
    prisma.invoice.count({
      where: {
        status: "UNPAID",
        dueDate: {
          gte: now,
          lte: next7,
        },
      },
    }),
  ]);

  return {
    customers: {
      active: activeCustomers,
      suspended: suspendedCustomers,
    },
    invoices: {
      unpaidCount: unpaidInvoices._count._all,
      unpaidTotalToman: unpaidInvoices._sum.totalToman ?? 0,
      nearDueCount: nearDueInvoices,
    },
    services: {
      activeCount: activeServices,
    },
    uptime: {
      monitoredEndpoints: endpointUptime._count._all,
      avgUptimePercentage30d: endpointUptime._avg.uptimePercentage30d ?? null,
    },
  };
}
