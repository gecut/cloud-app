import {
  Body,
  Controller,
  Delete,
  Get,
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

@ApiTags("suppliers")
@Controller("suppliers")
@UseGuards(RolesGuard)
export class SuppliersController {
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
      status?: string;
      notes?: string;
    },
  ) {
    const id = `supsvc_${Date.now()}`;
    const amount = Number(body.priceToman ?? body.monthlyExpenseToman) || 0;
    const now = new Date();
    const newService = {
      id,
      supplierId: body.supplierId,
      name: body.name,
      type: body.type || "HOSTING",
      priceToman: amount,
      monthlyExpenseToman: amount,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : now,
      renewalDate: body.renewalDate ? new Date(body.renewalDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      billingCycleDays: Number(body.billingCycleDays) || 30,
      notes: body.notes || null,
      status: body.status || "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    this.prisma.memSupplierServices.set(id, newService);

    // Update supplier payable
    const sup = this.prisma.memSuppliers.get(body.supplierId);
    if (sup) {
      sup.totalPayableToman = (sup.totalPayableToman || 0) + amount;
    }

    this.prisma.saveToDisk();
    return newService;
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
      if (body.priceToman !== undefined || body.monthlyExpenseToman !== undefined) {
        const amt = Number(body.priceToman ?? body.monthlyExpenseToman) || 0;
        body.priceToman = amt;
        body.monthlyExpenseToman = amt;
      }
      if (body.purchaseDate) body.purchaseDate = new Date(body.purchaseDate);
      if (body.renewalDate) body.renewalDate = new Date(body.renewalDate);
      Object.assign(s, body, { updatedAt: new Date() });
      this.prisma.saveToDisk();
      return s;
    }
    return null;
  }

  @Delete("services/:serviceId")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Delete supplier service" })
  async deleteSupplierService(@Param("serviceId") serviceId: string) {
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
