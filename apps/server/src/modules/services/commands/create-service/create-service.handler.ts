  import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
  import { PrismaService } from "../../../../infrastructure/database/prisma.service";
  import { CreateServiceCommand } from "./create-service.command";

  @CommandHandler(CreateServiceCommand)
  export class CreateServiceHandler
    implements ICommandHandler<CreateServiceCommand>
  {
    constructor(private readonly prisma: PrismaService) {}

    async execute(command: CreateServiceCommand) {
      const { dto } = command;

      return this.prisma.service.create({
        data: {
          customerId: dto.customerId,
          serviceGroupId: dto.serviceGroupId || null,
          serviceTypeId: dto.serviceTypeId,
          serverId: dto.serverId || null,
          name: dto.name,
          description: dto.description || null,
          priceToman: dto.priceToman,
          startDate: new Date(dto.startDate),
          renewalDate: new Date(dto.renewalDate),
          status: "ACTIVE",
        },
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
