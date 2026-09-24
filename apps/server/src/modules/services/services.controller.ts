import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CurrentUser, CurrentUserData } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { CreateServiceCommand } from "./commands/create-service/create-service.command";
import { CreateServiceDto } from "./commands/create-service/create-service.dto";
import { UpdateServiceCommand } from "./commands/update-service/update-service.command";
import { UpdateServiceDto } from "./commands/update-service/update-service.dto";
import { GetServiceQuery } from "./queries/get-service/get-service.query";
import { ListServicesQuery } from "./queries/list-services/list-services.query";

@ApiTags("services")
@Controller("services")
@UseGuards(RolesGuard)
export class ServicesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles("ADMIN")
  @ApiOperation({ summary: "Create a new service" })
  async create(@Body() dto: CreateServiceDto) {
    return this.commandBus.execute(new CreateServiceCommand(dto));
  }

  @Patch(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update service details or status" })
  async update(@Param("id") id: string, @Body() dto: UpdateServiceDto) {
    return this.commandBus.execute(new UpdateServiceCommand(id, dto));
  }

  @Get()
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "List services with pagination and filtering" })
  @ApiQuery({ name: "customerId", required: false, type: String })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async list(
    @CurrentUser() user: CurrentUserData,
    @Query("customerId") customerId?: string,
    @Query("status") status?: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    // For customers, strictly enforce tenant isolation: only return their services
    let effectiveCustomerId = customerId;
    if (user?.role === "CUSTOMER") {
      let resolvedCustomerId = user.customerId;
      if (!resolvedCustomerId) {
        const cust = await this.prisma.customer.findFirst({
          where: {
            OR: [
              { userId: user.id },
              ...(user.phone ? [{ phone: user.phone }] : []),
            ],
          },
        });
        resolvedCustomerId = cust?.id;
      }
      effectiveCustomerId = resolvedCustomerId || "__NO_CUSTOMER_SERVICES__";
    }

    return this.queryBus.execute(
      new ListServicesQuery(effectiveCustomerId, Number(page), Number(limit), status),
    );

  }

  @Get("categories")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "List categories alias under /services/categories" })
  async getCategories() {
    const items = await this.prisma.serviceType.findMany({
      include: {
        _count: {
          select: { services: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return {
      items: items.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: cat.isActive,
        sortOrder: cat.sortOrder,
        servicesCount: (cat as any)._count?.services || 0,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      })),
      total: items.length,
    };
  }

  @Get(":id")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Get service details by ID" })
  async get(@Param("id") id: string) {
    return this.queryBus.execute(new GetServiceQuery(id));
  }

  @Post(":id/renew")
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "Request renewal and issue invoice for service" })
  async renew(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() body?: { cycleDays?: number },
  ) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { customer: true, serviceType: true },
    });

    if (!service) {
      throw new NotFoundException("سرویس مورد نظر یافت نشد");
    }

    // Tenant isolation: customers can only renew their own services
    if (user?.role === "CUSTOMER") {
      const effectiveCustId = user.customerId || user.id;
      if (service.customerId !== effectiveCustId) {
        throw new ForbiddenException("شما دسترسی به تمدید این سرویس را ندارید");
      }
    }

    if (!service.customerId) {
      throw new BadRequestException("این سرویس به هیچ مشتری اختصاص داده نشده است");
    }

    const now = new Date();
    let cycleDays = body?.cycleDays || 30;
    const parsedCycle = Number((service as any).billingCycle);
    if (!body?.cycleDays && !isNaN(parsedCycle) && parsedCycle > 0) {
      cycleDays = parsedCycle;
    } else if (!body?.cycleDays && (service as any).billingCycle === "ANNUAL") {
      cycleDays = 365;
    } else if (!body?.cycleDays && (service as any).billingCycle === "SEMI_ANNUAL") {
      cycleDays = 180;
    } else if (!body?.cycleDays && (service as any).billingCycle === "QUARTERLY") {
      cycleDays = 90;
    }

    // Update service dates and reactivate starting from previous renewal date
    const previousRenewalDate = service.renewalDate ? new Date(service.renewalDate) : now;
    const newStartDate = previousRenewalDate;
    let newRenewalDate = new Date(newStartDate.getTime() + cycleDays * 24 * 60 * 60 * 1000);
    if (newRenewalDate.getTime() <= now.getTime()) {
      newRenewalDate = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000);
    }

    const updatedService = await this.prisma.service.update({
      where: { id: service.id },
      data: {
        status: "ACTIVE",
        purchaseDate: newStartDate,
        renewalDate: newRenewalDate,
        usedQuantity: 0,
      },
    });

    const year = now.getFullYear();
    const seq = await this.prisma.invoiceSequence.upsert({
      where: { year },
      create: { year, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    const invoiceNumber = (30000 + seq.lastNumber).toString();

    const priceToman = service.priceToman || 0;
    const isFree = priceToman === 0;
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const isQuantityOnly = service.trackingType === "QUANTITY";
    const itemTitle = isQuantityOnly
      ? `تمدید بسته ${service.name} (ظرفیت: ${(service.quantity || 1).toLocaleString("fa-IR")})`
      : `تمدید سرویس ${service.name} (${cycleDays.toLocaleString("fa-IR")} روزه)`;

    const newInvoice = await this.prisma.invoice.create({
      data: {
        customerId: service.customerId,
        invoiceNumber,
        status: isFree ? "PAID" : "UNPAID",
        subtotalToman: priceToman,
        totalToman: priceToman,
        paidAt: isFree ? now : null,
        dueDate,
        notes: isFree
          ? `فاکتور تمدید دوره سرویس رایگان ${service.name} (تایید خودکار سیستمی)`
          : `فاکتور تمدید دوره سرویس ${service.name}`,
        items: {
          create: [
            {
              serviceId: service.id,
              title: itemTitle,
              description: isQuantityOnly
                ? `تمدید و شارژ مجدد سهمیه ${service.quantity || 1} عددی ${service.name}`
                : `تمدید دوره ${cycleDays} روزه سرویس ${service.name}`,
              quantity: 1,
              unitPriceToman: priceToman,
              totalToman: priceToman,
              serviceNameSnapshot: service.name,
              serviceTypeSnapshot:
                (service as any).serviceType?.name ||
                (service as any).serviceType?.slug ||
                null,
              servicePriceSnapshotToman: priceToman,
              serviceRenewalDateSnapshot: newRenewalDate,
            },
          ],
        },
      },
      include: { items: true },
    });

    let paymentRecord: any = null;
    if (isFree) {
      paymentRecord = await this.prisma.payment.create({
        data: {
          invoiceId: newInvoice.id,
          amountToman: 0,
          provider: "FREE_PLAN",
          gatewayRef: `FREE_${newInvoice.id}_${Date.now()}`,
          paidAt: now,
        },
      });
    }

    const actorName = user?.name || "کاربر";
    await this.prisma.auditLog
      .create({
        data: {
          actorType: "USER",
          actorRole: user?.role || "CUSTOMER",
          actorDisplayNameSnapshot: actorName,
          userId: user?.id,
          action: "service.renewed_and_invoice_created",
          entityType: "Service",
          entityId: service.id,
          reason: `تمدید سرویس ${service.name}، به‌روزرسانی سررسید به ${newRenewalDate.toISOString().slice(0, 10)} و صدور صورت‌حساب ${newInvoice.invoiceNumber} (${isFree ? "رایگان و تایید شده" : "در انتظار پرداخت"}) توسط ${actorName}`,
          metadata: {
            customerId: service.customerId || null,
            isSupplier: !service.customerId,
            isFree,
            paymentId: paymentRecord?.id || null,
          },
          after: {
            serviceId: service.id,
            status: "ACTIVE",
            newRenewalDate: newRenewalDate.toISOString(),
            invoiceId: newInvoice.id,
            invoiceNumber: newInvoice.invoiceNumber,
            totalToman: priceToman,
            isFree,
          },
        },
      })
      .catch(() => {});

    return {
      success: true,
      created: true,
      message: isFree
        ? "سرویس با موفقیت تمدید شد و فاکتور و پرداخت رایگان آن تایید گردید"
        : "سرویس با موفقیت تمدید شد و صورت‌حساب جدید آن صادر گردید",
      service: updatedService,
      invoice: newInvoice,
      payment: paymentRecord,
    };
  }

  @Delete(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Delete a service by ID" })
  async delete(@Param("id") id: string) {
    const s = await this.prisma.service.findUnique({
      where: { id },
      include: { customer: true, server: true },
    });

    // 1. Delete related endpoints first
    await this.prisma.endpoint.deleteMany({ where: { serviceId: id } }).catch(() => {});

    // 2. If this service is a master/parent catalog service, unlink all child services first
    await this.prisma.service.updateMany({
      where: { parentServiceId: id },
      data: { parentServiceId: null },
    }).catch(() => {});

    // 3. Clean up unpaid phantom invoices generated for this service
    try {
      const unpaidInvoices = await this.prisma.invoice.findMany({
        where: {
          status: "UNPAID",
          items: { some: { serviceId: id } },
        },
        include: { items: true, payment: true },
      });

      for (const inv of unpaidInvoices) {
        if (!inv.payment) {
          const otherItems = inv.items.filter((item) => item.serviceId !== id);
          if (otherItems.length === 0) {
            // Entire invoice was exclusively for this service: delete it
            await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: inv.id } }).catch(() => {});
            await this.prisma.invoice.delete({ where: { id: inv.id } }).catch(() => {});
          } else {
            // Re-calculate invoice totals without this service item
            await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: inv.id, serviceId: id } }).catch(() => {});
            const newTotal = otherItems.reduce((acc, it) => acc + (it.totalToman || 0), 0);
            await this.prisma.invoice.update({
              where: { id: inv.id },
              data: { subtotalToman: newTotal, totalToman: newTotal },
            }).catch(() => {});
          }
        }
      }
    } catch {}

    // 4. Unlink service from any remaining historical (e.g. paid) invoice items
    await this.prisma.invoiceItem.updateMany({
      where: { serviceId: id },
      data: { serviceId: null },
    }).catch(() => {});

    // 5. Delete service record
    const deleted = await this.prisma.service.delete({ where: { id } });

    if (s) {
      const isCustomerService = Boolean(s.customerId);
      const targetLabel = isCustomerService
        ? `مشتری: ${s.customer?.displayName || s.customer?.name || s.customerId}`
        : `تامین‌کننده / زیرساخت تامین${s.server ? ` (سرور ${s.server.name})` : ""}`;
      await this.prisma.auditLog
        .create({
          data: {
            actorType: "USER",
            actorRole: "ADMIN",
            actorDisplayNameSnapshot: "مدیر فنی سیستم",
            action: "service.delete",
            entityType: "Service",
            entityId: s.id,
            reason: `حذف سرویس «${s.name}» (${targetLabel})`,
            metadata: {
              customerId: s.customerId || null,
              isSupplier: !isCustomerService,
            },
            before: {
              name: s.name,
              priceToman: s.priceToman,
              status: s.status,
              customerId: s.customerId,
              customerName: s.customer?.displayName || s.customer?.name || null,
              serverName: s.server?.name || null,
            },
          },
        })
        .catch(() => {});
    }

    return deleted;
  }
}
