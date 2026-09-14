import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { CreateServerCommand } from "./create-server.command";

@CommandHandler(CreateServerCommand)
export class CreateServerHandler
  implements ICommandHandler<CreateServerCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateServerCommand) {
    const { dto } = command;

    return this.prisma.server.create({
      data: {
        name: dto.name,
        provider: dto.provider,
        status: dto.status || "ACTIVE",
        ipAddress: dto.ipAddress || null,
        domain: dto.domain || null,
        location: dto.location || null,
        cpu: dto.cpu || null,
        ram: dto.ram || null,
        storage: dto.storage || null,
        monthlyCostToman: dto.monthlyCostToman || null,
        internalNotes: dto.internalNotes || null,
      },
    });
  }
}
