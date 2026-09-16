import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { UpdateServiceCommand } from "./update-service.command";

@CommandHandler(UpdateServiceCommand)
export class UpdateServiceHandler
  implements ICommandHandler<UpdateServiceCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateServiceCommand) {
    const { id, dto } = command;

    const existing = await this.prisma.service.findUnique({
      where: { id },
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
      updateData.serviceTypeId = dto.serviceTypeId;
    } else if (dto.serviceTypeSlug !== undefined) {
      let matched = await this.prisma.serviceType.findFirst({
        where: { slug: dto.serviceTypeSlug },
      });
      if (!matched) {
        matched = await this.prisma.serviceType.findFirst({
          where: { name: dto.serviceTypeSlug },
        });
      }
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

    // Synchronize price, name, or quantity changes with open UNPAID customer invoices
    if (
      dto.priceToman !== undefined ||
      dto.name !== undefined ||
      dto.quantity !== undefined
    ) {
      try {
        const targetCustomerId = updated.customerId;
        const newPrice = Number(updated.priceToman || 0);
        const newName = updated.name;
        const newQty = updated.quantity || 1;

        // Find all invoice items referencing this service
        const items = await this.prisma.invoiceItem.findMany({
          where: { serviceId: id },
        });

        for (const it of items) {
          const inv = await this.prisma.invoice.findUnique({
            where: { id: it.invoiceId },
            include: { items: true },
          });

          // Only sync open UNPAID invoices (historical PAID/CANCELLED invoices remain locked per financial rules)
          if (inv && inv.status === "UNPAID") {
            const updatedItems = (inv.items || []).map((currItem: any) => {
              if (currItem.serviceId === id || currItem.id === it.id) {
                const itemQty = dto.quantity !== undefined ? newQty : (currItem.quantity || 1);
                const itemTitle =
                  itemQty > 1
                    ? `${newName} (تعداد: ${itemQty.toLocaleString("fa-IR")})`
                    : `صورت‌حساب سرویس ${newName}`;
                return {
                  ...currItem,
                  title: itemTitle,
                  unitPriceToman: newPrice,
                  totalToman: newPrice,
                  quantity: itemQty,
                  serviceNameSnapshot: newName,
                  servicePriceSnapshotToman: newPrice,
                };
              }
              return currItem;
            });

            const newTotalToman = updatedItems.reduce(
              (sum: number, x: any) => sum + (Number(x.totalToman) || 0),
              0,
            );

            await this.prisma.invoice.update({
              where: { id: inv.id },
              data: {
                subtotalToman: newTotalToman,
                totalToman: newTotalToman,
                notes: `صورت‌حساب سرویس ${newName}`,
                items: updatedItems,
              } as any,
            });

            await this.prisma.auditLog
              .create({
                data: {
                  actorType: "USER",
                  actorRole: "ADMIN",
                  actorDisplayNameSnapshot: "مدیر مالی سیستم",
                  action: "invoice.update",
                  entityType: "Invoice",
                  entityId: inv.id,
                  reason: `به‌روزرسانی خودکار مبلغ فاکتور ${inv.invoiceNumber} به ${newTotalToman.toLocaleString("fa-IR")} تومان بر اثر تغییر تعرفه سرویس ${newName}`,
                  before: { totalToman: inv.totalToman },
                  after: { totalToman: newTotalToman, servicePriceToman: newPrice },
                },
              })
              .catch(() => {});
          }
        }

        // If service was allocated to a customer, has price > 0, but has NO invoice yet, create one
        if (targetCustomerId && newPrice > 0 && items.length === 0) {
          const year = new Date().getFullYear();
          let invoiceNumber = (30001 + Math.floor(Math.random() * 89999)).toString();
          try {
            const seq = await this.prisma.invoiceSequence.upsert({
              where: { year },
              create: { year, lastNumber: 1 },
              update: { lastNumber: { increment: 1 } },
            });
            invoiceNumber = (30000 + seq.lastNumber).toString();
          } catch {}

          const itemTitle =
            newQty > 1
              ? `${newName} (تعداد: ${newQty.toLocaleString("fa-IR")})`
              : `صورت‌حساب سرویس ${newName}`;

          await this.prisma.invoice.create({
            data: {
              customerId: targetCustomerId,
              invoiceNumber,
              status: "UNPAID",
              subtotalToman: newPrice,
              totalToman: newPrice,
              dueDate: updated.renewalDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              notes: `صورت‌حساب سرویس ${newName}`,
              items: {
                create: [
                  {
                    serviceId: updated.id,
                    title: itemTitle,
                    description: updated.description || `سرویس فعال ${newName}`,
                    quantity: newQty,
                    unitPriceToman: newPrice,
                    totalToman: newPrice,
                    serviceNameSnapshot: newName,
                    servicePriceSnapshotToman: newPrice,
                  },
                ],
              },
            },
          });
        }
      } catch (err) {
        // ignore sync error
      }
    }

    return updated;
  }
}
