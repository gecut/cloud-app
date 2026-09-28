import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { CreateServerCommand } from "./commands/create-server/create-server.command";
import { CreateServerDto } from "./commands/create-server/create-server.dto";
import { ListServersQuery } from "./queries/list-servers/list-servers.query";
import { getNextUniqueInvoiceNumber } from "../invoices/utils/invoice-number.util";

@ApiTags("suppliers")
@Controller("suppliers")
@UseGuards(RolesGuard)
export class SuppliersController {
  private readonly logger = new Logger(SuppliersController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
  ) {}

  @Post("servers")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Create a new infrastructure server / supplier" })
  async createServer(@Body() dto: CreateServerDto) {
    return this.commandBus.execute(new CreateServerCommand(dto));
  }

  @Get("servers")
  @Roles("ADMIN")
  @ApiOperation({ summary: "List infrastructure servers" })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async listServers(
    @Query("status") status?: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.queryBus.execute(
      new ListServersQuery(Number(page), Number(limit), status),
    );
  }

  @Get()
  @Roles("ADMIN")
  @ApiOperation({ summary: "List all suppliers and their services" })
  async listSuppliers() {
    const suppliers = Array.from(this.prisma.memSuppliers.values()).map((sup) => {
      const services = Array.from(this.prisma.memSupplierServices.values()).filter(
        (s) => s.supplierId === sup.id,
      );
      const totalExpense = services.reduce(
        (sum, s) => sum + (Number(s.monthlyExpenseToman) || 0),
        0,
      );
      return {
        ...sup,
        services,
        servicesCount: services.length,
        totalPayableToman: totalExpense || sup.totalPayableToman || 0,
      };
    });
    return { items: suppliers, total: suppliers.length };
  }

  @Post()
  @Roles("ADMIN")
  @ApiOperation({ summary: "Create a new supplier" })
  async createSupplier(
    @Body()
    body: {
      name: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      notes?: string;
    },
  ) {
    const id = `sup_${Date.now()}`;
    const newSup = {
      id,
      name: body.name,
      contactPerson: body.contactPerson || null,
      phone: body.phone || null,
      email: body.email || null,
      notes: body.notes || null,
      status: "ACTIVE",
      totalPayableToman: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.prisma.memSuppliers.set(id, newSup);
    this.prisma.saveToDisk();
    return newSup;
  }

  @Get("services")
  @Roles("ADMIN")
  @ApiOperation({ summary: "List purchased services from suppliers" })
  async listSupplierServices(@Query("supplierId") supplierId?: string) {
    let items = Array.from(this.prisma.memSupplierServices.values());
    if (supplierId) {
      items = items.filter((s) => s.supplierId === supplierId);
    }
    return {
      items: items.map((s) => ({
        ...s,
        supplier: this.prisma.memSuppliers.get(s.supplierId) || null,
      })),
      total: items.length,
    };
  }

  @Post("services")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Register a service purchased from supplier" })
  async createSupplierService(
    @Body()
    body: {
      supplierId: string;
      name: string;
      type: string;
      priceToman?: number;
      monthlyExpenseToman?: number;
      purchaseDate?: string;
      renewalDate?: string;
      billingCycleDays?: number;
      durationDays?: number;
      trackingType?: string;
      quantity?: number;
      usedQuantity?: number;
      autoRenew?: boolean;
      status?: string;
      notes?: string;
    },
  ) {
    const id = `supsvc_${Date.now()}`;
    const amount = Number(body.priceToman ?? body.monthlyExpenseToman) || 0;
    const now = new Date();
    const cycleDays = Number(body.durationDays || body.billingCycleDays) || 30;
    const trackingType = (body.trackingType || "HYBRID").toUpperCase();
    const newService = {
      id,
      supplierId: body.supplierId,
      name: body.name,
      type: body.type || "HOSTING",
      priceToman: amount,
      monthlyExpenseToman: amount,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : now,
      renewalDate: body.renewalDate ? new Date(body.renewalDate) : new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000),
      billingCycleDays: cycleDays,
      billingCycle: String(cycleDays),
      trackingType,
      quantity: (trackingType === "QUANTITY" || trackingType === "HYBRID") ? Math.max(1, Number(body.quantity) || 1) : 1,
      usedQuantity: Math.max(0, Number(body.usedQuantity) || 0),
      autoRenew: body.autoRenew !== undefined ? Boolean(body.autoRenew) : true,
      notes: body.notes || null,
      status: body.status || "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    this.prisma.memSupplierServices.set(id, newService);

    const isFree = amount === 0;

    // Update supplier payable
    const sup = this.prisma.memSuppliers.get(body.supplierId);
    if (sup && !isFree) {
      sup.totalPayableToman = (sup.totalPayableToman || 0) + amount;
    }

    // Automatically issue purchase invoice for supplier
    let invoice: any = null;
    try {
      const invoiceNumber = await getNextUniqueInvoiceNumber(this.prisma);

      invoice = await this.prisma.invoice.create({
        data: {
          customerId: null,
          supplierId: body.supplierId,
          counterpartyType: "SUPPLIER",
          invoiceNumber,
          status: isFree ? "PAID" : "UNPAID",
          subtotalToman: amount,
          totalToman: amount,
          paidAt: isFree ? now : null,
          issuedAt: newService.purchaseDate || now,
          dueDate: newService.renewalDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          notes: isFree
            ? `فاکتور خرید رایگان سرویس «${newService.name}» (تایید خودکار سیستمی)`
            : (body.notes || `فاکتور خرید دوره سرویس «${newService.name}» از تامین‌کننده ${sup?.name || ""}`),
          items: {
            create: [
              {
                serviceId: id,
                title: newService.name,
                quantity: 1,
                unitPriceToman: amount,
                totalToman: amount,
                serviceNameSnapshot: newService.name,
                serviceTypeSnapshot: newService.type,
                servicePriceSnapshotToman: amount,
                serviceRenewalDateSnapshot: newService.renewalDate,
              },
            ],
          },
        } as any,
      });

      if (isFree) {
        await this.prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amountToman: 0,
            provider: "FREE_PLAN",
            gatewayRef: `FREE_${invoice.id}_${Date.now()}`,
            paidAt: now,
          },
        });
      }

