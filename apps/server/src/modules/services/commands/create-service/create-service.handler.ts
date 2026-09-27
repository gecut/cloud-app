import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { CreateServiceCommand } from "./create-service.command";
import { getNextUniqueInvoiceNumber } from "../../../invoices/utils/invoice-number.util";

@CommandHandler(CreateServiceCommand)
export class CreateServiceHandler
  implements ICommandHandler<CreateServiceCommand>
{
  private readonly logger = new Logger(CreateServiceHandler.name);

  constructor(private readonly prisma: PrismaService) {}

    async execute(command: CreateServiceCommand) {
      const { dto } = command;

      let serviceTypeId = dto.serviceTypeId;
      if (serviceTypeId) {
        const existing = await this.prisma.serviceType.findFirst({
          where: {
            OR: [{ id: serviceTypeId }, { slug: serviceTypeId }],
          },
        });
        if (existing) {
          serviceTypeId = existing.id;
        }
      }

      if (!serviceTypeId && dto.serviceTypeSlug) {
        let matched = await this.prisma.serviceType.findFirst({
          where: {
            OR: [
              { slug: dto.serviceTypeSlug },
              { id: dto.serviceTypeSlug },
              { name: dto.serviceTypeSlug },
            ],
          },
        });
        if (matched) {
          serviceTypeId = matched.id;
        } else {
          // If user already has categories, pick the first one instead of creating arbitrary new ones
          const existingAny = await this.prisma.serviceType.findFirst({
            where: { isActive: true },
          });
          if (existingAny) {
            serviceTypeId = existingAny.id;
          } else {
            matched = await this.prisma.serviceType.create({
              data: {
                name: dto.serviceTypeSlug,
                slug: dto.serviceTypeSlug,
                description: "دسته‌بندی خدمات",
              },
            });
            serviceTypeId = matched.id;
          }
        }
      }

      if (!serviceTypeId) {
        let defaultType = await this.prisma.serviceType.findFirst();
        if (defaultType) {
          serviceTypeId = defaultType.id;
        }
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

      if (trackingType !== "QUANTITY" && renewalDate.getTime() < purchaseDate.getTime()) {
        throw new BadRequestException("تاریخ سررسید نمی‌تواند قبل از تاریخ خرید باشد");
      }

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

      const baseData: any = {
        customerId: customerId || null,
        parentServiceId: parentServiceId || null,
        serviceGroupId: dto.serviceGroupId || null,
        serviceTypeId,
        serverId: dto.serverId || null,
        name: dto.name,
        description: dto.description || null,
        priceToman: dto.priceToman || 0,
        autoRenew: dto.autoRenew !== undefined ? dto.autoRenew : true,
        quantity: Math.max(1, Number(dto.quantity) || 1),
        usedQuantity: 0,
        trackingType,
        purchaseDate,
        startDate,
        renewalDate,
        status: (dto.status as any) || "ACTIVE",
      };

      const includes = {
        customer: true,
        serviceType: true,
        serviceGroup: true,
        server: true,
        endpoints: true,
        parentService: true,
        childServices: {
          include: { customer: true },
        },
      };

      const service = await this.prisma.service.create({
        data: baseData,
        include: includes,
      });

      const cycle = dto.billingCycle || "MONTHLY";
      try {
        await (this.prisma as any).$executeRawUnsafe(
          `UPDATE "Service" SET "billingCycle" = $1 WHERE "id" = $2`,
          cycle,
          service.id,
        );
      } catch {}
      service.billingCycle = cycle;

      // Automatically create initial invoice whenever allocated to a customer
      if (customerId) {
        try {
          const invoiceNumber = await getNextUniqueInvoiceNumber(this.prisma);
          const price =
            typeof service.priceToman === "number"
              ? service.priceToman
              : Math.round(Number(dto.priceToman)) || 0;
          const qty =
            dto.quantity && dto.quantity > 0
              ? dto.quantity
              : service.quantity && service.quantity > 0
                ? service.quantity
                : 1;
          const itemTitle =
            qty > 1
              ? `${service.name} (تعداد: ${qty.toLocaleString("fa-IR")})`
              : `صورت‌حساب سرویس ${service.name}`;

          const categorySnapshot =
            dto.serviceTypeSlug ||
            service.serviceType?.slug ||
            service.serviceType?.name ||
            "hosting";

          const isFree = price === 0;
          const invoice = await this.prisma.invoice.create({
            data: {
              customerId,
              invoiceNumber,
              status: isFree ? "PAID" : "UNPAID",
              subtotalToman: price,
              totalToman: price,
              paidAt: isFree ? now : null,
              dueDate: service.renewalDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              notes: isFree
                ? `صورت‌حساب سرویس رایگان ${service.name} (تایید خودکار سیستمی)`
                : `صورت‌حساب اولیه تخصیص سرویس ${service.name}`,
              items: {
                create: [
                  {
                    serviceId: service.id,
                    title: itemTitle,
                    description: service.description || `سرویس فعال ${service.name}`,
                    quantity: qty,
                    unitPriceToman: price,
                    totalToman: price,
                    serviceNameSnapshot: service.name,
                    serviceTypeSnapshot: categorySnapshot,
                    servicePriceSnapshotToman: price,
                    serviceRenewalDateSnapshot: service.renewalDate || null,
                  },
                ],
              },
            },
          });

          if (isFree) {
            await this.prisma.payment.create({
              data: {
                invoiceId: invoice.id,
                amountToman: 0,
                provider: "FREE_PLAN",
                gatewayRef: `FREE_${invoice.id}_${Date.now()}`,
                paidAt: now,
              },
            });
          }
          this.logger.log(`Created initial invoice ${invoiceNumber} for service ${service.id} (customer: ${customerId}, free: ${isFree})`);
        } catch (err: any) {
          this.logger.error(`Error auto-generating initial invoice for service ${service.id}: ${err.message}`, err.stack);
        }
      }

      const isCustomerService = Boolean(customerId);
      const targetLabel = isCustomerService
        ? `مشتری: ${service.customer?.displayName || service.customer?.name || customerId}`
        : `تامین‌کننده / زیرساخت تامین${service.server ? ` (سرور ${service.server.name} - ${service.server.provider})` : ""}`;

      await this.prisma.auditLog
        .create({
          data: {
            actorType: "USER",
            actorRole: "ADMIN",
            actorDisplayNameSnapshot: "مدیر فنی سیستم",
            action: "service.create",
            entityType: "Service",
            entityId: service.id,
            reason: `تعریف سرویس جدید «${service.name}» (${targetLabel})`,
            metadata: {
              customerId: customerId || null,
              isSupplier: !isCustomerService,
            },
            after: {
              name: service.name,
              customerId: customerId || null,
              customerName: service.customer?.displayName || service.customer?.name || null,
              serverName: service.server?.name || null,
              priceToman: service.priceToman,
              isSupplier: !isCustomerService,
              status: service.status,
              renewalDate: service.renewalDate,
            },
          },
        })
        .catch(() => {});

      return service;
    }
  }
