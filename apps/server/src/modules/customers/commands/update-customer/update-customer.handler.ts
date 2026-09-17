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

    let validBirthDate: Date | null | undefined = undefined;
    if (dto.birthDate !== undefined) {
      if (!dto.birthDate) {
        validBirthDate = null;
      } else {
        const d = new Date(dto.birthDate);
        validBirthDate = !isNaN(d.getTime()) ? d : null;
      }
    }

    let validCoopDate: Date | null | undefined = undefined;
    if (dto.cooperationStartDate !== undefined) {
      if (!dto.cooperationStartDate) {
        validCoopDate = null;
      } else {
        const d = new Date(dto.cooperationStartDate);
        validCoopDate = !isNaN(d.getTime()) ? d : null;
      }
    }

    // Sync associated user if present
    if (existing.userId) {
      const userUpdate: any = {};
      if (cleanPhone !== undefined) userUpdate.phone = cleanPhone;
      if (dto.name) userUpdate.name = dto.name;
      if (dto.email !== undefined) userUpdate.email = dto.email;
      if (validBirthDate !== undefined) userUpdate.birthDate = validBirthDate;
      if (validCoopDate !== undefined) userUpdate.cooperationStartDate = validCoopDate;
      if (dto.telegramChatId !== undefined) userUpdate.telegramChatId = dto.telegramChatId || null;
      if (dto.address !== undefined) userUpdate.address = dto.address || null;

      if (Object.keys(userUpdate).length > 0) {
        await this.prisma.user
          .update({
            where: { id: existing.userId },
            data: userUpdate,
          })
          .catch(() => {});
      }
    }

    const customerUpdate: any = {};
    if (dto.name) customerUpdate.name = dto.name;
    if (dto.displayName !== undefined || dto.company !== undefined) {
      customerUpdate.displayName = dto.displayName ?? dto.company;
    }
    if (cleanPhone !== undefined) customerUpdate.phone = cleanPhone;
    if (dto.email !== undefined) customerUpdate.email = dto.email;
    if (dto.status) customerUpdate.status = dto.status;
    if (validBirthDate !== undefined) customerUpdate.birthDate = validBirthDate;
    if (validCoopDate !== undefined) customerUpdate.cooperationStartDate = validCoopDate;
    if (dto.telegramChatId !== undefined) customerUpdate.telegramChatId = dto.telegramChatId || null;
    if (dto.description !== undefined) customerUpdate.description = dto.description || null;
    if (dto.address !== undefined) customerUpdate.address = dto.address || null;

    return this.prisma.customer.update({
      where: { id },
      data: customerUpdate,
    });
  }
}
