import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { UpdateCustomerCommand } from "./update-customer.command";

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler
  implements ICommandHandler<UpdateCustomerCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateCustomerCommand): Promise<any> {
    const { id, dto } = command;

    const existing = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }
}
