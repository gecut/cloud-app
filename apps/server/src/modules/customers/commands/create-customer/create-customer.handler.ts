import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { normalizePhoneNumber } from "../../../../common/utils/phone.util";
import { CreateCustomerCommand } from "./create-customer.command";

@CommandHandler(CreateCustomerCommand)
export class CreateCustomerHandler
  implements ICommandHandler<CreateCustomerCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateCustomerCommand) {
    const { dto } = command;
    const cleanPhone = dto.phone ? normalizePhoneNumber(dto.phone) : `090000000${Math.floor(10 + Math.random() * 90)}`;

    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findFirst({
        where: {
          OR: [{ phone: cleanPhone }, { phone: dto.phone || cleanPhone }],
        },
      });

      const parsedBirthDate = dto.birthDate ? new Date(dto.birthDate) : null;
      const validBirthDate = parsedBirthDate && !isNaN(parsedBirthDate.getTime()) ? parsedBirthDate : null;

      const parsedCoopDate = dto.cooperationStartDate ? new Date(dto.cooperationStartDate) : null;
      const validCoopDate = parsedCoopDate && !isNaN(parsedCoopDate.getTime()) ? parsedCoopDate : null;

      if (!user) {
        user = await tx.user.create({
          data: {
            name: dto.name,
            phone: cleanPhone,
            email: dto.email || null,
            role: "CUSTOMER",
            birthDate: validBirthDate,
            cooperationStartDate: validCoopDate,
            telegramChatId: dto.telegramChatId || null,
            address: dto.address || null,
          },
        });
      } else {
        const userUpdateData: any = {};
        if (user.phone !== cleanPhone) userUpdateData.phone = cleanPhone;
        if (validBirthDate && !user.birthDate) userUpdateData.birthDate = validBirthDate;
        if (validCoopDate && !user.cooperationStartDate) userUpdateData.cooperationStartDate = validCoopDate;
        if (dto.telegramChatId) userUpdateData.telegramChatId = dto.telegramChatId;
        if (dto.address) userUpdateData.address = dto.address;
        if (Object.keys(userUpdateData).length > 0) {
          user = await tx.user.update({
            where: { id: user.id },
            data: userUpdateData,
          });
        }
      }

      // Generate sequential numeric system ID starting from 30001
      const allCustomers = await tx.customer.findMany({
        select: { id: true },
      });
      let maxNum = 30000;
      for (const c of allCustomers) {
        if (/^30\d+$/.test(c.id)) {
          const n = parseInt(c.id, 10);
          if (!isNaN(n) && n > maxNum) {
            maxNum = n;
          }
        }
      }
      const nextCustomerId = (maxNum + 1).toString();

      const customer = await tx.customer.create({
        data: {
          id: nextCustomerId,
          userId: user.id,
          name: dto.name,
          displayName: dto.displayName || dto.company || null,
          phone: cleanPhone,
          email: dto.email || null,
          birthDate: validBirthDate,
          cooperationStartDate: validCoopDate,
          telegramChatId: dto.telegramChatId || null,
          description: dto.description || null,
          address: dto.address || null,
          status: "ACTIVE",
        },
        include: {
          user: true,
        },
      });

      await tx.auditLog
        .create({
          data: {
            actorType: "USER",
            actorRole: "ADMIN",
            actorDisplayNameSnapshot: "مدیر سیستم",
            action: "customer.create",
            entityType: "Customer",
            entityId: customer.id,
            reason: `تعریف مشتری جدید: ${dto.name} (${cleanPhone})`,
            after: { name: customer.name, phone: customer.phone },
          },
        })
        .catch(() => {});

      return customer;
    });
  }
}
