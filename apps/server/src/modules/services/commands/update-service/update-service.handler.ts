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
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.renewalDate !== undefined) updateData.renewalDate = new Date(dto.renewalDate);
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
    if (dto.serviceTypeId !== undefined) updateData.serviceTypeId = dto.serviceTypeId;
    if (dto.billingCycle !== undefined) updateData.billingCycle = dto.billingCycle;
    if (dto.autoRenew !== undefined) updateData.autoRenew = dto.autoRenew;
    if (dto.quantity !== undefined) updateData.quantity = dto.quantity;
    if (dto.serverVisibilityLevel !== undefined) updateData.serverVisibilityLevel = dto.serverVisibilityLevel;

    return this.prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        serviceType: true,
        serviceGroup: true,
        server: true,
        endpoints: true,
      },
    });
  }
}