      this.logger.log(`Issued supplier purchase invoice #${invoiceNumber} for service ${newService.name} (Supplier: ${sup?.name || body.supplierId}, Free: ${isFree})`);
    } catch (invErr) {
      this.logger.error("Failed to automatically generate supplier invoice", invErr);
    }

    this.prisma.saveToDisk();

    await this.prisma.auditLog
      .create({
        data: {
          actorType: "USER",
          actorRole: "ADMIN",
          actorDisplayNameSnapshot: "مدیر مالی و زیرساخت",
          action: "service.create",
          entityType: "Service",
          entityId: newService.id,
          reason: `ثبت و تعریف سرویس تامین‌کننده «${newService.name}» (تامین‌کننده: ${sup?.name || "نامشخص"})`,
          metadata: {
            supplierId: body.supplierId,
            isSupplier: true,
            invoiceId: invoice?.id || null,
            invoiceNumber: invoice?.invoiceNumber || null,
          },
          after: {
            name: newService.name,
            supplierId: body.supplierId,
            supplierName: sup?.name || null,
            monthlyExpenseToman: amount,
            priceToman: amount,
            isSupplier: true,
            status: newService.status,
            renewalDate: newService.renewalDate,
            invoiceId: invoice?.id || null,
            invoiceNumber: invoice?.invoiceNumber || null,
          },
        },
      })
      .catch(() => {});

    return {
      ...newService,
      invoice,
    };
  }

  @Patch(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update supplier details" })
  async updateSupplier(
    @Param("id") id: string,
    @Body() body: any,
  ) {
    const sup = this.prisma.memSuppliers.get(id);
    if (sup) {
      Object.assign(sup, body, { updatedAt: new Date() });
      this.prisma.saveToDisk();
      return sup;
    }
    return null;
  }

  @Delete(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Delete supplier" })
  async deleteSupplier(@Param("id") id: string) {
    this.prisma.memSuppliers.delete(id);
    // Delete attached services too
    for (const [svcId, svc] of Array.from(this.prisma.memSupplierServices.entries())) {
      if (svc.supplierId === id) {
        this.prisma.memSupplierServices.delete(svcId);
      }
    }
    this.prisma.saveToDisk();
    return { success: true };
  }

  @Patch("services/:serviceId")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update supplier purchased service" })
  async updateSupplierService(
    @Param("serviceId") serviceId: string,
    @Body() body: any,
  ) {
    const s = this.prisma.memSupplierServices.get(serviceId);
    if (s) {
      const beforeSnapshot = {
        name: s.name,
        priceToman: s.priceToman,
        monthlyExpenseToman: s.monthlyExpenseToman,
        status: s.status,
        renewalDate: s.renewalDate,
        supplierId: s.supplierId,
      };

      if (body.priceToman !== undefined || body.monthlyExpenseToman !== undefined) {
        const amt = Number(body.priceToman ?? body.monthlyExpenseToman) || 0;
        body.priceToman = amt;
        body.monthlyExpenseToman = amt;
      }
      if (body.purchaseDate) body.purchaseDate = new Date(body.purchaseDate);
      if (body.renewalDate) body.renewalDate = new Date(body.renewalDate);
      if (body.trackingType) body.trackingType = body.trackingType.toUpperCase();
      if (body.quantity !== undefined) body.quantity = Math.max(1, Number(body.quantity) || 1);
      if (body.usedQuantity !== undefined) body.usedQuantity = Math.max(0, Number(body.usedQuantity) || 0);
      if (body.autoRenew !== undefined) body.autoRenew = Boolean(body.autoRenew);
      if (body.durationDays !== undefined || body.billingCycleDays !== undefined) {
        const d = Number(body.durationDays || body.billingCycleDays) || 30;
        body.billingCycleDays = d;
        body.billingCycle = String(d);
      }
      Object.assign(s, body, { updatedAt: new Date() });

      const sup = this.prisma.memSuppliers.get(s.supplierId);
      if (sup) {
        const supServices = Array.from(this.prisma.memSupplierServices.values()).filter(
          (item) => item.supplierId === sup.id && item.status === "ACTIVE",
        );
        sup.totalPayableToman = supServices.reduce(
          (sum, item) => sum + (Number(item.priceToman ?? item.monthlyExpenseToman) || 0),
          0,
        );
      }

      this.prisma.saveToDisk();

      await this.prisma.auditLog
        .create({
          data: {
            actorType: "USER",
            actorRole: "ADMIN",
            actorDisplayNameSnapshot: "مدیر مالی و زیرساخت",
            action: "service.update",
            entityType: "Service",
            entityId: s.id,
            reason: `ویرایش مشخصات سرویس تامین‌کننده «${s.name}» (تامین‌کننده: ${sup?.name || "نامشخص"})`,
            metadata: {
              supplierId: s.supplierId,
              isSupplier: true,
            },
            before: {
              ...beforeSnapshot,
              supplierName: sup?.name || null,
            },
            after: {
              name: s.name,
              priceToman: s.priceToman,
              monthlyExpenseToman: s.monthlyExpenseToman,
              status: s.status,
              renewalDate: s.renewalDate,
              supplierId: s.supplierId,
              supplierName: sup?.name || null,
              isSupplier: true,
            },
          },
        })
        .catch(() => {});

      return s;
    }
    return null;
  }

  @Post("services/:serviceId/renew")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Renew a supplier purchased service and issue new invoice and payment" })
  async renewSupplierService(
    @Param("serviceId") serviceId: string,
    @Body() body?: { cycleDays?: number },
  ) {
    const s = this.prisma.memSupplierServices.get(serviceId);
    if (!s) {
      throw new NotFoundException("سرویس تامین‌کننده یافت نشد");
    }

    const now = new Date();
    const cycleDays = Number(body?.cycleDays) || s.billingCycleDays || 30;
    const prevRenewal = s.renewalDate ? new Date(s.renewalDate) : now;
    let nextRenewal = new Date(prevRenewal.getTime() + cycleDays * 24 * 60 * 60 * 1000);
    if (nextRenewal.getTime() <= now.getTime()) {
      nextRenewal = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000);
    }

    s.purchaseDate = prevRenewal;
    s.renewalDate = nextRenewal;
    s.status = "ACTIVE";
    s.updatedAt = now;

    const amount = Number(s.priceToman ?? s.monthlyExpenseToman) || 0;
    const isFree = amount === 0;
    const invoiceNumber = await getNextUniqueInvoiceNumber(this.prisma);
    const sup = this.prisma.memSuppliers.get(s.supplierId);

    const invoice = await this.prisma.invoice.create({
      data: {
        customerId: null,
        supplierId: s.supplierId,
        counterpartyType: "SUPPLIER",
        invoiceNumber,
        status: isFree ? "PAID" : "UNPAID",
        subtotalToman: amount,
        totalToman: amount,
        paidAt: isFree ? now : null,
        issuedAt: now,
        dueDate: nextRenewal,
        notes: isFree
          ? `فاکتور تمدید رایگان سرویس «${s.name}» (تایید خودکار سیستمی)`
          : `فاکتور تمدید دوره خرید سرویس «${s.name}» از تامین‌کننده ${sup?.name || ""}`,
        items: {
          create: [
            {
              serviceId: s.id,
              title: `تمدید سرویس تامین‌کننده ${s.name}`,
              quantity: 1,
              unitPriceToman: amount,
              totalToman: amount,
              serviceNameSnapshot: s.name,
              serviceTypeSnapshot: s.type,
              servicePriceSnapshotToman: amount,
              serviceRenewalDateSnapshot: nextRenewal,
            },
          ],
        },
      } as any,
    });

    let payment: any = null;
    if (isFree) {
      payment = await this.prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amountToman: 0,
          provider: "FREE_PLAN",
          gatewayRef: `FREE_${invoice.id}_${Date.now()}`,
          paidAt: now,
        },
      });
    } else if (sup) {
      sup.totalPayableToman = (sup.totalPayableToman || 0) + amount;
    }

    this.prisma.saveToDisk();

    await this.prisma.auditLog
      .create({
        data: {
          actorType: "USER",
          actorRole: "ADMIN",
          actorDisplayNameSnapshot: "مدیر مالی و زیرساخت",
          action: "service.renewed_and_invoice_created",
          entityType: "Service",
          entityId: s.id,
          reason: `تمدید سرویس تامین‌کننده «${s.name}» تا تاریخ ${nextRenewal.toISOString().slice(0, 10)} و صدور صورت‌حساب خرید #${invoiceNumber}`,
          metadata: {
            supplierId: s.supplierId,
            isSupplier: true,
            invoiceId: invoice.id,
            invoiceNumber,
            isFree,
            paymentId: payment?.id || null,
          },
          after: {
            name: s.name,
            renewalDate: nextRenewal,
            status: "ACTIVE",
            invoiceId: invoice.id,
            invoiceNumber,
            amountToman: amount,
            isFree,
          },
        },
      })
      .catch(() => {});

    return {
      success: true,
      service: s,
      invoice,
      payment,
    };
  }

  @Delete("services/:serviceId")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Delete supplier service" })
  async deleteSupplierService(@Param("serviceId") serviceId: string) {
    const s = this.prisma.memSupplierServices.get(serviceId);
    if (s) {
      const sup = this.prisma.memSuppliers.get(s.supplierId);
      await this.prisma.auditLog
        .create({
          data: {
            actorType: "USER",
            actorRole: "ADMIN",
            actorDisplayNameSnapshot: "مدیر مالی و زیرساخت",
            action: "service.delete",
            entityType: "Service",
            entityId: s.id,
            reason: `حذف سرویس تامین‌کننده «${s.name}» (تامین‌کننده: ${sup?.name || "نامشخص"})`,
            metadata: {
              supplierId: s.supplierId,
              isSupplier: true,
            },
            before: {
              name: s.name,
              priceToman: s.priceToman,
              supplierId: s.supplierId,
              supplierName: sup?.name || null,
            },
          },
        })
        .catch(() => {});
    }

    this.prisma.memSupplierServices.delete(serviceId);
    this.prisma.saveToDisk();
    return { success: true };
  }

  @Get("accounting-summary")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Get financial and procurement accounting overview" })
  async getAccountingSummary() {
    // 1. Sales (فروش): Invoices & Payments
    const invoices = Array.from(this.prisma.memInvoices.values());
    const paidInvoices = invoices.filter((i) => i.status === "PAID");
    const collectedRevenueToman = paidInvoices.reduce(
      (sum, i) => sum + (Number(i.totalToman) || 0),
      0,
    );

    const unpaidInvoices = invoices.filter((i) => i.status === "UNPAID");
    const totalReceivableToman = unpaidInvoices.reduce(
      (sum, i) => sum + (Number(i.totalToman) || 0),
      0,
    );

    // 2. Procurement (تامین): Supplier Expenses & Liabilities
    const supplierServices = Array.from(this.prisma.memSupplierServices.values());
    const totalPayableToman = supplierServices.reduce(
      (sum, s) => sum + (Number(s.monthlyExpenseToman) || 0),
      0,
    );

    const suppliers = Array.from(this.prisma.memSuppliers.values());

    return {
      sales: {
        collectedRevenueToman,
        totalReceivableToman,
        invoicesCount: invoices.length,
        paidCount: paidInvoices.length,
        unpaidCount: unpaidInvoices.length,
      },
      procurement: {
        totalPayableToman,
        suppliersCount: suppliers.length,
        servicesCount: supplierServices.length,
      },
      netBalanceToman: collectedRevenueToman - totalPayableToman,
    };
  }
}
