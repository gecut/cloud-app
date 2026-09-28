import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma, ServiceStatus } from "@gecut-cloud/db";
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

    const updateData: Prisma.ServiceUncheckedUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status as ServiceStatus;
    if (dto.priceToman !== undefined) updateData.priceToman = dto.priceToman;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    if (dto.renewalDate !== undefined) updateData.renewalDate = dto.renewalDate ? new Date(dto.renewalDate) : undefined;
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
      updateData.customerId = finalCustomerId || null;
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
    if (dto.billingCycle !== undefined) updateData.billingCycle = dto.billingCycle || null;
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
      new Date(effectiveRenewalDate as Date).getTime() < new Date(effectivePurchaseDate as Date).getTime()
    ) {
      throw new BadRequestException("تاریخ سررسید نمی‌تواند قبل از تاریخ خرید باشد");
    }

    const updated = await this.prisma.service.update({
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

    // If autoRenew is active, immediately check if service has expired/depleted and should be auto-renewed
    if (updated.autoRenew) {
      await this.renewalsScheduler.processSingleServiceById(updated.id).catch(() => {});
      const refreshed = await this.prisma.service.findUnique({
        where: { id },
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
      if (refreshed) {
        return refreshed;
      }
    }

    return updated;
  }
}
