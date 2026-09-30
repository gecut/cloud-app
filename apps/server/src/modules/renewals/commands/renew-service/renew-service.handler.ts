import { NotFoundException } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { RenewServiceCommand } from "./renew-service.command";

@CommandHandler(RenewServiceCommand)
export class RenewServiceHandler
  implements ICommandHandler<RenewServiceCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RenewServiceCommand) {
    const { dto } = command;

    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service ${dto.serviceId} not found`);
    }

    const newRenewalDate = new Date(dto.newRenewalDate);
    const isExpired = newRenewalDate.getTime() <= Date.now();
    return this.prisma.service.update({
      where: { id: dto.serviceId },
      data: {
        renewalDate: newRenewalDate,
        status: isExpired ? "INACTIVE" : "ACTIVE",
      },
    });
  }
}
