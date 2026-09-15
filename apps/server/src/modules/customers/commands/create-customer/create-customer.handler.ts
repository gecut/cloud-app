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

      if (!user) {
        user = await tx.user.create({
          data: {
            name: dto.name,
            phone: cleanPhone,
            email: dto.email || null,
            role: "CUSTOMER",
          },
        });
      } else if (user.phone !== cleanPhone) {
        user = await tx.user.update({
          where: { id: user.id },
          data: { phone: cleanPhone },
        });
      }

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          name: dto.name,
          displayName: dto.displayName || dto.company || null,
          phone: cleanPhone,
          email: dto.email || null,
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
