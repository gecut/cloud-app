import {
  ActorType,
  CustomerStatus,
  EndpointType,
  InvoiceStatus,
  PaymentAttemptStatus,
  Prisma,
  Role,
  ServerStatus,
  ServerVisibilityLevel,
  ServiceGroupStatus,
  ServiceStatus,
  type PrismaClient,
} from "@prisma/client";

import { createPrismaClient } from "./index";

type HighLevelScenarioResult = {
  customerId: string;
  serviceIds: string[];
  invoiceNumbers: string[];
};

type SeedResult = {
  adminPhone: string;
  customerPhone: string;
  adminEmail: string | null;
  customerEmail: string | null;
  scenario: HighLevelScenarioResult;
};

const IDS = {
  server: "seed_server_main_01",
  serviceGroup: "seed_service_group_main_platform",
  websiteService: "seed_service_website_hosting",
  apiService: "seed_service_api_infra",
  invoiceUnpaidItem: "seed_invoice_item_unpaid_01",
  invoicePaidItem: "seed_invoice_item_paid_01",
  invoiceManualItem: "seed_invoice_item_manual_01",
  paymentAttempt: "seed_payment_attempt_01",
  paymentAttemptCancelled: "seed_payment_attempt_02",
  auditInvoiceCreate: "seed_audit_invoice_create_01",
  auditPaymentSuccess: "seed_audit_payment_success_01",
} as const;

const EMAILS = {
  admin: "admin@gecut.local",
  customer: "ops@choobinooo.ir",
} as const;
const PHONES = {
  admin: "09120000001",
  customer: "09120000000",
} as const;

const SERVICE_TYPE_SLUGS = {
  websiteHosting: "website-hosting",
  apiInfrastructure: "api-infrastructure",
  vps: "vps",
} as const;

const PROVIDER = "زرین‌پال";
const DEFAULT_PASSWORDS = {
  admin: "Admin@123456",
  customer: "Customer@123456",
} as const;

function getInvoiceNumber(year: number, sequence: number) {
  return `GC-${year}-${sequence.toString().padStart(4, "0")}`;
}

