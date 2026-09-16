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

      const purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : startDate;
      const trackingType = dto.trackingType || "HYBRID";

      let parentServiceId: string | null = dto.parentServiceId || null;
      if (parentServiceId) {
        const parentService = await this.prisma.service.findUnique({
          where: { id: parentServiceId },
        });
        if (parentService) {
          if (!serviceTypeId) {
            serviceTypeId = parentService.serviceTypeId;
          }
          if (!dto.serverId && parentService.serverId) {
            dto.serverId = parentService.serverId;
          }
        }
      }

      const service = await this.prisma.service.create({
        data: {
          customerId: customerId || null,
          parentServiceId: parentServiceId || null,
          serviceGroupId: dto.serviceGroupId || null,
          serviceTypeId,
          serverId: dto.serverId || null,
          name: dto.name,
          description: dto.description || null,
          priceToman: dto.priceToman || 0,
          billingCycle: dto.billingCycle || "MONTHLY",
          autoRenew: dto.autoRenew !== undefined ? dto.autoRenew : true,
          quantity: Math.max(1, Number(dto.quantity) || 1),
          usedQuantity: 0,
          trackingType,
          purchaseDate,
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
          parentService: true,
          childServices: {
            include: { customer: true },
          },
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
          const invoiceNumber = (30000 + seq.lastNumber).toString();
          const qty = dto.quantity && dto.quantity > 0 ? dto.quantity : 1;
          const itemTitle =
            dto.quantity && dto.quantity > 1
              ? `${service.name} (تعداد: ${qty.toLocaleString("fa-IR")})`
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
                    quantity: qty,
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
