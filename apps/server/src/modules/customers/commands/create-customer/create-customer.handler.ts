import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { CreateCustomerCommand } from "./create-customer.command";

@CommandHandler(CreateCustomerCommand)
export class CreateCustomerHandler
  implements ICommandHandler<CreateCustomerCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateCustomerCommand) {
    const { dto } = command;
    const phone = dto.phone || `090000000${Math.floor(10 + Math.random() * 90)}`;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          phone,
          email: dto.email || null,
          role: "CUSTOMER",
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          name: dto.name,
          displayName: dto.displayName || null,
          phone: dto.phone || null,
          email: dto.email || null,
          status: "ACTIVE",
        },
        include: {
          user: true,
        },
      });

      return customer;
    });
  }
}
