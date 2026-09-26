import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { getNextUniqueInvoiceNumber } from "../invoices/utils/invoice-number.util";

@Injectable()
export class RenewalsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(RenewalsSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Run an initial check upon server startup
    this.checkAndProcessExpiredServices().catch((err) => {
      this.logger.error("Error during initial expired services check", err);
    });
  }

  
  // Run every 15 minutes to catch expired services promptly
  @Cron("*/15 * * * *")
  async handleCron() {
    await this.checkAndProcessExpiredServices();
  }

  async checkAndProcessExpiredServices() {
    const now = new Date();

    // 1. Auto-heal any services that were marked INACTIVE but are valid and autoRenew is ON
    try {
      const inactiveServices = await this.prisma.service.findMany({
        where: { status: "INACTIVE" },
      });
      for (const s of inactiveServices) {
        const trackingType = (s.trackingType || "HYBRID").toUpperCase();
        const isTimeValid = !s.renewalDate || new Date(s.renewalDate).getTime() >= now.getTime();
        const hasRemainingQuota = s.quantity == null || Number(s.quantity) > Number(s.usedQuantity || 0);

        let shouldHeal = false;
        if (trackingType === "QUANTITY") {
          shouldHeal = hasRemainingQuota;
        } else if (trackingType === "TIME") {
          shouldHeal = isTimeValid;
        } else {
          // HYBRID: Both must be valid (priority to quota)
          shouldHeal = isTimeValid && hasRemainingQuota;
        }

        if (shouldHeal && s.autoRenew) {
          await this.prisma.service.update({
            where: { id: s.id },
            data: { status: "ACTIVE" },
          });
          this.logger.log(`[RenewalsScheduler] Restored ACTIVE status for valid service ${s.name} (${s.id})`);
        }
      }
    } catch (err) {
      this.logger.error("Error during auto-healing inactive services", err);
    }

    // 2. Find all active services whose renewalDate is in the past OR quantity quota is depleted
    const activeServices = await this.prisma.service.findMany({
      where: {
        status: "ACTIVE",
        customerId: { not: null },
      },
      include: {
        customer: true,
      },
    });

    const expiredServices = activeServices.filter((service) => {
      const trackingType = (service.trackingType || "HYBRID").toUpperCase();
      const isTimeExpired =
        trackingType !== "QUANTITY" &&
        service.renewalDate &&
        new Date(service.renewalDate).getTime() <= now.getTime();

      const isQuantityDepleted =
        (trackingType === "QUANTITY" || trackingType === "HYBRID") &&
        service.quantity != null &&
        Number(service.usedQuantity || 0) >= Number(service.quantity);

      // In HYBRID: Quantity depletion takes precedence and finishes the service immediately
      return isTimeExpired || isQuantityDepleted;
    });

    if (expiredServices.length === 0) {
      return;
    }

    this.logger.log(`Found ${expiredServices.length} expired or depleted service(s) to process.`);

    for (const service of expiredServices) {
      try {
        await this.processServiceExpiration(service, now);
      } catch (err) {
        this.logger.error(`Failed to process expired service ${service.id}`, err);
      }
    }

    // 3. Process expired Supplier Services (تامین‌کنندگان)
    try {
      for (const supSvc of Array.from(this.prisma.memSupplierServices.values())) {
        if (
          supSvc.status === "ACTIVE" &&
          supSvc.renewalDate &&
          new Date(supSvc.renewalDate).getTime() < now.getTime()
        ) {
          const cycleDays = supSvc.billingCycleDays || 30;
          const prevRenewal = new Date(supSvc.renewalDate);
          let nextRenewal = new Date(prevRenewal.getTime() + cycleDays * 24 * 60 * 60 * 1000);
          if (nextRenewal.getTime() <= now.getTime()) {
            nextRenewal = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000);
          }

          supSvc.purchaseDate = prevRenewal;
          supSvc.renewalDate = nextRenewal;
          supSvc.updatedAt = now;

          const amount = Number(supSvc.priceToman ?? supSvc.monthlyExpenseToman) || 0;
          const isFree = amount === 0;

          const invoiceNumber = await getNextUniqueInvoiceNumber(this.prisma);
          const sup = this.prisma.memSuppliers.get(supSvc.supplierId);

          const supInvoice = await this.prisma.invoice.create({
            data: {
              customerId: null,
              supplierId: supSvc.supplierId,
              counterpartyType: "SUPPLIER",
              invoiceNumber,
              status: isFree ? "PAID" : "UNPAID",
              subtotalToman: amount,
              totalToman: amount,
              paidAt: isFree ? now : null,
              issuedAt: now,
              dueDate: nextRenewal,
              notes: isFree
                ? `فاکتور خرید رایگان سرویس تامین‌کننده ${supSvc.name} (تایید خودکار سیستمی)`
                : `فاکتور تمدید دوره خرید سرویس «${supSvc.name}» از تامین‌کننده ${sup?.name || ""}`,
              items: {
                create: [
                  {
                    serviceId: supSvc.id,
                    title: `تمدید سرویس تامین‌کننده ${supSvc.name}`,
                    quantity: 1,
                    unitPriceToman: amount,
                    totalToman: amount,
                    serviceNameSnapshot: supSvc.name,
                    serviceTypeSnapshot: supSvc.type,
                    servicePriceSnapshotToman: amount,
                    serviceRenewalDateSnapshot: nextRenewal,
                  },
                ],
              },
            } as any,
          });

          if (isFree) {
            await this.prisma.payment.create({
              data: {
                invoiceId: supInvoice.id,
                amountToman: 0,
                provider: "FREE_PLAN",
                gatewayRef: `FREE_${supInvoice.id}_${Date.now()}`,
                paidAt: now,
              },
            });
          } else if (sup) {
            sup.totalPayableToman = (sup.totalPayableToman || 0) + amount;
          }

          this.prisma.saveToDisk();
          this.logger.log(`[AutoRenew] Renewed supplier service ${supSvc.name} to ${nextRenewal.toISOString().slice(0, 10)}. Issued purchase invoice #${invoiceNumber}.`);
        }
      }
    } catch (supErr) {
      this.logger.error("Failed to process expired supplier services", supErr);
    }
  }

  async processSingleServiceById(serviceId: string): Promise<boolean> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { customer: true },
    });
    if (!service) return false;
    return this.processServiceExpiration(service);
  }

  async processServiceExpiration(service: any, now = new Date()): Promise<boolean> {
    const trackingType = (service.trackingType || "HYBRID").toUpperCase();

    const isTimeExpired =
      trackingType !== "QUANTITY" &&
      service.renewalDate &&
      new Date(service.renewalDate).getTime() <= now.getTime();

    const isQuantityDepleted =
      (trackingType === "QUANTITY" || trackingType === "HYBRID") &&
      service.quantity != null &&
      Number(service.usedQuantity || 0) >= Number(service.quantity);

    // Business rule: For HYBRID packages, priority is on quantity:
    // If quantity ends first, service is expired immediately!
    const isExpired =
      trackingType === "QUANTITY"
        ? isQuantityDepleted
        : trackingType === "TIME"
        ? isTimeExpired
        : isQuantityDepleted || isTimeExpired;

    if (!isExpired) {
      return false;
    }

    const isAutoRenew = Boolean(service.autoRenew);

    let cycleDays = 30;
    const parsedCycle = Number(service.billingCycle);
    if (!isNaN(parsedCycle) && parsedCycle > 0) {
      cycleDays = parsedCycle;
    } else if (service.billingCycle === "ANNUAL") {
      cycleDays = 365;
    } else if (service.billingCycle === "SEMI_ANNUAL") {
      cycleDays = 180;
    } else if (service.billingCycle === "QUARTERLY") {
      cycleDays = 90;
    }

    if (isAutoRenew) {
      // --- AUTO RENEW ACTIVE ---
      let newStartDate: Date;
      let targetRenewalDate: Date;

      if (trackingType === "QUANTITY") {
        newStartDate = now;
        targetRenewalDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      } else if (trackingType === "HYBRID" && isQuantityDepleted) {
        // Quota finished early! New cycle begins NOW
        newStartDate = now;
        targetRenewalDate = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000);
      } else {
        // Time-based renewal
        const previousRenewalDate = service.renewalDate ? new Date(service.renewalDate) : now;
        newStartDate = previousRenewalDate.getTime() > now.getTime() ? now : previousRenewalDate;
        targetRenewalDate = new Date(previousRenewalDate.getTime() + cycleDays * 24 * 60 * 60 * 1000);
        if (targetRenewalDate.getTime() <= now.getTime()) {
          targetRenewalDate = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000);
        }
      }

      await this.prisma.service.update({
        where: { id: service.id },
        data: {
          status: "ACTIVE",
          purchaseDate: newStartDate,
          renewalDate: targetRenewalDate,
          usedQuantity: 0,
        },
      });

      const year = now.getFullYear();
      const seq = await this.prisma.invoiceSequence.upsert({
        where: { year },
        create: { year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      const invoiceNumber = (30000 + seq.lastNumber).toString();

      const price = Number(service.priceToman) || 0;
      const isFree = price === 0;

      let itemTitle = `تمدید خودکار سرویس ${service.name} (${cycleDays.toLocaleString("fa-IR")} روزه)`;
      let itemDesc = `تمدید دوره جدید برای سرویس ${service.name}`;

      if (trackingType === "QUANTITY") {
        itemTitle = `تمدید خودکار بسته ${service.name} (شارژ مجدد سهمیه ${(service.quantity || 1).toLocaleString("fa-IR")} عددی)`;
        itemDesc = `شارژ مجدد سهمیه ${service.quantity || 1} عددی ${service.name}`;
      } else if (trackingType === "HYBRID" && isQuantityDepleted) {
        itemTitle = `تمدید خودکار بسته ترکیبی ${service.name} (به دلیل اتمام سهمیه عددی)`;
        itemDesc = `تمدید دوره و شارژ مجدد سهمیه ${(service.quantity || 1).toLocaleString("fa-IR")} عددی ${service.name} (${cycleDays.toLocaleString("fa-IR")} روزه)`;
      }

      const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const newInvoice = await this.prisma.invoice.create({
        data: {
          customerId: service.customerId,
          invoiceNumber,
          status: isFree ? "PAID" : "UNPAID",
          subtotalToman: price,
          totalToman: price,
          paidAt: isFree ? now : null,
          dueDate,
          notes: isFree
            ? `صورت‌حساب تمدید خودکار سرویس رایگان ${service.name} (تایید خودکار سیستمی)`
            : `صورت‌حساب تمدید خودکار دوره جدید سرویس ${service.name}`,
          items: {
            create: [
              {
                serviceId: service.id,
                title: itemTitle,
                description: itemDesc,
                quantity: 1,
                unitPriceToman: price,
                totalToman: price,
                serviceNameSnapshot: service.name,
                servicePriceSnapshotToman: price,
                serviceRenewalDateSnapshot: targetRenewalDate,
              },
            ],
          },
        },
      });

      let paymentRecord: any = null;
      if (isFree) {
        paymentRecord = await this.prisma.payment.create({
          data: {
            invoiceId: newInvoice.id,
            amountToman: 0,
            provider: "FREE_PLAN",
            gatewayRef: `FREE_${newInvoice.id}_${Date.now()}`,
            paidAt: now,
          },
        });
      }

      this.logger.log(
        `[AutoRenew] Renewed service ${service.name} (${service.id}) to ${targetRenewalDate.toISOString().slice(0, 10)}. Issued invoice ${newInvoice.invoiceNumber} (${isFree ? "Free/PAID" : "UNPAID"}).`,
      );

      await this.prisma.auditLog
        .create({
          data: {
            actorType: "SYSTEM",
            actorRole: "ADMIN",
            actorDisplayNameSnapshot: "سیستم تمدید خودکار",
            action: "service.auto_renewed",
            entityType: "Service",
            entityId: service.id,
            reason: `تمدید خودکار سرویس ${service.name}، پیشبرد سررسید به ${targetRenewalDate.toISOString().slice(0, 10)} و صدور صورت‌حساب ${newInvoice.invoiceNumber}`,
            metadata: {
              customerId: service.customerId || null,
              invoiceId: newInvoice.id,
              invoiceNumber: newInvoice.invoiceNumber,
              isFree,
              paymentId: paymentRecord?.id || null,
            },
            after: {
              serviceId: service.id,
              status: "ACTIVE",
              renewalDate: targetRenewalDate.toISOString(),
              usedQuantity: 0,
              invoiceId: newInvoice.id,
              invoiceNumber: newInvoice.invoiceNumber,
              totalToman: price,
              isFree,
            },
          },
        })
        .catch(() => {});

      return true;
    } else {
      // --- AUTO RENEW OFF: Deactivate service and record audit log ---
      const reasonMsg = isQuantityDepleted
        ? `سقف ظرفیت و سهمیه بسته ${service.name} به پایان رسید؛ تغییر وضعیت به غیرفعال توسط سیستم (عدم فعال بودن تمدید خودکار)`
        : `تاریخ سررسید سرویس ${service.name} به پایان رسید؛ تغییر وضعیت به غیرفعال توسط سیستم (عدم فعال بودن تمدید خودکار)`;

      await this.prisma.service.update({
        where: { id: service.id },
        data: { status: "INACTIVE" },
      });

      await this.prisma.auditLog
        .create({
          data: {
            actorType: "SYSTEM",
            actorRole: "ADMIN",
            actorDisplayNameSnapshot: "سیستم هوشمند انقضا و تمدید",
            action: "service.expired_deactivated",
            entityType: "Service",
            entityId: service.id,
            reason: reasonMsg,
            after: {
              serviceId: service.id,
              status: "INACTIVE",
              renewalDate: service.renewalDate ? new Date(service.renewalDate).toISOString() : null,
              usedQuantity: service.usedQuantity,
              quantity: service.quantity,
            },
          },
        })
        .catch(() => {});

      return true;
    }
  }
}
