import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { RenewalsSchedulerService } from "../../../renewals/renewals-scheduler.service";
import { UpdateServiceCommand } from "./update-service.command";

@CommandHandler(UpdateServiceCommand)
export class UpdateServiceHandler
  implements ICommandHandler<UpdateServiceCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly renewalsScheduler: RenewalsSchedulerService,
  ) {}

  async execute(command: UpdateServiceCommand) {
    const { id, dto } = command;

    const existing = await this.prisma.service.findUnique({
      where: { id },
      include: {
        customer: true,
        server: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priceToman !== undefined) updateData.priceToman = dto.priceToman;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.renewalDate !== undefined) updateData.renewalDate = dto.renewalDate ? new Date(dto.renewalDate) : null;
    if (dto.purchaseDate !== undefined) updateData.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : null;
    if (dto.trackingType !== undefined) updateData.trackingType = dto.trackingType;
    if (dto.serverId !== undefined) updateData.serverId = dto.serverId || null;
    if (dto.customerId !== undefined) {
      let finalCustomerId = dto.customerId;
      const matchedCustomer = await this.prisma.customer.findFirst({
        where: {
          OR: [{ id: dto.customerId }, { userId: dto.customerId }],
        },
      });
      if (matchedCustomer) {
        finalCustomerId = matchedCustomer.id;
      }
      updateData.customerId = finalCustomerId;
    }
    if (dto.serviceTypeId !== undefined) {
      const matched = await this.prisma.serviceType.findFirst({
        where: {
          OR: [{ id: dto.serviceTypeId }, { slug: dto.serviceTypeId }],
        },
      });
      updateData.serviceTypeId = matched ? matched.id : dto.serviceTypeId;
    } else if (dto.serviceTypeSlug !== undefined) {
      let matched = await this.prisma.serviceType.findFirst({
        where: {
          OR: [
            { slug: dto.serviceTypeSlug },
            { id: dto.serviceTypeSlug },
            { name: dto.serviceTypeSlug },
          ],
        },
      });
      if (matched) {
        updateData.serviceTypeId = matched.id;
      }
    }
    if (dto.parentServiceId !== undefined) updateData.parentServiceId = dto.parentServiceId || null;
    if (dto.billingCycle !== undefined) updateData.billingCycle = dto.billingCycle;
    if (dto.autoRenew !== undefined) updateData.autoRenew = dto.autoRenew;
    if (dto.quantity !== undefined) updateData.quantity = Math.max(1, Number(dto.quantity) || 1);
    if (dto.usedQuantity !== undefined) updateData.usedQuantity = Math.max(0, Number(dto.usedQuantity) || 0);
    if (dto.serverVisibilityLevel !== undefined) updateData.serverVisibilityLevel = dto.serverVisibilityLevel;

    const effectiveTrackingType = updateData.trackingType !== undefined ? updateData.trackingType : existing.trackingType;
    const effectivePurchaseDate = updateData.purchaseDate !== undefined ? updateData.purchaseDate : (existing.purchaseDate || existing.startDate);
    const effectiveRenewalDate = updateData.renewalDate !== undefined ? updateData.renewalDate : existing.renewalDate;

    if (
      effectiveTrackingType !== "QUANTITY" &&
      effectiveRenewalDate &&
      effectivePurchaseDate &&
      new Date(effectiveRenewalDate).getTime() < new Date(effectivePurchaseDate).getTime()
    ) {
      throw new BadRequestException("تاریخ سررسید نمی‌تواند قبل از تاریخ خرید باشد");
    }

    let updated: any;
    try {
      updated = await this.prisma.service.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          serviceType: true,
          serviceGroup: true,
          server: true,
          endpoints: true,
          parentService: true,
          childServices: {
            include: { customer: true },
          },
        },
      });
    } catch (err: any) {
      if (err?.message?.includes("billingCycle") || String(err).includes("billingCycle")) {
        const cycle = updateData.billingCycle;
        delete updateData.billingCycle;
        updated = await this.prisma.service.update({
          where: { id },
          data: updateData,
          include: {
            customer: true,
            serviceType: true,
            serviceGroup: true,
            server: true,
            endpoints: true,
            parentService: true,
            childServices: {
              include: { customer: true },
            },
          },
        });
        if (cycle !== undefined) {
          try {
            await (this.prisma as any).$executeRawUnsafe(
              `UPDATE "Service" SET "billingCycle" = $1 WHERE "id" = $2`,
              cycle,
              id,
            );
          } catch {}
          updated.billingCycle = cycle;
        }
      } else {
        throw err;
      }
    }

    // Synchronize all invoices and payments for this service when service details are edited
    try {
      const matchedInvoices: any[] = [];
      for (const inv of this.prisma.memInvoices.values()) {
        const hasItem =
          (inv.items && inv.items.some((it: any) => it.serviceId === updated.id)) ||
          Array.from(this.prisma.memInvoiceItems.values()).some(
            (it) => it.invoiceId === inv.id && it.serviceId === updated.id,
          );
        if (hasItem) {
          matchedInvoices.push(inv);
        }
      }

      for (const inv of matchedInvoices) {
        let newSubtotal = 0;
        const allItems =
          inv.items && inv.items.length > 0
            ? inv.items
            : Array.from(this.prisma.memInvoiceItems.values()).filter(
                (it) => it.invoiceId === inv.id,
              );

        for (const it of allItems) {
          if (it.serviceId === updated.id) {
            const qty = it.quantity || 1;
            const unitPrice = updated.priceToman !== undefined ? updated.priceToman : (it.unitPriceToman || 0);
            const lineTotal = unitPrice * qty;
            const isQtyMode = updated.trackingType === "QUANTITY";
            const title = isQtyMode
              ? `${updated.name} (تعداد: ${qty.toLocaleString("fa-IR")})`
              : `صورت‌حساب سرویس ${updated.name}`;

            it.title = title;
            it.unitPriceToman = unitPrice;
            it.totalToman = lineTotal;
            it.serviceNameSnapshot = updated.name;
            it.servicePriceSnapshotToman = unitPrice;
            if (updated.renewalDate) {
              it.serviceRenewalDateSnapshot = updated.renewalDate;
            }

            if (this.prisma.memInvoiceItems.has(it.id)) {
              const memIt = this.prisma.memInvoiceItems.get(it.id);
              Object.assign(memIt, {
                title,
                unitPriceToman: unitPrice,
                totalToman: lineTotal,
                serviceNameSnapshot: updated.name,
                servicePriceSnapshotToman: unitPrice,
                serviceRenewalDateSnapshot: updated.renewalDate || memIt.serviceRenewalDateSnapshot,
                updatedAt: new Date(),
              });
            }
            newSubtotal += lineTotal;
          } else {
            newSubtotal += Number(it.totalToman) || 0;
          }
        }

        inv.subtotalToman = newSubtotal;
        inv.totalToman = newSubtotal;
        if (updated.renewalDate) {
          inv.dueDate = updated.renewalDate;
        }

        const isNowFree = newSubtotal === 0;
        const existingPayment = Array.from(this.prisma.memPayments.values()).find(
          (p) => p.invoiceId === inv.id,
        );

        if (isNowFree) {
          inv.status = "PAID";
          inv.paidAt = inv.paidAt || new Date();
          inv.notes = `صورت‌حساب سرویس رایگان ${updated.name} (تایید خودکار پس از ویرایش)`;

          if (existingPayment) {
            existingPayment.amountToman = 0;
            existingPayment.provider = "FREE_PLAN";
            existingPayment.gatewayRef = existingPayment.gatewayRef || `FREE_${inv.id}_${Date.now()}`;
            existingPayment.paidAt = existingPayment.paidAt || new Date();
            existingPayment.updatedAt = new Date();
          } else {
            const payId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            this.prisma.memPayments.set(payId, {
              id: payId,
              invoiceId: inv.id,
              amountToman: 0,
              provider: "FREE_PLAN",
              gatewayRef: `FREE_${inv.id}_${Date.now()}`,
              paidAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        } else {
          if (existingPayment) {
            if (existingPayment.provider === "FREE_PLAN") {
              this.prisma.memPayments.delete(existingPayment.id);
              inv.status = "UNPAID";
              inv.paidAt = null;
            } else {
              existingPayment.amountToman = newSubtotal;
              existingPayment.updatedAt = new Date();
            }
          }
        }
      }
      this.prisma.saveToDisk();
    } catch (err: any) {
      console.error("Error synchronizing invoices for service:", err);
    }

    const isCustomerService = Boolean(updated.customerId);
    const targetLabel = isCustomerService
      ? `مشتری: ${updated.customer?.displayName || updated.customer?.name || updated.customerId}`
      : `تامین‌کننده / زیرساخت تامین${updated.server ? ` (سرور ${updated.server.name} - ${updated.server.provider})` : ""}`;

    await this.prisma.auditLog
      .create({
        data: {
          actorType: "USER",
          actorRole: "ADMIN",
          actorDisplayNameSnapshot: "مدیر فنی سیستم",
          action: "service.update",
          entityType: "Service",
          entityId: updated.id,
          reason: `ویرایش مشخصات سرویس «${updated.name}» (${targetLabel})`,
          metadata: {
            customerId: updated.customerId || null,
            isSupplier: !isCustomerService,
          },
          before: {
            name: existing.name,
            priceToman: existing.priceToman,
            status: existing.status,
            renewalDate: existing.renewalDate,
            customerId: existing.customerId,
            customerName: (existing as any).customer?.displayName || (existing as any).customer?.name || null,
            serverName: (existing as any).server?.name || null,
            quantity: existing.quantity,
          },
          after: {
            name: updated.name,
            priceToman: updated.priceToman,
            status: updated.status,
            renewalDate: updated.renewalDate,
            customerId: updated.customerId,
            customerName: updated.customer?.displayName || updated.customer?.name || null,
            serverName: updated.server?.name || null,
            quantity: updated.quantity,
            isSupplier: !isCustomerService,
          },
        },
      })
      .catch(() => {});

    // Check if quota depletion or date passed triggers auto-renew or deactivation immediately
    if (
      dto.usedQuantity !== undefined ||
      dto.quantity !== undefined ||
      dto.renewalDate !== undefined ||
      dto.autoRenew !== undefined
    ) {
      try {
        const processed = await this.renewalsScheduler.processSingleServiceById(updated.id);
        if (processed) {
          const reloaded = await this.prisma.service.findUnique({
            where: { id: updated.id },
            include: {
              customer: true,
              serviceType: true,
              serviceGroup: true,
              server: true,
              endpoints: true,
              parentService: true,
              childServices: {
                include: { customer: true },
              },
            },
          });
          if (reloaded) return reloaded;
        }
      } catch {
        // do not fail update
      }
    }

    return updated;
  }
}