async function seedBaseCatalog(prisma: Prisma.TransactionClient) {
  const [adminPasswordHash, customerPasswordHash] = await Promise.all([
    Bun.password.hash(DEFAULT_PASSWORDS.admin),
    Bun.password.hash(DEFAULT_PASSWORDS.customer),
  ]);

  const adminUser = await prisma.user.upsert({
    where: { phone: PHONES.admin },
    update: {
      name: "مدیر سامانه",
      role: Role.ADMIN,
      phone: PHONES.admin,
      email: EMAILS.admin,
      passwordHash: adminPasswordHash,
    },
    create: {
      name: "مدیر سامانه",
      phone: PHONES.admin,
      email: EMAILS.admin,
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { phone: PHONES.customer },
    update: {
      name: "کارشناس عملیات چوبینو",
      role: Role.CUSTOMER,
      phone: PHONES.customer,
      email: EMAILS.customer,
      passwordHash: customerPasswordHash,
    },
    create: {
      name: "کارشناس عملیات چوبینو",
      phone: PHONES.customer,
      email: EMAILS.customer,
      role: Role.CUSTOMER,
      passwordHash: customerPasswordHash,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: {
      name: "چوبینو",
      displayName: "پلتفرم چوبینو",
      status: CustomerStatus.ACTIVE,
      email: EMAILS.customer,
      phone: PHONES.customer,
    },
    create: {
      userId: customerUser.id,
      name: "چوبینو",
      displayName: "پلتفرم چوبینو",
      status: CustomerStatus.ACTIVE,
      email: EMAILS.customer,
      phone: PHONES.customer,
    },
  });

  const serviceTypes = await Promise.all([
    prisma.serviceType.upsert({
      where: { slug: SERVICE_TYPE_SLUGS.websiteHosting },
      update: {
        name: "میزبانی وب‌سایت",
        description: "میزبانی مدیریت‌شده برای وب‌سایت‌های عملیاتی",
        isActive: true,
        sortOrder: 1,
      },
      create: {
        name: "میزبانی وب‌سایت",
        slug: SERVICE_TYPE_SLUGS.websiteHosting,
        description: "میزبانی مدیریت‌شده برای وب‌سایت‌های عملیاتی",
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.serviceType.upsert({
      where: { slug: SERVICE_TYPE_SLUGS.apiInfrastructure },
      update: {
        name: "زیرساخت API",
        description: "زیرساخت اجرایی برای سرویس‌های API",
        isActive: true,
        sortOrder: 2,
      },
      create: {
        name: "زیرساخت API",
        slug: SERVICE_TYPE_SLUGS.apiInfrastructure,
        description: "زیرساخت اجرایی برای سرویس‌های API",
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.serviceType.upsert({
      where: { slug: SERVICE_TYPE_SLUGS.vps },
      update: {
        name: "سرور مجازی",
        description: "سرویس سرور مجازی برای بارهای عملیاتی",
        isActive: true,
        sortOrder: 3,
      },
      create: {
        name: "سرور مجازی",
        slug: SERVICE_TYPE_SLUGS.vps,
        description: "سرویس سرور مجازی برای بارهای عملیاتی",
        isActive: true,
        sortOrder: 3,
      },
    }),
  ]);

  await prisma.server.upsert({
    where: { id: IDS.server },
    update: {
      name: "سرور اصلی اروپا ۰۱",
      provider: "هتزنر",
      status: ServerStatus.ACTIVE,
      ipAddress: "203.0.113.10",
      location: "هلسینکی",
      cpu: "8 vCPU",
      ram: "16 GB",
      storage: "320 GB NVMe",
      monthlyCostToman: 9500000,
      internalNotes: "سرور اشتراکی اصلی برای سرویس‌های فعلی مشتریان",
    },
    create: {
      id: IDS.server,
      name: "سرور اصلی اروپا ۰۱",
      provider: "هتزنر",
      status: ServerStatus.ACTIVE,
      ipAddress: "203.0.113.10",
      location: "هلسینکی",
      cpu: "8 vCPU",
      ram: "16 GB",
      storage: "320 GB NVMe",
      monthlyCostToman: 9500000,
      internalNotes: "سرور اشتراکی اصلی برای سرویس‌های فعلی مشتریان",
    },
  });

  return {
    adminUser,
    customerUser,
    customer,
    serviceTypes,
  };
}

export async function seedHighLevelScenario(
  prisma: Prisma.TransactionClient,
): Promise<HighLevelScenarioResult> {
  const year = new Date().getUTCFullYear();
  const nextMonth = new Date();
  nextMonth.setUTCDate(nextMonth.getUTCDate() + 30);

  const [websiteType, apiType] = await Promise.all([
    prisma.serviceType.findUniqueOrThrow({
      where: { slug: SERVICE_TYPE_SLUGS.websiteHosting },
    }),
    prisma.serviceType.findUniqueOrThrow({
      where: { slug: SERVICE_TYPE_SLUGS.apiInfrastructure },
    }),
  ]);

  const customerUser = await prisma.user.findUniqueOrThrow({
    where: { phone: PHONES.customer },
    select: { id: true },
  });

  const customer = await prisma.customer.findUniqueOrThrow({
    where: { userId: customerUser.id },
    select: { id: true },
  });

  const serviceGroup = await prisma.serviceGroup.upsert({
    where: { id: IDS.serviceGroup },
    update: {
      customerId: customer.id,
      name: "زیرساخت اصلی پلتفرم",
      description: "سرویس‌های هسته عملیاتی و عمومی پلتفرم",
      status: ServiceGroupStatus.ACTIVE,
      sortOrder: 1,
    },
    create: {
      id: IDS.serviceGroup,
      customerId: customer.id,
      name: "زیرساخت اصلی پلتفرم",
      description: "سرویس‌های هسته عملیاتی و عمومی پلتفرم",
      status: ServiceGroupStatus.ACTIVE,
      sortOrder: 1,
    },
  });

  const [websiteService, apiService] = await Promise.all([
    prisma.service.upsert({
      where: { id: IDS.websiteService },
      update: {
        customerId: customer.id,
        serviceGroupId: serviceGroup.id,
        serviceTypeId: websiteType.id,
        serverId: IDS.server,
        name: "میزبانی وب‌سایت چوبینو",
        description: "محیط اجرایی سایت اصلی مشتری",
        status: ServiceStatus.ACTIVE,
        priceToman: 12000000,
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        renewalDate: new Date("2027-01-01T00:00:00.000Z"),
        serverVisibilityLevel: ServerVisibilityLevel.BASIC,
      },
      create: {
        id: IDS.websiteService,
        customerId: customer.id,
        serviceGroupId: serviceGroup.id,
        serviceTypeId: websiteType.id,
        serverId: IDS.server,
        name: "میزبانی وب‌سایت چوبینو",
        description: "محیط اجرایی سایت اصلی مشتری",
        status: ServiceStatus.ACTIVE,
        priceToman: 12000000,
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        renewalDate: new Date("2027-01-01T00:00:00.000Z"),
        serverVisibilityLevel: ServerVisibilityLevel.BASIC,
      },
    }),
    prisma.service.upsert({
      where: { id: IDS.apiService },
      update: {
        customerId: customer.id,
        serviceGroupId: serviceGroup.id,
        serviceTypeId: apiType.id,
        serverId: IDS.server,
        name: "زیرساخت API چوبینو",
        description: "محیط اجرایی سرویس‌های API",
        status: ServiceStatus.ACTIVE,
        priceToman: 9000000,
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        renewalDate: new Date("2027-01-01T00:00:00.000Z"),
        serverVisibilityLevel: ServerVisibilityLevel.DETAILED,
      },
      create: {
        id: IDS.apiService,
        customerId: customer.id,
        serviceGroupId: serviceGroup.id,
        serviceTypeId: apiType.id,
        serverId: IDS.server,
        name: "زیرساخت API چوبینو",
        description: "محیط اجرایی سرویس‌های API",
        status: ServiceStatus.ACTIVE,
        priceToman: 9000000,
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        renewalDate: new Date("2027-01-01T00:00:00.000Z"),
        serverVisibilityLevel: ServerVisibilityLevel.DETAILED,
      },
    }),
  ]);

  await Promise.all([
    prisma.endpoint.upsert({
      where: {
        serviceId_url: {
          serviceId: websiteService.id,
          url: "https://choobinooo.ir",
        },
      },
      update: {
        label: "وب‌سایت اصلی",
        type: EndpointType.HTTP,
        isPublic: true,
        isActive: true,
        provider: "بتر استک",
        externalMonitorId: "seed-monitor-main-web",
        status: "در دسترس",
        uptimePercentage30d: 99.97,
        responseTimeMs: 240,
        lastCheckedAt: new Date(),
      },
      create: {
        serviceId: websiteService.id,
        label: "وب‌سایت اصلی",
        url: "https://choobinooo.ir",
        type: EndpointType.HTTP,
        isPublic: true,
        isActive: true,
        provider: "بتر استک",
        externalMonitorId: "seed-monitor-main-web",
        status: "در دسترس",
        uptimePercentage30d: 99.97,
        responseTimeMs: 240,
        lastCheckedAt: new Date(),
      },
    }),
    prisma.endpoint.upsert({
      where: {
        serviceId_url: {
          serviceId: apiService.id,
          url: "https://api.choobinooo.ir",
        },
      },
      update: {
        label: "API عمومی",
        type: EndpointType.HTTP,
        isPublic: true,
        isActive: true,
        provider: "بتر استک",
        externalMonitorId: "seed-monitor-public-api",
        status: "در دسترس",
        uptimePercentage30d: 99.91,
        responseTimeMs: 320,
        lastCheckedAt: new Date(),
      },
      create: {
        serviceId: apiService.id,
        label: "API عمومی",
        url: "https://api.choobinooo.ir",
        type: EndpointType.HTTP,
        isPublic: true,
        isActive: true,
        provider: "بتر استک",
        externalMonitorId: "seed-monitor-public-api",
        status: "در دسترس",
        uptimePercentage30d: 99.91,
        responseTimeMs: 320,
        lastCheckedAt: new Date(),
      },
    }),
  ]);

  const unpaidInvoiceNumber = getInvoiceNumber(year, 1);
  const paidInvoiceNumber = getInvoiceNumber(year, 2);
  const cancelledInvoiceNumber = getInvoiceNumber(year, 3);

  await prisma.invoiceSequence.upsert({
    where: { year },
    update: { lastNumber: 3 },
    create: {
      year,
      lastNumber: 3,
    },
  });

  const [unpaidInvoice, paidInvoice, cancelledInvoice] = await Promise.all([
    prisma.invoice.upsert({
      where: { invoiceNumber: unpaidInvoiceNumber },
      update: {
        customerId: customer.id,
        status: InvoiceStatus.UNPAID,
        subtotalToman: 15000000,
        totalToman: 15000000,
        dueDate: nextMonth,
        notes: "صورتحساب ماهانه خدمات عملیاتی",
        paidAt: null,
        cancelledAt: null,
      },
      create: {
        customerId: customer.id,
        invoiceNumber: unpaidInvoiceNumber,
        status: InvoiceStatus.UNPAID,
        subtotalToman: 15000000,
        totalToman: 15000000,
        issuedAt: new Date(),
        dueDate: nextMonth,
        notes: "صورتحساب ماهانه خدمات عملیاتی",
      },
    }),
    prisma.invoice.upsert({
      where: { invoiceNumber: paidInvoiceNumber },
      update: {
        customerId: customer.id,
        status: InvoiceStatus.PAID,
        subtotalToman: 12000000,
        totalToman: 12000000,
        dueDate: nextMonth,
        notes: "صورتحساب سالانه میزبانی وب",
        paidAt: new Date(),
        cancelledAt: null,
      },
      create: {
        customerId: customer.id,
        invoiceNumber: paidInvoiceNumber,
        status: InvoiceStatus.PAID,
        subtotalToman: 12000000,
        totalToman: 12000000,
        issuedAt: new Date(),
        dueDate: nextMonth,
        paidAt: new Date(),
        notes: "صورتحساب سالانه میزبانی وب",
      },
    }),
    prisma.invoice.upsert({
      where: { invoiceNumber: cancelledInvoiceNumber },
      update: {
        customerId: customer.id,
        status: InvoiceStatus.CANCELLED,
        subtotalToman: 2000000,
        totalToman: 2000000,
        dueDate: nextMonth,
        notes: "نمونه صورتحساب لغوشده",
        paidAt: null,
        cancelledAt: new Date(),
      },
      create: {
        customerId: customer.id,
        invoiceNumber: cancelledInvoiceNumber,
        status: InvoiceStatus.CANCELLED,
        subtotalToman: 2000000,
        totalToman: 2000000,
        issuedAt: new Date(),
        dueDate: nextMonth,
        cancelledAt: new Date(),
        notes: "نمونه صورتحساب لغوشده",
      },
    }),
  ]);

  await Promise.all([
    prisma.invoiceItem.upsert({
      where: { id: IDS.invoiceUnpaidItem },
      update: {
        invoiceId: unpaidInvoice.id,
        serviceId: apiService.id,
        title: "تمدید زیرساخت API",
        description: "تمدید ماهانه سرویس زیرساخت API",
        quantity: 1,
        unitPriceToman: 9000000,
        totalToman: 9000000,
        serviceNameSnapshot: apiService.name,
        serviceTypeSnapshot: "زیرساخت API",
        servicePriceSnapshotToman: 9000000,
        serviceRenewalDateSnapshot: apiService.renewalDate,
      },
      create: {
        id: IDS.invoiceUnpaidItem,
        invoiceId: unpaidInvoice.id,
        serviceId: apiService.id,
        title: "تمدید زیرساخت API",
        description: "تمدید ماهانه سرویس زیرساخت API",
        quantity: 1,
        unitPriceToman: 9000000,
        totalToman: 9000000,
        serviceNameSnapshot: apiService.name,
        serviceTypeSnapshot: "زیرساخت API",
        servicePriceSnapshotToman: 9000000,
        serviceRenewalDateSnapshot: apiService.renewalDate,
      },
    }),
    prisma.invoiceItem.upsert({
      where: { id: IDS.invoiceManualItem },
      update: {
        invoiceId: unpaidInvoice.id,
        serviceId: null,
        title: "نگهداری و پشتیبانی عملیاتی",
        description: "خدمات نگهداری ماهانه و پشتیبانی زیرساخت",
        quantity: 1,
        unitPriceToman: 6000000,
        totalToman: 6000000,
      },
      create: {
        id: IDS.invoiceManualItem,
        invoiceId: unpaidInvoice.id,
        title: "نگهداری و پشتیبانی عملیاتی",
        description: "خدمات نگهداری ماهانه و پشتیبانی زیرساخت",
        quantity: 1,
        unitPriceToman: 6000000,
        totalToman: 6000000,
      },
    }),
    prisma.invoiceItem.upsert({
      where: { id: IDS.invoicePaidItem },
      update: {
        invoiceId: paidInvoice.id,
        serviceId: websiteService.id,
        title: "طرح سالانه میزبانی وب",
        description: "پرداخت سالانه سرویس میزبانی وب",
        quantity: 1,
        unitPriceToman: 12000000,
        totalToman: 12000000,
        serviceNameSnapshot: websiteService.name,
        serviceTypeSnapshot: "میزبانی وب‌سایت",
        servicePriceSnapshotToman: 12000000,
        serviceRenewalDateSnapshot: websiteService.renewalDate,
      },
      create: {
        id: IDS.invoicePaidItem,
        invoiceId: paidInvoice.id,
        serviceId: websiteService.id,
        title: "طرح سالانه میزبانی وب",
        description: "پرداخت سالانه سرویس میزبانی وب",
        quantity: 1,
        unitPriceToman: 12000000,
        totalToman: 12000000,
        serviceNameSnapshot: websiteService.name,
        serviceTypeSnapshot: "میزبانی وب‌سایت",
        servicePriceSnapshotToman: 12000000,
        serviceRenewalDateSnapshot: websiteService.renewalDate,
      },
    }),
  ]);

  await prisma.payment.upsert({
    where: { invoiceId: paidInvoice.id },
    update: {
      amountToman: 12000000,
      provider: PROVIDER,
      gatewayRef: "SEED-ZP-0001",
      paidAt: new Date(),
    },
    create: {
      invoiceId: paidInvoice.id,
      amountToman: 12000000,
      provider: PROVIDER,
      gatewayRef: "SEED-ZP-0001",
      paidAt: new Date(),
    },
  });

  await Promise.all([
    prisma.paymentAttempt.upsert({
      where: { id: IDS.paymentAttempt },
      update: {
        invoiceId: unpaidInvoice.id,
        amountToman: unpaidInvoice.totalToman,
        provider: PROVIDER,
        gatewayRef: "SEED-ZP-FAILED-0001",
        status: PaymentAttemptStatus.FAILED,
        errorCode: "GATEWAY_TIMEOUT",
        errorMessage: "اتمام زمان پاسخ‌گویی در مرحله تایید تراکنش",
        attemptedAt: new Date(),
      },
      create: {
        id: IDS.paymentAttempt,
        invoiceId: unpaidInvoice.id,
        amountToman: unpaidInvoice.totalToman,
        provider: PROVIDER,
        gatewayRef: "SEED-ZP-FAILED-0001",
        status: PaymentAttemptStatus.FAILED,
        errorCode: "GATEWAY_TIMEOUT",
        errorMessage: "اتمام زمان پاسخ‌گویی در مرحله تایید تراکنش",
        attemptedAt: new Date(),
      },
    }),
    prisma.paymentAttempt.upsert({
      where: { id: IDS.paymentAttemptCancelled },
      update: {
        invoiceId: cancelledInvoice.id,
        amountToman: cancelledInvoice.totalToman,
        provider: PROVIDER,
        gatewayRef: "SEED-ZP-CANCEL-0001",
        status: PaymentAttemptStatus.CANCELLED,
        errorCode: "USER_CANCELLED",
        errorMessage: "تراکنش توسط مشتری در صفحه درگاه لغو شد",
        attemptedAt: new Date(),
      },
      create: {
        id: IDS.paymentAttemptCancelled,
        invoiceId: cancelledInvoice.id,
        amountToman: cancelledInvoice.totalToman,
        provider: PROVIDER,
        gatewayRef: "SEED-ZP-CANCEL-0001",
        status: PaymentAttemptStatus.CANCELLED,
        errorCode: "USER_CANCELLED",
        errorMessage: "تراکنش توسط مشتری در صفحه درگاه لغو شد",
        attemptedAt: new Date(),
      },
    }),
  ]);

  await Promise.all([
    prisma.auditLog.upsert({
      where: { id: IDS.auditInvoiceCreate },
      update: {
        actorType: ActorType.USER,
        userId: customerUser.id,
        actorRole: Role.CUSTOMER,
        actorDisplayNameSnapshot: "کارشناس عملیات چوبینو",
        action: "invoice.created",
        entityType: "Invoice",
        entityId: unpaidInvoice.id,
        before: Prisma.JsonNull,
        after: { status: InvoiceStatus.UNPAID, totalToman: unpaidInvoice.totalToman },
        reason: "ثبت صورتحساب نمونه پرداخت‌نشده",
        metadata: { source: "seed-script", scenario: "high-level" },
      },
      create: {
        id: IDS.auditInvoiceCreate,
        actorType: ActorType.USER,
        userId: customerUser.id,
        actorRole: Role.CUSTOMER,
        actorDisplayNameSnapshot: "کارشناس عملیات چوبینو",
        action: "invoice.created",
        entityType: "Invoice",
        entityId: unpaidInvoice.id,
        after: { status: InvoiceStatus.UNPAID, totalToman: unpaidInvoice.totalToman },
        reason: "ثبت صورتحساب نمونه پرداخت‌نشده",
        metadata: { source: "seed-script", scenario: "high-level" },
      },
    }),
    prisma.auditLog.upsert({
      where: { id: IDS.auditPaymentSuccess },
      update: {
        actorType: ActorType.SYSTEM,
        userId: null,
        actorRole: null,
        actorDisplayNameSnapshot: "پردازشگر کال‌بک پرداخت",
        action: "payment.succeeded",
        entityType: "Payment",
        entityId: paidInvoice.id,
        before: { status: InvoiceStatus.UNPAID },
        after: { status: InvoiceStatus.PAID, provider: PROVIDER },
        reason: "ثبت نمونه پرداخت موفق",
        metadata: { source: "seed-script", callback: true },
      },
      create: {
        id: IDS.auditPaymentSuccess,
        actorType: ActorType.SYSTEM,
        actorDisplayNameSnapshot: "پردازشگر کال‌بک پرداخت",
        action: "payment.succeeded",
        entityType: "Payment",
        entityId: paidInvoice.id,
        before: { status: InvoiceStatus.UNPAID },
        after: { status: InvoiceStatus.PAID, provider: PROVIDER },
        reason: "ثبت نمونه پرداخت موفق",
        metadata: { source: "seed-script", callback: true },
      },
    }),
  ]);

  return {
    customerId: customer.id,
    serviceIds: [websiteService.id, apiService.id],
    invoiceNumbers: [unpaidInvoiceNumber, paidInvoiceNumber, cancelledInvoiceNumber],
  };
}

export async function seedDatabase(inputPrisma?: PrismaClient): Promise<SeedResult> {
  const prisma = inputPrisma ?? createPrismaClient();
  const shouldDisconnect = !inputPrisma;

  try {
    return await prisma.$transaction(async (tx) => {
      const base = await seedBaseCatalog(tx);
      const scenario = await seedHighLevelScenario(tx);

      return {
        adminPhone: base.adminUser.phone,
        customerPhone: base.customerUser.phone,
        adminEmail: base.adminUser.email,
        customerEmail: base.customerUser.email,
        scenario,
      };
    });
  } finally {
    if (shouldDisconnect) {
      await prisma.$disconnect();
    }
  }
}

if (import.meta.main) {
  seedDatabase()
    .then((result) => {
      console.log("Seed completed successfully");
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error: unknown) => {
      console.error("Seed failed");
      console.error(error);
      process.exit(1);
    });
}
