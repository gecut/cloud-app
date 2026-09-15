import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { normalizePhoneNumber } from "../../../../common/utils/phone.util";
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

    const cleanPhone = dto.phone !== undefined ? (dto.phone ? normalizePhoneNumber(dto.phone) : null) : undefined;

    // Sync associated user if present
    if (existing.userId) {
      const userUpdate: any = {};
      if (cleanPhone !== undefined) userUpdate.phone = cleanPhone;
      if (dto.name) userUpdate.name = dto.name;
      if (dto.email !== undefined) userUpdate.email = dto.email;

      if (Object.keys(userUpdate).length > 0) {
        await this.prisma.user
          .update({
            where: { id: existing.userId },
            data: userUpdate,
          })
          .catch(() => {});
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...((dto.displayName !== undefined || dto.company !== undefined) && { displayName: dto.displayName ?? dto.company }),
        ...(cleanPhone !== undefined && { phone: cleanPhone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }
}
