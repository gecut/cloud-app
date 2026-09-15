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

      let serviceTypeId = dto.serviceTypeId;
      if (!serviceTypeId && dto.serviceTypeSlug) {
        let matched = await this.prisma.serviceType.findFirst({
          where: { slug: dto.serviceTypeSlug },
        });
        if (!matched) {
          const typeNames: Record<string, { name: string; description: string }> = {
            domain: { name: "ثبت و مدیریت دامنه", description: "دامنه‌های ملی و بین‌المللی" },
            server: { name: "سرور ابری و اختصاصی", description: "سرورهای مجازی و اختصاصی" },
            hosting: { name: "میزبانی وب و هاست", description: "هاست ابری پرسرعت NVMe و اشتراکی" },
            api: { name: "سرویس‌های ابری و API", description: "وب‌سرویس‌ها و رابط‌های ابری" },
            package: { name: "بسته تعدادی / پکیج", description: "بسته‌ها و پکیج‌های حجمی یا تعدادی" },
          };
          const info = typeNames[dto.serviceTypeSlug] || {
            name: dto.serviceTypeSlug,
            description: "سرویس ابری",
          };
          matched = await this.prisma.serviceType.create({
            data: {
              name: info.name,
              slug: dto.serviceTypeSlug,
              description: info.description,
            },
          });
        }
        serviceTypeId = matched.id;
      }

      if (!serviceTypeId) {
        let defaultType = await this.prisma.serviceType.findFirst();
        if (!defaultType) {
          defaultType = await this.prisma.serviceType.create({
            data: {
              name: "هاست ابری و زیرساخت",
              slug: "cloud-hosting",
              description: "سرویس‌های میزبانی و زیرساخت ابری",
            },
          });
        }
        serviceTypeId = defaultType.id;
      }

      const now = new Date();
      const startDate = dto.startDate ? new Date(dto.startDate) : now;
      const renewalDate = dto.renewalDate
        ? new Date(dto.renewalDate)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      let customerId: string | null = dto.customerId || null;
      if (dto.customerId) {
        const matchedCustomer = await this.prisma.customer.findFirst({
          where: {
            OR: [{ id: dto.customerId }, { userId: dto.customerId }],
          },
        });
        if (matchedCustomer) {
          customerId = matchedCustomer.id;
        }
      }

      const service = await this.prisma.service.create({
        data: {
          customerId: (customerId as any) || undefined,
          serviceGroupId: dto.serviceGroupId || null,
          serviceTypeId,
          serverId: dto.serverId || null,
          name: dto.name,
          description: dto.description || null,
          priceToman: dto.priceToman || 0,
          billingCycle: dto.billingCycle || "MONTHLY",
          autoRenew: dto.autoRenew !== undefined ? dto.autoRenew : true,
          quantity: dto.quantity !== undefined ? dto.quantity : null,
          startDate,
          renewalDate,
          status: "ACTIVE",
        } as any,
        include: {
          customer: true,
          serviceType: true,
          serviceGroup: true,
          server: true,
          endpoints: true,
        },
      });

      // Automatically create initial invoice if allocated to a customer with price
      if (customerId && service.priceToman && service.priceToman > 0) {
        try {
          const year = new Date().getFullYear();
          const seq = await this.prisma.invoiceSequence.upsert({
            where: { year },
            create: { year, lastNumber: 1 },
            update: { lastNumber: { increment: 1 } },
          });
          const invoiceNumber = `INV-${year}-${seq.lastNumber.toString().padStart(5, "0")}`;
          const isPackage = Boolean(dto.quantity && dto.quantity > 0);
          const pkgQty = dto.quantity || 1;
          const itemTitle = isPackage
            ? `${service.name} (${pkgQty.toLocaleString("fa-IR")} عدد در بسته)`
            : `صورت‌حساب سرویس ${service.name}`;

          await this.prisma.invoice.create({
            data: {
              customerId,
              invoiceNumber,
              status: "UNPAID",
              subtotalToman: service.priceToman,
              totalToman: service.priceToman,
              dueDate: service.renewalDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              notes: `صورت‌حساب اولیه تخصیص سرویس ${service.name}`,
              items: {
                create: [
                  {
                    serviceId: service.id,
                    title: itemTitle,
                    description: service.description || `سرویس فعال ${service.name}`,
                    quantity: pkgQty,
                    unitPriceToman: service.priceToman,
                    totalToman: service.priceToman,
                    serviceNameSnapshot: service.name,
                    servicePriceSnapshotToman: service.priceToman,
                  },
                ],
              },
            },
          });
        } catch {
          // ignore auto invoice failure to avoid blocking service assignment
        }
      }

      await this.prisma.auditLog
        .create({
          data: {
            actorType: "USER",
            actorRole: "ADMIN",
            actorDisplayNameSnapshot: "مدیر فنی سیستم",
            action: "service.create",
            entityType: "Service",
            entityId: service.id,
            reason: `تعریف و تخصیص سرویس ${service.name} به مشتری ${service.customer?.name || customerId}`,
            after: {
              name: service.name,
              customerId,
              priceToman: service.priceToman,
            },
          },
        })
        .catch(() => {});

      return service;
    }
  }
