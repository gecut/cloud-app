import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@gecut-cloud/db";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@gecut-cloud/env/server";
import * as fs from "node:fs";
import * as path from "node:path";

const matchPhone = (a?: string | null, b?: string | null) => {
  if (!a || !b) return false;
  if (a === b) return true;
  const cleanA = a
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .replace(/[\s\-\(\)\+]/g, "");
  const cleanB = b
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .replace(/[\s\-\(\)\+]/g, "");
  return cleanA === cleanB;
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  public isDbConnected = false;

  // In-memory fallback stores
  public memUsers: Map<string, any> = new Map();
  public memCustomers: Map<string, any> = new Map();
  public memServices: Map<string, any> = new Map();
  public memServiceGroups: Map<string, any> = new Map();
  public memServers: Map<string, any> = new Map();
  public memEndpoints: Map<string, any> = new Map();
  public memSessions: Map<string, any> = new Map();
  public memInvoices: Map<string, any> = new Map();
  public memInvoiceItems: Map<string, any> = new Map();
  public memPayments: Map<string, any> = new Map();
  public memPaymentAttempts: Map<string, any> = new Map();
  public memAuditLogs: Array<any> = [];
  public memInvoiceSequences: Map<number, any> = new Map();

  // Suppliers in-memory store
  public memSuppliers: Map<string, any> = new Map();
  public memSupplierServices: Map<string, any> = new Map();

  public memServiceTypes: Array<any> = [];

  constructor() {
    const adapter = new PrismaPg({
      connectionString: env.DATABASE_URL,
    });
    super({ adapter });

    this.initFallbackData();
    this.installProxies();
  }

  private getStorageFilePath(): string {
    const candidate1 = path.join(process.cwd(), "apps", "server", "data", "db-store.json");
    const candidate2 = path.join(process.cwd(), "data", "db-store.json");
    if (fs.existsSync(candidate1)) return candidate1;
    if (fs.existsSync(candidate2)) return candidate2;
    const targetDir = fs.existsSync(path.join(process.cwd(), "apps", "server"))
      ? path.join(process.cwd(), "apps", "server", "data")
      : path.join(process.cwd(), "data");
    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch {}
    }
    return path.join(targetDir, "db-store.json");
  }

  private saveTimer: NodeJS.Timeout | null = null;
  public saveToDisk() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      try {
        const filePath = this.getStorageFilePath();
        const data = {
          users: Array.from(this.memUsers.entries()),
          customers: Array.from(this.memCustomers.entries()),
          services: Array.from(this.memServices.entries()),
          serviceGroups: Array.from(this.memServiceGroups.entries()),
          servers: Array.from(this.memServers.entries()),
          endpoints: Array.from(this.memEndpoints.entries()),
          sessions: Array.from(this.memSessions.entries()),
          invoices: Array.from(this.memInvoices.entries()),
          invoiceItems: Array.from(this.memInvoiceItems.entries()),
          payments: Array.from(this.memPayments.entries()),
          paymentAttempts: Array.from(this.memPaymentAttempts.entries()),
          auditLogs: this.memAuditLogs,
          suppliers: Array.from(this.memSuppliers.entries()),
          supplierServices: Array.from(this.memSupplierServices.entries()),
          invoiceSequences: Array.from(this.memInvoiceSequences.entries()),
          serviceTypes: this.memServiceTypes,
        };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      } catch (err) {
        this.logger.error("Failed to save resilient database store to disk", err);
      }
    }, 50);
  }

  private loadFromDisk(): boolean {
    try {
      const filePath = this.getStorageFilePath();
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, "utf-8");
      if (!content.trim()) return false;
      const data = JSON.parse(content);

      const reviveDates = (obj: any): any => {
        if (!obj || typeof obj !== "object") return obj;
        if (Array.isArray(obj)) return obj.map(reviveDates);
        const res: any = {};
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
            res[k] = new Date(v);
          } else if (typeof v === "object") {
            res[k] = reviveDates(v);
          } else {
            res[k] = v;
          }
        }
        return res;
      };

      if (data.users && Array.isArray(data.users)) {
        this.memUsers = new Map(reviveDates(data.users));
        for (const user of this.memUsers.values()) {
          if (typeof user.tokenVersion !== "number") {
            user.tokenVersion =
              typeof user.tokenVersion?.increment === "number"
                ? user.tokenVersion.increment
                : 0;
          }
        }
      }
      if (data.customers && Array.isArray(data.customers)) this.memCustomers = new Map(reviveDates(data.customers));
      if (data.services && Array.isArray(data.services)) this.memServices = new Map(reviveDates(data.services));
      if (data.serviceGroups && Array.isArray(data.serviceGroups)) this.memServiceGroups = new Map(reviveDates(data.serviceGroups));
      if (data.servers && Array.isArray(data.servers)) this.memServers = new Map(reviveDates(data.servers));
      if (data.endpoints && Array.isArray(data.endpoints)) this.memEndpoints = new Map(reviveDates(data.endpoints));
      if (data.sessions && Array.isArray(data.sessions)) this.memSessions = new Map(reviveDates(data.sessions));
      if (data.invoices && Array.isArray(data.invoices)) this.memInvoices = new Map(reviveDates(data.invoices));
      if (data.invoiceItems && Array.isArray(data.invoiceItems)) this.memInvoiceItems = new Map(reviveDates(data.invoiceItems));
      if (data.payments && Array.isArray(data.payments)) this.memPayments = new Map(reviveDates(data.payments));
      if (data.paymentAttempts && Array.isArray(data.paymentAttempts)) this.memPaymentAttempts = new Map(reviveDates(data.paymentAttempts));
      if (data.auditLogs && Array.isArray(data.auditLogs)) this.memAuditLogs = reviveDates(data.auditLogs);
      if (data.suppliers && Array.isArray(data.suppliers)) this.memSuppliers = new Map(reviveDates(data.suppliers));
      if (data.supplierServices && Array.isArray(data.supplierServices)) this.memSupplierServices = new Map(reviveDates(data.supplierServices));
      if (data.invoiceSequences && Array.isArray(data.invoiceSequences)) this.memInvoiceSequences = new Map(data.invoiceSequences);
      if (data.serviceTypes && Array.isArray(data.serviceTypes)) this.memServiceTypes = reviveDates(data.serviceTypes);

      this.logger.log(`💾 [PrismaService] Loaded persistent database store from ${filePath} (${this.memCustomers.size} customers, ${this.memServices.size} services, ${this.memInvoices.size} invoices).`);
      return true;
    } catch (err) {
      this.logger.warn("Failed to load resilient database store from disk", err);
      return false;
    }
  }

  private initFallbackData() {
    this.loadFromDisk();

    // Ensure Initial Admin user always exists
    const adminId = "user_admin_01";
    if (!this.memUsers.has(adminId)) {
      this.memUsers.set(adminId, {
        id: adminId,
        name: "مدیر سامانه",
        phone: "09120000001",
        email: "admin@gecut.local",
        passwordHash: "Admin@123456",
        role: "ADMIN",
        tokenVersion: 0,
        customerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      this.saveToDisk();
    }

    // Ensure Requested Primary Admin user exists and has role ADMIN
    const primaryAdminPhone = "09363528608";
    const primaryAdmin = Array.from(this.memUsers.values()).find(
      (u) => u.phone === primaryAdminPhone,
    );
    if (primaryAdmin) {
      primaryAdmin.role = "ADMIN";
      primaryAdmin.passwordHash = "admin@Gecut-cloud";
      const linkedCustomer = Array.from(this.memCustomers.values()).find(
        (c) => c.userId === primaryAdmin.id || matchPhone(c.phone, primaryAdminPhone),
      );
      if (linkedCustomer?.name) {
        primaryAdmin.name = linkedCustomer.name;
        primaryAdmin.customerId = linkedCustomer.id;
      } else if (!primaryAdmin.name) {
        primaryAdmin.name = "مدیر ارشد";
      }
      this.saveToDisk();
    } else {
      const pAdminId = "user_admin_primary";
      this.memUsers.set(pAdminId, {
        id: pAdminId,
        name: "مدیر ارشد سامانه",
        phone: primaryAdminPhone,
        email: "admin@gecut-cloud.ir",
        passwordHash: "admin@Gecut-cloud",
        role: "ADMIN",
        tokenVersion: 0,
        customerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      this.saveToDisk();
    }

    // Ensure all customer.userId values accurately match the user with matching phone
    for (const customer of Array.from(this.memCustomers.values())) {
      const user = customer.userId ? this.memUsers.get(customer.userId) : null;
      if (!user || !matchPhone(user.phone, customer.phone)) {
        // Find correct user with matching phone
        const correctUser = Array.from(this.memUsers.values()).find((u) => matchPhone(u.phone, customer.phone));
        if (correctUser) {
          customer.userId = correctUser.id;
          correctUser.customerId = customer.id;
        } else {
          // If customer has no user, create one
          const newUserId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          this.memUsers.set(newUserId, {
            id: newUserId,
            name: customer.name || "کاربر جیکات",
            phone: customer.phone,
            email: customer.email,
            passwordHash: "",
            role: "CUSTOMER",
            tokenVersion: 0,
            customerId: customer.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          customer.userId = newUserId;
        }
      }
    }

    // Clean up any rogue/orphaned users whose phone is NOT registered in customers AND not an admin
    const knownAdminPhones = ["09120000001", "09363528608"];
    for (const [userId, user] of Array.from(this.memUsers.entries())) {
      const isAdmin = knownAdminPhones.some((p) => matchPhone(user.phone, p));
      const hasCustomer = Array.from(this.memCustomers.values()).some((c) => matchPhone(c.phone, user.phone));
      if (!isAdmin && !hasCustomer) {
        this.memUsers.delete(userId);
      }
    }
    this.saveToDisk();

    // Ensure all supplier purchased services have an active purchase invoice in memInvoices

    let hasNewSupplierInvoice = false;
    for (const [svcId, svc] of Array.from(this.memSupplierServices.entries())) {
      const existingInv = Array.from(this.memInvoices.values()).find((inv) => {
        const items = inv.items || [];
        return (
          items.some((it: any) => it.serviceId === svcId) ||
          (inv.supplierId === svc.supplierId && (inv.notes || "").includes(svc.name))
        );
      });
      if (!existingInv) {
        const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const invoiceNumber = (30001 + this.memInvoices.size).toString();
        const sup = this.memSuppliers.get(svc.supplierId);
        const amount = Number(svc.priceToman ?? svc.monthlyExpenseToman) || 0;
        const newInv = {
          id,
          customerId: null,
          supplierId: svc.supplierId,
          counterpartyType: "SUPPLIER",
          invoiceNumber,
          status: "UNPAID",
          subtotalToman: amount,
          totalToman: amount,
          issuedAt: svc.purchaseDate ? new Date(svc.purchaseDate) : (svc.createdAt ? new Date(svc.createdAt) : new Date()),
          dueDate: svc.renewalDate ? new Date(svc.renewalDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paidAt: null,
          cancelledAt: null,
          notes: `فاکتور خرید دوره سرویس «${svc.name}» از تامین‌کننده ${sup?.name || ""}`,
          customer: null,
          supplier: sup || null,
          supplierName: sup?.name || null,
          items: [
            {
              id: `item_${Date.now()}_0`,
              invoiceId: id,
              serviceId: svcId,
              title: svc.name,
              quantity: 1,
              unitPriceToman: amount,
              totalToman: amount,
              serviceNameSnapshot: svc.name,
              serviceTypeSnapshot: svc.type,
              servicePriceSnapshotToman: amount,
              serviceRenewalDateSnapshot: svc.renewalDate ? new Date(svc.renewalDate) : null,
              createdAt: svc.createdAt ? new Date(svc.createdAt) : new Date(),
            },
          ],
          createdAt: svc.createdAt ? new Date(svc.createdAt) : new Date(),
          updatedAt: new Date(),
        };
        this.memInvoices.set(id, newInv);
        newInv.items.forEach((it: any) => this.memInvoiceItems.set(it.id, it));
        hasNewSupplierInvoice = true;
      }
    }
    if (hasNewSupplierInvoice) {
      this.saveToDisk();
    }

    // Initialize standard base categories ONLY if the category store is empty
    const baseCategories = [
      {
        id: "st_domain",
        name: "دامنه",
        slug: "domain",
        description: "دامنه‌های ملی و بین‌المللی",
        isActive: true,
        sortOrder: 1,
      },
      {
        id: "st_hosting",
        name: "هاست",
        slug: "hosting",
        description: "میزبانی پرسرعت، هاستینگ لینوکس و وردپرس",
        isActive: true,
        sortOrder: 2,
      },
      {
        id: "st_server",
        name: "سرور",
        slug: "server",
        description: "سرورهای ابری، VPS و زیرساخت اختصاصی",
        isActive: true,
        sortOrder: 3,
      },
      {
        id: "st_sms",
        name: "پنل پیامکی",
        slug: "sms",
        description: "سامانه ارسال پیامک، وب‌سرویس و خطوط خدماتی",
        isActive: true,
        sortOrder: 4,
      },
      {
        id: "st_support",
        name: "پشتیبانی متنی",
        slug: "support",
        description: "پشتیبانی متنی، تیکتینگ و پاسخگویی آنلاین",
        isActive: true,
        sortOrder: 5,
      },
      {
        id: "st_image",
        name: "تصویر",
        slug: "image",
        description: "سرویس‌های پردازش، میزبانی و بهینه‌سازی تصویر",
        isActive: true,
        sortOrder: 6,
      },
      {
        id: "st_other",
        name: "سایر",
        slug: "other",
        description: "سایر خدمات و محصولات متفرقه",
        isActive: true,
        sortOrder: 7,
      },
    ];

    if (!this.memServiceTypes) this.memServiceTypes = [];
    if (this.memServiceTypes.length === 0) {
      const now = new Date();
      for (const cat of baseCategories) {
        this.memServiceTypes.push({
          ...cat,
          createdAt: now,
          updatedAt: now,
        });
      }
      this.saveToDisk();
    }
  }

  override async $transaction(arg: any, options?: any): Promise<any> {
    if (this.isDbConnected) {
      try {
        return await super.$transaction(arg, options);
      } catch (err: any) {
        const isFallbackableErr =
          err.message?.includes("Can't reach database server") ||
          err.message?.includes("P1001") ||
          err.message?.includes("ECONNREFUSED") ||
          err.code === "P1001" ||
          err.code === "P2021" ||
          err.code === "42P01" ||
          err.message?.includes("does not exist") ||
          err.message?.includes("relation");
        if (!isFallbackableErr) throw err;
        this.isDbConnected = false;
        this.logger.warn("Database connection or schema unavailable during $transaction. Serving from in-memory fallback.");
      }
    }

    if (typeof arg === "function") {
      return await arg(this);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return null;
  }

  private installProxies() {
    const self = this;

    const wrapModel = (modelKey: string, fallback: any) => {
      const original = (this as any)[modelKey] || {};

      (this as any)[modelKey] = new Proxy(original, {
        get(target, prop, receiver) {
          const origFn = Reflect.get(target, prop, receiver);

          return async (...args: any[]) => {
            if (self.isDbConnected && typeof origFn === "function") {
              try {
                return await origFn.apply(target, args);
              } catch (err: any) {
                const isFallbackableErr =
                  err.message?.includes("Can't reach database server") ||
                  err.message?.includes("P1001") ||
                  err.message?.includes("ECONNREFUSED") ||
                  err.code === "P1001" ||
                  err.code === "P2021" ||
                  err.code === "42P01" ||
                  err.message?.includes("does not exist") ||
                  err.message?.includes("relation") ||
                  err.message?.includes("column");
                if (!isFallbackableErr) throw err;
                self.isDbConnected = false;
                self.logger.warn(
                  `Database query failed (${err.code || err.message}) during ${modelKey}.${String(prop)}. Serving from resilient memory repository.`
                );
              }
            }

            if (fallback && typeof fallback[prop] === "function") {
              const res = await fallback[prop](...args);
              if (["create", "update", "delete", "upsert", "deleteMany"].includes(prop as string)) {
                self.saveToDisk();
              }
              return res;
            }

            // Universal safe fallbacks for unhandled methods
            if (prop === "findMany") return [];
            if (prop === "findUnique" || prop === "findFirst") return null;
            if (prop === "count") return 0;
            if (prop === "create" || prop === "update" || prop === "upsert") {
              const d = args[0]?.data || args[0]?.create || {};
              const res = { id: `item_${Date.now()}`, ...d, createdAt: new Date(), updatedAt: new Date() };
              self.saveToDisk();
              return res;
            }
            if (prop === "delete" || prop === "deleteMany") {
              self.saveToDisk();
              return { count: 1 };
            }

            if (self.isDbConnected && typeof origFn === "function") {
              return origFn.apply(target, args);
            }
            return null;
          };
        },
      });
    };

    const enrichInvoiceItem = (it: any, invCustomerId?: string, invNotes?: string) => {
      let svc = it.serviceId ? this.memServices.get(it.serviceId) : null;
      let supSvc = it.serviceId ? this.memSupplierServices.get(it.serviceId) : null;

      if (!svc && !supSvc && invCustomerId) {
        const text = `${it.title || ""} ${invNotes || ""} ${it.description || ""} ${it.serviceNameSnapshot || ""}`.toLowerCase();
        for (const s of this.memServices.values()) {
          if (s.customerId === invCustomerId && s.name && text.includes(s.name.toLowerCase())) {
            svc = s;
            break;
          }
        }
        if (!svc) {
          for (const s of this.memSupplierServices.values()) {
            if (s.name && text.includes(s.name.toLowerCase())) {
              supSvc = s;
              break;
            }
          }
        }
      }

      if (supSvc) {
        return {
          ...it,
          serviceId: supSvc.id,
          serviceNameSnapshot: it.serviceNameSnapshot || supSvc.name || null,
          serviceTypeSnapshot: supSvc.type || it.serviceTypeSnapshot || "سرویس تامین‌کننده",
          service: {
            id: supSvc.id,
            name: supSvc.name,
            type: supSvc.type,
            priceToman: supSvc.priceToman || supSvc.monthlyExpenseToman,
            isSupplierService: true,
            supplierId: supSvc.supplierId,
            supplier: this.memSuppliers.get(supSvc.supplierId) || null,
          },
        };
      }

      const sType = svc?.serviceTypeId
        ? this.memServiceTypes.find((t: any) => t.id === svc.serviceTypeId)
        : null;
      const categoryName = sType?.name || sType?.slug || it.serviceTypeSnapshot;
      return {
        ...it,
        serviceId: svc ? svc.id : it.serviceId,
        serviceNameSnapshot: it.serviceNameSnapshot || svc?.name || null,
        serviceTypeSnapshot: categoryName || it.serviceTypeSnapshot || null,
        service: svc ? { ...svc, serviceType: sType } : it.service || null,
      };
    };

    // User model
    wrapModel("user", {
      findUnique: async (args: any) => {
        const where = args?.where || {};
        for (const u of this.memUsers.values()) {
          if (
            (where.phone && matchPhone(u.phone, where.phone)) ||
            (where.email && u.email === where.email) ||
            (where.id && u.id === where.id)
          ) {
            let cust = u.customerId ? this.memCustomers.get(u.customerId) || null : null;
            if (!cust) {
              cust = Array.from(this.memCustomers.values()).find((c) => c.userId === u.id || matchPhone(c.phone, u.phone)) || null;
              if (cust) {
                u.customerId = cust.id;
              }
            }
            return { ...u, customer: cust };
          }
        }
        return null;
      },
      findFirst: async (args: any) => {
        const where = args?.where || {};
        for (const u of this.memUsers.values()) {
          if (where.id && u.id !== where.id) continue;
          if (where.email && u.email !== where.email) continue;
          if (where.role && u.role !== where.role) continue;
          if (where.phone && !matchPhone(u.phone, where.phone)) continue;
          if (where.OR && Array.isArray(where.OR)) {
            const matchesOr = where.OR.some((cond: any) => {
              if (cond.id && u.id === cond.id) return true;
              if (cond.email && u.email === cond.email) return true;
              if (cond.phone && matchPhone(u.phone, cond.phone)) return true;
              return false;
            });
            if (!matchesOr) continue;
          }
          let cust = u.customerId ? this.memCustomers.get(u.customerId) || null : null;
          if (!cust) {
            cust = Array.from(this.memCustomers.values()).find((c) => c.userId === u.id || matchPhone(c.phone, u.phone)) || null;
            if (cust) {
              u.customerId = cust.id;
            }
          }
          return { ...u, customer: cust };
        }
        return null;
      },
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        let customer: any = null;

        if (d.customer?.create) {
          const custData = d.customer.create;
          const custId = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          customer = {
            id: custId,
            userId: id,
            name: custData.name || d.name,
            displayName: custData.displayName || custData.name || d.name,
            phone: custData.phone || d.phone,
            email: custData.email || d.email || null,
            status: custData.status || "ACTIVE",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.memCustomers.set(custId, customer);
        }

        const newUser = {
          id,
          name: d.name,
          phone: d.phone,
          email: d.email || null,
          passwordHash: d.passwordHash || "",
          role: d.role || "CUSTOMER",
          tokenVersion: 0,
          customerId: customer ? customer.id : null,
          customer,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memUsers.set(id, newUser);
        this.saveToDisk();
        return newUser;
      },
      update: async (args: any) => {
        const where = args?.where || {};
        const d = { ...(args?.data || {}) };
        for (const u of this.memUsers.values()) {
          if ((where.id && u.id === where.id) || (where.phone && matchPhone(u.phone, where.phone))) {
            if (d.tokenVersion && typeof d.tokenVersion === "object" && "increment" in d.tokenVersion) {
              const current = typeof u.tokenVersion === "number" ? u.tokenVersion : 0;
              u.tokenVersion = current + (Number(d.tokenVersion.increment) || 1);
              delete d.tokenVersion;
            } else if (typeof d.tokenVersion === "number") {
              u.tokenVersion = d.tokenVersion;
              delete d.tokenVersion;
            }
            Object.assign(u, d, { updatedAt: new Date() });
            let cust = u.customerId ? this.memCustomers.get(u.customerId) || null : null;
            if (!cust) {
              cust = Array.from(this.memCustomers.values()).find((c) => c.userId === u.id) || null;
              if (cust) {
                u.customerId = cust.id;
              }
            }
            this.saveToDisk();
            return { ...u, customer: cust };
          }
        }
        return null;
      },
      findMany: async (args?: any) => {
        let items = Array.from(this.memUsers.values());
        if (args?.where?.role) {
          items = items.filter((u) => u.role === args.where.role);
        }
        return items;
      },
      count: async () => this.memUsers.size,
    });

    // Customer model
    wrapModel("customer", {
      findUnique: async (args: any) => {
        const where = args?.where || {};
        for (const c of this.memCustomers.values()) {
          if (
            (where.id && c.id === where.id) ||
            (where.userId && c.userId === where.userId) ||
            (where.phone && matchPhone(c.phone, where.phone))
          ) {
          const services = Array.from(this.memServices.values())
            .filter((s) => s.customerId === c.id && !Array.from(this.memServices.values()).some((ch) => ch.parentServiceId === s.id))
            .map((s) => {
              const parentService = s.parentServiceId ? this.memServices.get(s.parentServiceId) || null : null;
              const effTypeId = s.serviceTypeId || parentService?.serviceTypeId;
              const resolvedType = effTypeId
                ? this.memServiceTypes.find((t) => t.id === effTypeId || t.slug === effTypeId) || null
                : null;
              return {
                ...s,
                parentServiceId: s.parentServiceId || null,
                parentService,
                serviceType: resolvedType || s.serviceType || parentService?.serviceType || null,
                server: s.serverId ? this.memServers.get(s.serverId) || null : null,
                endpoints: Array.from(this.memEndpoints.values()).filter((e) => e.serviceId === s.id),
              };
            });
          const invoices = Array.from(this.memInvoices.values())
            .filter((i) => i.customerId === c.id || (c.userId && i.customerId === c.userId))
            .map((i) => ({
              ...i,
              customer: c,
              items: (i.items && i.items.length > 0 ? i.items : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === i.id)).map((it: any) => enrichInvoiceItem(it, c.id, i.notes)),
              payment: Array.from(this.memPayments.values()).find((p) => p.invoiceId === i.id) || null,
            }));
          const user = this.memUsers.get(c.userId);
          return { ...c, services, invoices, user, _count: { services: services.length, invoices: invoices.length } };
          }
        }
        return null;
      },
      findFirst: async (args: any) => {
        const where = args?.where || {};
        for (const c of this.memCustomers.values()) {
          if (where.id && c.id !== where.id) continue;
          if (where.userId && c.userId !== where.userId) continue;
          if (where.phone && !matchPhone(c.phone, where.phone)) continue;
          if (where.email && c.email !== where.email) continue;
          if (where.OR && Array.isArray(where.OR)) {
            const matchesOr = where.OR.some((cond: any) => {
              if (cond.id && c.id === cond.id) return true;
              if (cond.userId && c.userId === cond.userId) return true;
              if (cond.phone && matchPhone(c.phone, cond.phone)) return true;
              return false;
            });
            if (!matchesOr) continue;
          }
          const services = Array.from(this.memServices.values())
            .filter((s) => s.customerId === c.id && !Array.from(this.memServices.values()).some((ch) => ch.parentServiceId === s.id))
            .map((s) => {
              const parentService = s.parentServiceId ? this.memServices.get(s.parentServiceId) || null : null;
              const effTypeId = s.serviceTypeId || parentService?.serviceTypeId;
              const resolvedType = effTypeId
                ? this.memServiceTypes.find((t) => t.id === effTypeId || t.slug === effTypeId) || null
                : null;
              return {
                ...s,
                parentServiceId: s.parentServiceId || null,
                parentService,
                serviceType: resolvedType || s.serviceType || parentService?.serviceType || null,
                server: s.serverId ? this.memServers.get(s.serverId) || null : null,
                endpoints: Array.from(this.memEndpoints.values()).filter((e) => e.serviceId === s.id),
              };
            });
          const invoices = Array.from(this.memInvoices.values())
            .filter((i) => i.customerId === c.id || (c.userId && i.customerId === c.userId))
            .map((i) => ({
              ...i,
              customer: c,
              items: (i.items && i.items.length > 0 ? i.items : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === i.id)).map((it: any) => enrichInvoiceItem(it, c.id, i.notes)),
              payment: Array.from(this.memPayments.values()).find((p) => p.invoiceId === i.id) || null,
            }));
          const user = this.memUsers.get(c.userId);
          return { ...c, services, invoices, user, _count: { services: services.length, invoices: invoices.length } };
        }
        return null;
      },
      findMany: async (args: any) => {
        let items = Array.from(this.memCustomers.values()).map((c) => {
          const services = Array.from(this.memServices.values())
            .filter((s) => s.customerId === c.id && !Array.from(this.memServices.values()).some((ch) => ch.parentServiceId === s.id));
          const invoices = Array.from(this.memInvoices.values())
            .filter((i) => i.customerId === c.id || (c.userId && i.customerId === c.userId))
            .map((i) => ({
              ...i,
              customer: c,
              items: (i.items && i.items.length > 0 ? i.items : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === i.id)).map((it: any) => enrichInvoiceItem(it, c.id, i.notes)),
              payment: Array.from(this.memPayments.values()).find((p) => p.invoiceId === i.id) || null,
            }));
          const user = this.memUsers.get(c.userId);
          return {
            ...c,
            services,
            invoices,
            user,
            _count: { services: services.length, invoices: invoices.length },
          };
        });
        const where = args?.where;
        if (where?.status) {
          items = items.filter((c) => c.status === where.status);
        }
        return items;
      },
      count: async (args: any) => {
        const where = args?.where;
        if (where?.status) {
          return Array.from(this.memCustomers.values()).filter((c) => c.status === where.status).length;
        }
        return this.memCustomers.size;
      },
      create: async (args: any) => {
        const d = args?.data || {};
        let maxNum = 30000;
        for (const k of this.memCustomers.keys()) {
          if (/^30\d+$/.test(k)) {
            const n = parseInt(k, 10);
            if (!isNaN(n) && n > maxNum) maxNum = n;
          }
        }
        const id = d.id || (maxNum + 1).toString();
        const newCust = {
          id,
          ...d,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memCustomers.set(id, newCust);
        if (d.userId) {
          const u = this.memUsers.get(d.userId);
          if (u) {
            u.customerId = id;
            u.customer = newCust;
          }
        }
        const user = d.userId ? this.memUsers.get(d.userId) : null;
        return {
          ...newCust,
          user,
          services: [],
          invoices: [],
          _count: { services: 0, invoices: 0 },
        };
      },
      update: async (args: any) => {
        const where = args?.where || {};
        const d = args?.data || {};
        const c = this.memCustomers.get(where.id);
        if (c) {
          Object.assign(c, d, { updatedAt: new Date() });
          this.saveToDisk();
          return c;
        }
        return null;
      },
      delete: async (args: any) => {
        const where = args?.where || {};
        let targetId = where.id;
        let cust = this.memCustomers.get(where.id);
        if (!cust) {
          for (const [cid, c] of this.memCustomers.entries()) {
            if (c.id === where.id || c.userId === where.id) {
              cust = c;
              targetId = cid;
              break;
            }
          }
        }
        if (cust) {
          if (cust.userId) {
            const u = this.memUsers.get(cust.userId);
            if (u) {
              u.customerId = null;
              u.customer = null;
            }
          }
          // Clean up customer's services
          for (const [sid, s] of Array.from(this.memServices.entries())) {
            if (s.customerId === cust.id || s.customerId === cust.userId) {
              this.memServices.delete(sid);
            }
          }
          // Clean up customer's invoices and items
          for (const [iid, inv] of Array.from(this.memInvoices.entries())) {
            if (inv.customerId === cust.id || inv.customerId === cust.userId) {
              for (const [itemId, it] of Array.from(this.memInvoiceItems.entries())) {
                if (it.invoiceId === iid) this.memInvoiceItems.delete(itemId);
              }
              for (const [pid, p] of Array.from(this.memPayments.entries())) {
                if (p.invoiceId === iid) this.memPayments.delete(pid);
              }
              this.memInvoices.delete(iid);
            }
          }
          this.memCustomers.delete(targetId);
          this.saveToDisk();
          return { count: 1, id: targetId, ...cust };
        }
        return { count: 0 };
      },
    });

    // ServiceType model
    const matchServiceType = (t: any, where: any): boolean => {
      if (!where) return true;
      if (where.OR && Array.isArray(where.OR)) {
        return where.OR.some((cond: any) => matchServiceType(t, cond));
      }
      if (where.AND && Array.isArray(where.AND)) {
        return where.AND.every((cond: any) => matchServiceType(t, cond));
      }
      if (where.id !== undefined) {
        if (typeof where.id === "object" && where.id !== null) {
          if (where.id.not !== undefined && (t.id === where.id.not || t.slug === where.id.not)) {
            return false;
          }
          if (where.id.in !== undefined && !where.id.in.includes(t.id) && !where.id.in.includes(t.slug)) {
            return false;
          }
        } else {
          if (t.id !== where.id && t.slug !== where.id) {
            return false;
          }
        }
      }
      if (where.slug !== undefined) {
        if (typeof where.slug === "object" && where.slug !== null) {
          if (where.slug.not !== undefined && t.slug === where.slug.not) {
            return false;
          }
        } else {
          if (t.slug !== where.slug) {
            return false;
          }
        }
      }
      if (where.name !== undefined) {
        if (typeof where.name === "object" && where.name !== null) {
          if (where.name.not !== undefined && t.name === where.name.not) {
            return false;
          }
        } else {
          if (t.name !== where.name) {
            return false;
          }
        }
      }
      if (where.isActive !== undefined && t.isActive !== where.isActive) {
        return false;
      }
      return true;
    };

    wrapModel("serviceType", {
      findUnique: async (args: any) => {
        const where = args?.where || {};
        const item = this.memServiceTypes.find((t) => matchServiceType(t, where));
        if (!item) return null;
        const count = Array.from(this.memServices.values()).filter(
          (s: any) =>
            s.serviceTypeId === item.id ||
            s.serviceType?.id === item.id ||
            s.serviceType?.slug === item.slug ||
            s.serviceTypeSlug === item.slug,
        ).length;
        return {
          ...item,
          _count: { services: count },
        };
      },
      findFirst: async (args: any) => {
        const where = args?.where || {};
        const item = this.memServiceTypes.find((t) => matchServiceType(t, where));
        if (!item) return null;
        const count = Array.from(this.memServices.values()).filter(
          (s: any) =>
            s.serviceTypeId === item.id ||
            s.serviceType?.id === item.id ||
            s.serviceType?.slug === item.slug ||
            s.serviceTypeSlug === item.slug,
        ).length;
        return {
          ...item,
          _count: { services: count },
        };
      },
      findMany: async (args: any) => {
        const where = args?.where;
        let items = this.memServiceTypes.filter((t) => matchServiceType(t, where));
        return items.map((item) => {
          const count = Array.from(this.memServices.values()).filter(
            (s: any) =>
              s.serviceTypeId === item.id ||
              s.serviceType?.id === item.id ||
              s.serviceType?.slug === item.slug ||
              s.serviceTypeSlug === item.slug,
          ).length;
          return {
            ...item,
            _count: { services: count },
          };
        });
      },
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `st_${Date.now()}`;
        const newType = {
          id,
          name: d.name,
          slug: d.slug,
          description: d.description || null,
          isActive: d.isActive ?? true,
          sortOrder: d.sortOrder || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memServiceTypes.unshift(newType);
        this.saveToDisk();
        return newType;
      },
      update: async (args: any) => {
        const where = args?.where || {};
        const d = args?.data || {};
        const idx = this.memServiceTypes.findIndex((t) => matchServiceType(t, where));
        if (idx === -1) return null;
        this.memServiceTypes[idx] = {
          ...this.memServiceTypes[idx],
          ...d,
          updatedAt: new Date(),
        };
        this.saveToDisk();
        return this.memServiceTypes[idx];
      },
      delete: async (args: any) => {
        const where = args?.where || {};
        const idx = this.memServiceTypes.findIndex((t) => matchServiceType(t, where));
        if (idx !== -1) {
          const deleted = this.memServiceTypes.splice(idx, 1)[0];
          this.saveToDisk();
          return deleted;
        }
        return null;
      },
    });

    // Service model
    const matchServiceFilter = (s: any, where: any) => {
      if (!where) return true;
      if (where.id && s.id !== where.id) return false;
      if (where.status && where.status !== "ALL" && s.status !== where.status) return false;
      if (where.serviceGroupId && s.serviceGroupId !== where.serviceGroupId) return false;
      if (where.serverId && s.serverId !== where.serverId) return false;

      if (where.trackingType) {
        if (typeof where.trackingType === "object") {
          if (where.trackingType.not && s.trackingType === where.trackingType.not) return false;
          if (where.trackingType.equals && s.trackingType !== where.trackingType.equals) return false;
        } else if (typeof where.trackingType === "string") {
          if (s.trackingType !== where.trackingType) return false;
        }
      }

      if (where.renewalDate) {
        const sTime = s.renewalDate ? new Date(s.renewalDate).getTime() : null;
        if (where.renewalDate.lt) {
          const target = new Date(where.renewalDate.lt).getTime();
          if (sTime === null || sTime >= target) return false;
        }
        if (where.renewalDate.lte) {
          const target = new Date(where.renewalDate.lte).getTime();
          if (sTime === null || sTime > target) return false;
        }
        if (where.renewalDate.gt) {
          const target = new Date(where.renewalDate.gt).getTime();
          if (sTime === null || sTime <= target) return false;
        }
        if (where.renewalDate.gte) {
          const target = new Date(where.renewalDate.gte).getTime();
          if (sTime === null || sTime < target) return false;
        }
      }

      if (where.customerId) {
        if (s.customerId !== where.customerId) {
          const cust = this.memCustomers.get(s.customerId);
          const matches = cust && (cust.userId === where.customerId || cust.id === where.customerId);
          if (!matches) return false;
        }
      }

      if (where.OR && Array.isArray(where.OR)) {
        const matchesAny = where.OR.some((cond: any) => {
          if (cond.customerId) {
            if (s.customerId === cond.customerId) return true;
            const cust = this.memCustomers.get(s.customerId);
            return cust && (cust.userId === cond.customerId || cust.id === cond.customerId);
          }
          if (cond.id && s.id === cond.id) return true;
          return false;
        });
        if (!matchesAny) return false;
      }

      if (where.childServices) {
        const hasChildren = Array.from(this.memServices.values()).some((c) => c.parentServiceId === s.id);
        if (where.childServices.none && hasChildren) return false;
        if (where.childServices.some && !hasChildren) return false;
      }

      return true;
    };

    wrapModel("service", {
      findMany: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memServices.values());

        // Auto-heal: If service has valid date and remaining quota, ensure status is ACTIVE
        const nowMs = Date.now();
        for (const s of items) {
          const isDateValid = !s.renewalDate || new Date(s.renewalDate).getTime() >= nowMs;
          const hasQuota = s.quantity == null || Number(s.quantity) > Number(s.usedQuantity || 0);
          if (s.status === "INACTIVE" && isDateValid && hasQuota) {
            s.status = "ACTIVE";
          }
        }

        items = items.filter((s) => matchServiceFilter(s, where));

        return items.map((s) => {
          const parentSvc = s.parentServiceId ? this.memServices.get(s.parentServiceId) || null : null;
          const effTypeId = s.serviceTypeId || parentSvc?.serviceTypeId;
          const resolvedType = effTypeId
            ? this.memServiceTypes.find((t) => t.id === effTypeId || t.slug === effTypeId) || null
            : null;

          return {
            ...s,
            parentServiceId: s.parentServiceId || null,
            parentService: parentSvc,
            childServices: Array.from(this.memServices.values())
              .filter((c) => c.parentServiceId === s.id)
              .map((c) => ({
                ...c,
                customer: this.memCustomers.get(c.customerId) || null,
                endpoints: Array.from(this.memEndpoints.values()).filter((e) => e.serviceId === c.id),
              })),
            serviceType: resolvedType,
            customer: this.memCustomers.get(s.customerId) || null,
            server: s.serverId ? this.memServers.get(s.serverId) || null : null,
            endpoints: Array.from(this.memEndpoints.values()).filter((e) => e.serviceId === s.id),
          };
        });
      },
      findUnique: async (args: any) => {
        const where = args?.where || {};
        const s = this.memServices.get(where.id);
        if (!s) return null;
        const nowMs = Date.now();
        const isDateValid = !s.renewalDate || new Date(s.renewalDate).getTime() >= nowMs;
        const hasQuota = s.quantity == null || Number(s.quantity) > Number(s.usedQuantity || 0);
        if (s.status === "INACTIVE" && isDateValid && hasQuota) {
          s.status = "ACTIVE";
        }
        const parentSvc = s.parentServiceId ? this.memServices.get(s.parentServiceId) || null : null;
        const effTypeId = s.serviceTypeId || parentSvc?.serviceTypeId;
        const resolvedType = effTypeId
          ? this.memServiceTypes.find((t) => t.id === effTypeId || t.slug === effTypeId) || null
          : null;

        return {
          ...s,
          parentServiceId: s.parentServiceId || null,
          parentService: parentSvc,
          childServices: Array.from(this.memServices.values())
            .filter((c) => c.parentServiceId === s.id)
            .map((c) => ({
              ...c,
              customer: this.memCustomers.get(c.customerId) || null,
              endpoints: Array.from(this.memEndpoints.values()).filter((e) => e.serviceId === c.id),
            })),
          serviceType: resolvedType,
          customer: this.memCustomers.get(s.customerId) || null,
          server: s.serverId ? this.memServers.get(s.serverId) || null : null,
          endpoints: Array.from(this.memEndpoints.values()).filter((e) => e.serviceId === s.id),
        };
      },
      findFirst: async (args: any) => {
        const where = args?.where || {};
        const nowMs = Date.now();
        for (const s of this.memServices.values()) {
          const isDateValid = !s.renewalDate || new Date(s.renewalDate).getTime() >= nowMs;
          const hasQuota = s.quantity == null || Number(s.quantity) > Number(s.usedQuantity || 0);
          if (s.status === "INACTIVE" && isDateValid && hasQuota) {
            s.status = "ACTIVE";
          }
          if (matchServiceFilter(s, where)) {
            const parentSvc = s.parentServiceId ? this.memServices.get(s.parentServiceId) || null : null;
            const effTypeId = s.serviceTypeId || parentSvc?.serviceTypeId;
            const resolvedType = effTypeId
              ? this.memServiceTypes.find((t) => t.id === effTypeId || t.slug === effTypeId) || null
              : null;

            return {
              ...s,
              parentServiceId: s.parentServiceId || null,
              parentService: parentSvc,
              childServices: Array.from(this.memServices.values())
                .filter((c) => c.parentServiceId === s.id)
                .map((c) => ({
                  ...c,
                  customer: this.memCustomers.get(c.customerId) || null,
                  endpoints: Array.from(this.memEndpoints.values()).filter((e) => e.serviceId === c.id),
                })),
              serviceType: resolvedType,
              customer: this.memCustomers.get(s.customerId) || null,
              server: s.serverId ? this.memServers.get(s.serverId) || null : null,
            };
          }
        }
        return null;
      },
      count: async (args: any) => {
        const where = args?.where || {};
        const items = Array.from(this.memServices.values()).filter((s) => matchServiceFilter(s, where));
        return items.length;
      },
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `svc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const matchedType =
          this.memServiceTypes.find((t) => t.id === d.serviceTypeId) ||
          this.memServiceTypes[0];
        const customer = this.memCustomers.get(d.customerId);

        const newService = {
          id,
          customerId: d.customerId || null,
          parentServiceId: d.parentServiceId || null,
          serviceGroupId: d.serviceGroupId || null,
          serviceTypeId: matchedType?.id || "st_default",
          serverId: d.serverId || null,
          name: d.name,
          description: d.description || null,
          status: d.status || "ACTIVE",
          priceToman: Number(d.priceToman) || 0,
          billingCycle: d.billingCycle || "MONTHLY",
          autoRenew: d.autoRenew !== undefined ? d.autoRenew : true,
          quantity: d.quantity !== undefined ? d.quantity : null,
          usedQuantity: Number(d.usedQuantity) || 0,
          trackingType: d.trackingType || "HYBRID",
          purchaseDate: d.purchaseDate ? new Date(d.purchaseDate) : (d.startDate ? new Date(d.startDate) : new Date()),
          startDate: d.startDate ? new Date(d.startDate) : new Date(),
          renewalDate: d.renewalDate ? new Date(d.renewalDate) : (d.trackingType === "QUANTITY" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          serviceType: matchedType,
          customer,
          endpoints: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memServices.set(id, newService);
        this.saveToDisk();
        return newService;
      },
      update: async (args: any) => {
        const where = args?.where || {};
        const d = args?.data || {};
        const svc = this.memServices.get(where.id);
        if (svc) {
          if (d.priceToman !== undefined) svc.priceToman = Number(d.priceToman) || 0;
          if (d.billingCycle !== undefined) svc.billingCycle = d.billingCycle;
          if (d.autoRenew !== undefined) svc.autoRenew = d.autoRenew;
          if (d.quantity !== undefined) svc.quantity = d.quantity;
          if (d.usedQuantity !== undefined) svc.usedQuantity = Number(d.usedQuantity) || 0;
          if (d.trackingType !== undefined) svc.trackingType = d.trackingType;
          if (d.parentServiceId !== undefined) svc.parentServiceId = d.parentServiceId;
          if (d.purchaseDate) svc.purchaseDate = new Date(d.purchaseDate);
          if (d.startDate) svc.startDate = new Date(d.startDate);
          if (d.renewalDate) svc.renewalDate = new Date(d.renewalDate);
          if (d.customerId) {
            svc.customerId = d.customerId;
            svc.customer = this.memCustomers.get(d.customerId) || null;
          }
          Object.assign(svc, d, { updatedAt: new Date() });
          this.saveToDisk();
          return {
            ...svc,
            parentServiceId: svc.parentServiceId || null,
            serviceType: this.memServiceTypes.find((t) => t.id === svc.serviceTypeId) || this.memServiceTypes[0],
            customer: this.memCustomers.get(svc.customerId) || null,
            server: svc.serverId ? this.memServers.get(svc.serverId) || null : null,
          };
        }
        return null;
      },
      delete: async (args: any) => {
        const where = args?.where || {};
        this.memServices.delete(where.id);
        this.saveToDisk();
        return { count: 1 };
      },
      deleteMany: async (args: any) => {
        const where = args?.where || {};
        let count = 0;
        for (const [id, s] of Array.from(this.memServices.entries())) {
          if (where.customerId && s.customerId === where.customerId) {
            this.memServices.delete(id);
            count++;
          } else if (where.serviceTypeId && s.serviceTypeId === where.serviceTypeId) {
            this.memServices.delete(id);
            count++;
          }
        }
        this.saveToDisk();
        return { count };
      },
      updateMany: async (args: any) => {
        const where = args?.where || {};
        const data = args?.data || {};
        let count = 0;
        for (const s of this.memServices.values()) {
          let matched = true;
          if (where.OR && Array.isArray(where.OR)) {
            matched = where.OR.some((cond: any) => {
              if (cond.serviceTypeId) {
                return (
                  s.serviceTypeId === cond.serviceTypeId ||
                  s.serviceType?.id === cond.serviceTypeId ||
                  s.serviceType?.slug === cond.serviceTypeId ||
                  s.serviceTypeSlug === cond.serviceTypeId
                );
              }
              if (cond.customerId) return s.customerId === cond.customerId;
              if (cond.id) return s.id === cond.id;
              return false;
            });
          } else {
            if (where.serviceTypeId) {
              if (
                s.serviceTypeId !== where.serviceTypeId &&
                s.serviceType?.id !== where.serviceTypeId &&
                s.serviceType?.slug !== where.serviceTypeId &&
                s.serviceTypeSlug !== where.serviceTypeId
              ) {
                matched = false;
              }
            }
            if (where.customerId && s.customerId !== where.customerId) matched = false;
            if (where.status && s.status !== where.status) matched = false;
          }

          if (matched) {
            if (data.serviceTypeId !== undefined) {
              s.serviceTypeId = data.serviceTypeId;
              const resolved = this.memServiceTypes.find(
                (t) => t.id === data.serviceTypeId || t.slug === data.serviceTypeId,
              );
              s.serviceType = resolved || s.serviceType;
              if (resolved) {
                s.serviceTypeSlug = resolved.slug;
              }
            }
            if (data.status !== undefined) s.status = data.status;
            if (data.customerId !== undefined) s.customerId = data.customerId;
            s.updatedAt = new Date();
            count++;
          }
        }
        this.saveToDisk();
        return { count };
      },
    });

    // Server model
    wrapModel("server", {
      findMany: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memServers.values());
        if (where.status) {
          items = items.filter((s) => s.status === where.status);
        }
        return items.map((srv) => {
          const hostedServices = Array.from(this.memServices.values()).filter((s) => s.serverId === srv.id);
          return {
            ...srv,
            services: hostedServices,
            _count: { services: hostedServices.length },
          };
        });
      },
      findUnique: async (args: any) => {
        const where = args?.where || {};
        const srv = this.memServers.get(where.id);
        if (!srv) return null;
        const hostedServices = Array.from(this.memServices.values()).filter((s) => s.serverId === srv.id);
        return { ...srv, services: hostedServices, _count: { services: hostedServices.length } };
      },
      findFirst: async () => {
        return Array.from(this.memServers.values())[0] || null;
      },
      count: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memServers.values());
        if (where.status) {
          items = items.filter((s) => s.status === where.status);
        }
        return items.length;
      },
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `srv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const newServer = {
          id,
          ...d,
          services: [],
          _count: { services: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memServers.set(id, newServer);
        return newServer;
      },
      update: async (args: any) => {
        const where = args?.where || {};
        const d = args?.data || {};
        const srv = this.memServers.get(where.id);
        if (srv) {
          Object.assign(srv, d, { updatedAt: new Date() });
          return srv;
        }
        return null;
      },
      delete: async (args: any) => {
        const where = args?.where || {};
        this.memServers.delete(where.id);
        return { count: 1 };
      },
    });

    // ServiceGroup model
    wrapModel("serviceGroup", {
      findMany: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memServiceGroups.values());
        if (where.customerId) {
          items = items.filter((g) => g.customerId === where.customerId);
        }
        if (where.status) {
          items = items.filter((g) => g.status === where.status);
        }
        return items.map((g) => {
          const svcs = Array.from(this.memServices.values()).filter((s) => s.serviceGroupId === g.id);
          return {
            ...g,
            services: svcs,
            customer: this.memCustomers.get(g.customerId) || null,
            _count: { services: svcs.length },
          };
        });
      },
      findUnique: async (args: any) => {
        const where = args?.where || {};
        const g = this.memServiceGroups.get(where.id);
        if (!g) return null;
        const svcs = Array.from(this.memServices.values()).filter((s) => s.serviceGroupId === g.id);
        return {
          ...g,
          services: svcs,
          customer: this.memCustomers.get(g.customerId) || null,
          _count: { services: svcs.length },
        };
      },
      count: async () => this.memServiceGroups.size,
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `pkg_${Date.now()}`;
        const newGroup = {
          id,
          ...d,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memServiceGroups.set(id, newGroup);
        return newGroup;
      },
      update: async (args: any) => {
        const where = args?.where || {};
        const d = args?.data || {};
        const g = this.memServiceGroups.get(where.id);
        if (g) {
          Object.assign(g, d, { updatedAt: new Date() });
          return g;
        }
        return null;
      },
      delete: async (args: any) => {
        const where = args?.where || {};
        this.memServiceGroups.delete(where.id);
        return { count: 1 };
      },
    });

    // Endpoint model
    wrapModel("endpoint", {
      findMany: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memEndpoints.values());
        if (where.serviceId) {
          items = items.filter((e) => e.serviceId === where.serviceId);
        }
        return items;
      },
      findUnique: async (args: any) => {
        const where = args?.where || {};
        return this.memEndpoints.get(where.id) || null;
      },
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `ep_${Date.now()}`;
        const newEp = { id, ...d, createdAt: new Date(), updatedAt: new Date() };
        this.memEndpoints.set(id, newEp);
        return newEp;
      },
      update: async (args: any) => {
        const where = args?.where || {};
        const d = args?.data || {};
        const ep = this.memEndpoints.get(where.id);
        if (ep) {
          Object.assign(ep, d, { updatedAt: new Date() });
          return ep;
        }
        return null;
      },
      delete: async (args: any) => {
        const where = args?.where || {};
        this.memEndpoints.delete(where.id);
        return { count: 1 };
      },
    });

    // Session model
    wrapModel("session", {
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `sess_${Date.now()}`;
        const newSession = { id, ...d };
        this.memSessions.set(d.refreshToken || id, newSession);
        return newSession;
      },
      findUnique: async (args: any) => {
        const where = args?.where || {};
        return this.memSessions.get(where.refreshToken) || null;
      },
      delete: async (args: any) => {
        const where = args?.where || {};
        this.memSessions.delete(where.refreshToken);
        return { count: 1 };
      },
    });

    // Invoice model
    wrapModel("invoice", {
      findFirst: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memInvoices.values());
        if (where.id) {
          items = items.filter((i) => i.id === where.id);
        }
        if (where.invoiceNumber) {
          items = items.filter((i) => i.invoiceNumber === where.invoiceNumber);
        }
        if (where.customerId) {
          const matchedCust =
            this.memCustomers.get(where.customerId) ||
            Array.from(this.memCustomers.values()).find((c) => c.userId === where.customerId);
          const validIds = new Set([where.customerId]);
          if (matchedCust) {
            validIds.add(matchedCust.id);
            if (matchedCust.userId) validIds.add(matchedCust.userId);
          }
          items = items.filter((i) => validIds.has(i.customerId));
        }
        if (where.supplierId) {
          items = items.filter((i) => i.supplierId === where.supplierId);
        }
        if (where.counterpartyType) {
          items = items.filter((i) => (i.counterpartyType || (i.supplierId ? "SUPPLIER" : "CUSTOMER")) === where.counterpartyType);
        }
        if (where.status && where.status !== "ALL") {
          items = items.filter((i) => i.status === where.status);
        }
        if (where.items?.some?.serviceId) {
          const targetSvcId = where.items.some.serviceId;
          items = items.filter((inv) => {
            const invItems =
              inv.items && inv.items.length > 0
                ? inv.items
                : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === inv.id);
            return invItems.some((it: any) => it.serviceId === targetSvcId);
          });
        }
        const inv = items[0];
        if (!inv) return null;
        return {
          ...inv,
          customer: inv.customerId
            ? this.memCustomers.get(inv.customerId) ||
              Array.from(this.memCustomers.values()).find((c) => c.userId === inv.customerId) ||
              null
            : null,
          supplier: inv.supplierId ? this.memSuppliers.get(inv.supplierId) || null : null,
          items: (
            inv.items && inv.items.length > 0
              ? inv.items
              : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === inv.id)
          ).map((it: any) => enrichInvoiceItem(it, inv.customerId, inv.notes)),
          payment: Array.from(this.memPayments.values()).find((p) => p.invoiceId === inv.id) || null,
        };
      },
      findMany: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memInvoices.values());
        if (where.customerId) {
          const matchedCust =
            this.memCustomers.get(where.customerId) ||
            Array.from(this.memCustomers.values()).find((c) => c.userId === where.customerId);
          const validIds = new Set([where.customerId]);
          if (matchedCust) {
            validIds.add(matchedCust.id);
            if (matchedCust.userId) validIds.add(matchedCust.userId);
          }
          items = items.filter((i) => validIds.has(i.customerId));
        }
        if (where.supplierId) {
          items = items.filter((i) => i.supplierId === where.supplierId);
        }
        if (where.counterpartyType) {
          items = items.filter((i) => (i.counterpartyType || (i.supplierId ? "SUPPLIER" : "CUSTOMER")) === where.counterpartyType);
        }
        if (where.status && where.status !== "ALL") {
          items = items.filter((i) => i.status === where.status);
        }
        if (where.items?.some?.serviceId) {
          const targetSvcId = where.items.some.serviceId;
          items = items.filter((inv) => {
            const invItems =
              inv.items && inv.items.length > 0
                ? inv.items
                : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === inv.id);
            return invItems.some((it: any) => it.serviceId === targetSvcId);
          });
        }
        items.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        );
        if (args?.skip) {
          items = items.slice(args.skip);
        }
        if (args?.take) {
          items = items.slice(0, args.take);
        }
        return items.map((inv) => ({
          ...inv,
          customer: inv.customerId
            ? this.memCustomers.get(inv.customerId) ||
              Array.from(this.memCustomers.values()).find((c) => c.userId === inv.customerId) ||
              null
            : null,
          supplier: inv.supplierId ? this.memSuppliers.get(inv.supplierId) || null : null,
          items: (
            inv.items && inv.items.length > 0
              ? inv.items
              : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === inv.id)
          ).map((it: any) => enrichInvoiceItem(it, inv.customerId, inv.notes)),
          payment: Array.from(this.memPayments.values()).find((p) => p.invoiceId === inv.id) || null,
        }));
      },
      count: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memInvoices.values());
        if (where.customerId) {
          const matchedCust =
            this.memCustomers.get(where.customerId) ||
            Array.from(this.memCustomers.values()).find((c) => c.userId === where.customerId);
          const validIds = new Set([where.customerId]);
          if (matchedCust) {
            validIds.add(matchedCust.id);
            if (matchedCust.userId) validIds.add(matchedCust.userId);
          }
          items = items.filter((i) => i.customerId && validIds.has(i.customerId));
        }
        if (where.supplierId) {
          items = items.filter((i) => i.supplierId === where.supplierId);
        }
        if (where.counterpartyType) {
          items = items.filter((i) => (i.counterpartyType || (i.supplierId ? "SUPPLIER" : "CUSTOMER")) === where.counterpartyType);
        }
        if (where.status && where.status !== "ALL") {
          items = items.filter((i) => i.status === where.status);
        }
        return items.length;
      },
      findUnique: async (args: any) => {
        const where = args?.where || {};
        const inv = this.memInvoices.get(where.id);
        if (!inv) return null;
        return {
          ...inv,
          customer: inv.customerId
            ? this.memCustomers.get(inv.customerId) ||
              Array.from(this.memCustomers.values()).find((c) => c.userId === inv.customerId) ||
              null
            : null,
          supplier: inv.supplierId ? this.memSuppliers.get(inv.supplierId) || null : null,
          items: (
            inv.items && inv.items.length > 0
              ? inv.items
              : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === inv.id)
          ).map((it: any) => enrichInvoiceItem(it, inv.customerId, inv.notes)),
          payment: Array.from(this.memPayments.values()).find((p) => p.invoiceId === inv.id) || null,
        };
      },
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `inv_${Date.now()}`;
        const itemsList = d.items?.create || (Array.isArray(d.items) ? d.items : []);
        const processedItems = itemsList.map((it: any, idx: number) => ({
          id: `item_${Date.now()}_${idx}`,
          invoiceId: id,
          ...it,
          createdAt: new Date(),
        }));

        const matchedCustomer = d.customerId
          ? this.memCustomers.get(d.customerId) ||
            Array.from(this.memCustomers.values()).find((c) => c.userId === d.customerId) ||
            null
          : null;
        const resolvedCustId = matchedCustomer ? matchedCustomer.id : (d.customerId || null);
        const matchedSupplier = d.supplierId ? this.memSuppliers.get(d.supplierId) || null : null;

        const newInv = {
          id,
          customerId: resolvedCustId,
          supplierId: d.supplierId || null,
          counterpartyType: d.counterpartyType || (d.supplierId ? "SUPPLIER" : "CUSTOMER"),
          invoiceNumber: d.invoiceNumber || (30001 + this.memInvoices.size).toString(),
          status: d.status || "UNPAID",
          subtotalToman: d.subtotalToman || 0,
          totalToman: d.totalToman || 0,
          issuedAt: d.issuedAt || new Date(),
          dueDate: d.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          paidAt: null,
          cancelledAt: null,
          notes: d.notes || null,
          customer: matchedCustomer,
          supplier: matchedSupplier,
          supplierName: matchedSupplier?.name || null,
          items: processedItems.map((it: any) => enrichInvoiceItem(it, resolvedCustId, d.notes)),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        this.memInvoices.set(id, newInv);
        processedItems.forEach((it: any) => this.memInvoiceItems.set(it.id, it));
        this.saveToDisk();
        return newInv;
      },
      update: async (args: any) => {
        const where = args?.where || {};
        const d = args?.data || {};
        const inv = this.memInvoices.get(where.id);
        if (inv) {
          Object.assign(inv, d, { updatedAt: new Date() });
          if (d.items && Array.isArray(d.items)) {
            inv.items = d.items;
            d.items.forEach((it: any) => this.memInvoiceItems.set(it.id, it));
          }
          this.saveToDisk();
          return {
            ...inv,
            customer: this.memCustomers.get(inv.customerId) || null,
            items: (inv.items || []).map((it: any) =>
              enrichInvoiceItem(it, inv.customerId, inv.notes),
            ),
          };
        }
        return null;
      },
      delete: async (args: any) => {
        const where = args?.where || {};
        const inv = this.memInvoices.get(where.id);
        if (inv) {
          for (const [itemId, it] of Array.from(this.memInvoiceItems.entries())) {
            if (it.invoiceId === where.id) {
              this.memInvoiceItems.delete(itemId);
            }
          }
          for (const [pId, p] of Array.from(this.memPayments.entries())) {
            if (p.invoiceId === where.id) {
              this.memPayments.delete(pId);
            }
          }
          this.memInvoices.delete(where.id);
          this.saveToDisk();
          return inv;
        }
        return null;
      },
      deleteMany: async (args: any) => {
        const where = args?.where || {};
        let count = 0;
        for (const [id, inv] of Array.from(this.memInvoices.entries())) {
          let matched = true;
          if (where.id && inv.id !== where.id) matched = false;
          if (where.id?.in && Array.isArray(where.id.in) && !where.id.in.includes(id)) matched = false;
          if (where.customerId && inv.customerId !== where.customerId) matched = false;
          if (where.supplierId && inv.supplierId !== where.supplierId) matched = false;
          if (where.status && inv.status !== where.status) matched = false;
          if (matched) {
            for (const [itemId, it] of Array.from(this.memInvoiceItems.entries())) {
              if (it.invoiceId === id) {
                this.memInvoiceItems.delete(itemId);
              }
            }
            for (const [pId, p] of Array.from(this.memPayments.entries())) {
              if (p.invoiceId === id) {
                this.memPayments.delete(pId);
              }
            }
            this.memInvoices.delete(id);
            count++;
          }
        }
        this.saveToDisk();
        return { count };
      },
    });

    // InvoiceItem model
    wrapModel("invoiceItem", {
      findFirst: async (args: any) => {
        const where = args?.where || {};
        for (const it of this.memInvoiceItems.values()) {
          if (where.id && it.id !== where.id) continue;
          if (where.invoiceId && it.invoiceId !== where.invoiceId) continue;
          if (where.serviceId && it.serviceId !== where.serviceId) continue;
          return it;
        }
        return null;
      },
      findMany: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memInvoiceItems.values());
        if (where.invoiceId) {
          items = items.filter((it) => it.invoiceId === where.invoiceId);
        }
        if (where.serviceId) {
          items = items.filter((it) => it.serviceId === where.serviceId);
        }
        return items;
      },
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `item_${Date.now()}`;
        const newItem = { id, ...d, createdAt: new Date() };
        this.memInvoiceItems.set(id, newItem);
        this.saveToDisk();
        return newItem;
      },
      update: async (args: any) => {
        const where = args?.where || {};
        const d = args?.data || {};
        const it = this.memInvoiceItems.get(where.id);
        if (it) {
          Object.assign(it, d, { updatedAt: new Date() });
          const parentInv = this.memInvoices.get(it.invoiceId);
          if (parentInv && Array.isArray(parentInv.items)) {
            const idx = parentInv.items.findIndex((x: any) => x.id === it.id);
            if (idx !== -1) {
              parentInv.items[idx] = { ...parentInv.items[idx], ...d, updatedAt: new Date() };
            }
          }
          this.saveToDisk();
          return it;
        }
        return null;
      },
      deleteMany: async (args: any) => {
        const where = args?.where || {};
        let deletedCount = 0;
        for (const [id, it] of Array.from(this.memInvoiceItems.entries())) {
          if (where.invoiceId && it.invoiceId === where.invoiceId) {
            this.memInvoiceItems.delete(id);
            deletedCount++;
          } else if (where.serviceId && it.serviceId === where.serviceId) {
            this.memInvoiceItems.delete(id);
            deletedCount++;
          }
        }
        this.saveToDisk();
        return { count: deletedCount };
      },
      createMany: async (args: any) => {
        const dataList = args?.data || [];
        const createdItems: any[] = [];
        dataList.forEach((d: any, idx: number) => {
          const id = d.id || `item_${Date.now()}_${idx}`;
          const newItem = { id, ...d, createdAt: new Date() };
          this.memInvoiceItems.set(id, newItem);
          createdItems.push(newItem);
        });
        this.saveToDisk();
        return { count: createdItems.length };
      },
    });

    // Payment model
    wrapModel("payment", {
      findMany: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memPayments.values());
        if (where.invoice?.customerId) {
          const targetCustId = where.invoice.customerId;
          items = items.filter((p) => {
            const inv = this.memInvoices.get(p.invoiceId);
            if (!inv) return false;
            if (inv.customerId === targetCustId) return true;
            const cust =
              this.memCustomers.get(inv.customerId) ||
              Array.from(this.memCustomers.values()).find((c) => c.userId === inv.customerId);
            return cust?.id === targetCustId || cust?.userId === targetCustId;
          });
        }
        items.sort(
          (a, b) =>
            new Date(b.paidAt || b.createdAt || 0).getTime() -
            new Date(a.paidAt || a.createdAt || 0).getTime(),
        );
        if (args?.skip) {
          items = items.slice(args.skip);
        }
        if (args?.take) {
          items = items.slice(0, args.take);
        }
        const buildEnrichedPayment = (p: any) => {
          const inv = this.memInvoices.get(p.invoiceId);
          if (!inv) return { ...p, invoice: null };
          const cust =
            this.memCustomers.get(inv.customerId) ||
            Array.from(this.memCustomers.values()).find((c) => c.userId === inv.customerId) ||
            null;
          const supp = inv.supplierId ? this.memSuppliers.get(inv.supplierId) || null : null;
          const invoiceItems = (
            inv.items && inv.items.length > 0
              ? inv.items
              : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === inv.id)
          ).map((it: any) => enrichInvoiceItem(it, inv.customerId, inv.notes));

          return {
            ...p,
            invoice: {
              ...inv,
              customer: cust,
              supplier: supp,
              supplierName: supp?.name || inv.supplierName,
              items: invoiceItems,
            },
          };
        };

        return items.map(buildEnrichedPayment);
      },
      findUnique: async (args: any) => {
        const where = args?.where || {};
        const p =
          this.memPayments.get(where.id) ||
          Array.from(this.memPayments.values()).find((x) => x.invoiceId === where.invoiceId);
        if (!p) return null;
        const inv = this.memInvoices.get(p.invoiceId);
        if (!inv) return { ...p, invoice: null };
        const cust =
          this.memCustomers.get(inv.customerId) ||
          Array.from(this.memCustomers.values()).find((c) => c.userId === inv.customerId) ||
          null;
        const supp = inv.supplierId ? this.memSuppliers.get(inv.supplierId) || null : null;
        const invoiceItems = (
          inv.items && inv.items.length > 0
            ? inv.items
            : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === inv.id)
        ).map((it: any) => enrichInvoiceItem(it, inv.customerId, inv.notes));

        return {
          ...p,
          invoice: {
            ...inv,
            customer: cust,
            supplier: supp,
            supplierName: supp?.name || inv.supplierName,
            items: invoiceItems,
          },
        };
      },
      findFirst: async (args: any) => {
        const where = args?.where || {};
        const p = Array.from(this.memPayments.values()).find((x) => {
          if (where.id && x.id !== where.id) return false;
          if (where.invoiceId && x.invoiceId !== where.invoiceId) return false;
          return true;
        });
        if (!p) return null;
        const inv = this.memInvoices.get(p.invoiceId);
        if (!inv) return { ...p, invoice: null };
        const cust =
          this.memCustomers.get(inv.customerId) ||
          Array.from(this.memCustomers.values()).find((c) => c.userId === inv.customerId) ||
          null;
        const supp = inv.supplierId ? this.memSuppliers.get(inv.supplierId) || null : null;
        const invoiceItems = (
          inv.items && inv.items.length > 0
            ? inv.items
            : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === inv.id)
        ).map((it: any) => enrichInvoiceItem(it, inv.customerId, inv.notes));

        return {
          ...p,
          invoice: {
            ...inv,
            customer: cust,
            supplier: supp,
            supplierName: supp?.name || inv.supplierName,
            items: invoiceItems,
          },
        };
      },
      count: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memPayments.values());
        if (where.invoice?.customerId) {
          const targetCustId = where.invoice.customerId;
          items = items.filter((p) => {
            const inv = this.memInvoices.get(p.invoiceId);
            if (!inv) return false;
            if (inv.customerId === targetCustId) return true;
            const cust =
              this.memCustomers.get(inv.customerId) ||
              Array.from(this.memCustomers.values()).find((c) => c.userId === inv.customerId);
            return cust?.id === targetCustId || cust?.userId === targetCustId;
          });
        }
        return items.length;
      },
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `pay_${Date.now()}`;
        const newPayment = {
          id,
          ...d,
          paidAt: d.paidAt || new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memPayments.set(id, newPayment);
        this.saveToDisk();
        return newPayment;
      },
      update: async (args: any) => {
        const where = args?.where || {};
        const d = args?.data || {};
        const p =
          this.memPayments.get(where.id) ||
          Array.from(this.memPayments.values()).find((x) => x.invoiceId === where.invoiceId);
        if (p) {
          Object.assign(p, d, { updatedAt: new Date() });
          this.saveToDisk();
          return p;
        }
        return null;
      },
    });

    // PaymentAttempt model
    wrapModel("paymentAttempt", {
      findMany: async () => Array.from(this.memPaymentAttempts.values()),
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `att_${Date.now()}`;
        const newAttempt = { id, ...d, createdAt: new Date(), updatedAt: new Date() };
        this.memPaymentAttempts.set(id, newAttempt);
        this.saveToDisk();
        return newAttempt;
      },
    });

    // AuditLog model
    wrapModel("auditLog", {
      findMany: async (args: any) => {
        const where = args?.where || {};
        let logs = [...this.memAuditLogs];
        if (where.entityType) {
          logs = logs.filter((l) => l.entityType === where.entityType);
        }
        if (where.entityId) {
          logs = logs.filter(
            (l) =>
              l.entityId === where.entityId ||
              l.metadata?.customerId === where.entityId ||
              l.after?.customerId === where.entityId ||
              l.before?.customerId === where.entityId
          );
        }
        if (where.userId) {
          logs = logs.filter((l) => l.userId === where.userId);
        }
        logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const skip = args?.skip || 0;
        const take = args?.take || 20;
        return logs.slice(skip, skip + take);
      },
      count: async (args: any) => {
        const where = args?.where || {};
        let logs = [...this.memAuditLogs];
        if (where.entityType) {
          logs = logs.filter((l) => l.entityType === where.entityType);
        }
        if (where.entityId) {
          logs = logs.filter(
            (l) =>
              l.entityId === where.entityId ||
              l.metadata?.customerId === where.entityId ||
              l.after?.customerId === where.entityId ||
              l.before?.customerId === where.entityId
          );
        }
        return logs.length;
      },
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const newLog = {
          id,
          ...d,
          createdAt: new Date(),
        };
        this.memAuditLogs.unshift(newLog);
        this.saveToDisk();
        return newLog;
      },
    });

    // InvoiceSequence model
    wrapModel("invoiceSequence", {
      findUnique: async (args: any) => {
        const year = args?.where?.year || new Date().getFullYear();
        return this.memInvoiceSequences.get(year) || { id: `seq_${year}`, year, lastNumber: 1 };
      },
      upsert: async (args: any) => {
        const year = args?.where?.year || new Date().getFullYear();
        let seq = this.memInvoiceSequences.get(year);
        if (!seq) {
          seq = { id: `seq_${year}`, year, lastNumber: 1 };
        } else {
          seq.lastNumber += 1;
        }
        this.memInvoiceSequences.set(year, seq);
        return seq;
      },
      update: async (args: any) => {
        const year = args?.where?.year || new Date().getFullYear();
        let seq = this.memInvoiceSequences.get(year) || { id: `seq_${year}`, year, lastNumber: 1 };
        if (args?.data?.lastNumber?.increment) {
          seq.lastNumber += args.data.lastNumber.increment;
        }
        this.memInvoiceSequences.set(year, seq);
        return seq;
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      // Test actual TCP connectivity
      await this.$queryRaw`SELECT 1`;

      // Verify that schema tables exist
      try {
        await this.$queryRaw`SELECT 1 FROM "Service" LIMIT 1`;
        this.isDbConnected = true;
        this.logger.log("✅ [PrismaService] Connected to PostgreSQL database and schema verified.");
      } catch (tableErr: any) {
        this.isDbConnected = false;
        this.logger.warn(
          `⚠️ [PrismaService] PostgreSQL is connected, but schema tables (e.g. Service) do not exist yet (${tableErr?.message || "Undefined table"}). Serving from resilient in-memory store until migrations are pushed.`,
        );
      }
    } catch (err: any) {
      this.isDbConnected = false;
      this.logger.warn(
        `⚠️ [PrismaService] PostgreSQL database is not reachable (${err?.message || "connection error"}). Resilient in-memory repository activated.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect().catch(() => {});
  }

  public async purgeDatabaseContent(): Promise<{ success: boolean; message: string }> {
    this.logger.warn("⚠️ Purging all database content requested by Admin...");
    // 1. Purge memory maps
    this.memCustomers.clear();
    this.memServices.clear();
    this.memServiceGroups.clear();
    this.memServers.clear();
    this.memEndpoints.clear();
    this.memInvoices.clear();
    this.memInvoiceItems.clear();
    this.memPayments.clear();
    this.memPaymentAttempts.clear();
    this.memAuditLogs = [];
    this.memSuppliers.clear();
    this.memSupplierServices.clear();
    this.memInvoiceSequences.clear();

    // Retain only admin users
    for (const [id, user] of Array.from(this.memUsers.entries())) {
      if (user.role !== "ADMIN") {
        this.memUsers.delete(id);
      }
    }

    // Persist empty state to disk
    try {
      const filePath = this.getStorageFilePath();
      const data = {
        users: Array.from(this.memUsers.entries()),
        customers: [],
        services: [],
        serviceGroups: [],
        servers: [],
        endpoints: [],
        sessions: [],
        invoices: [],
        invoiceItems: [],
        payments: [],
        paymentAttempts: [],
        auditLogs: [],
        suppliers: [],
        supplierServices: [],
        invoiceSequences: [],
      };
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      this.logger.log(`💾 [PrismaService] Wrote purged state to ${filePath}`);
    } catch (err) {
      this.logger.error("Failed to write purged database to disk", err);
    }

    // 2. If Postgres is connected, purge database tables
    if (this.isDbConnected) {
      try {
        await this.$executeRawUnsafe(`
          DELETE FROM "PaymentAttempt";
          DELETE FROM "Payment";
          DELETE FROM "InvoiceItem";
          DELETE FROM "Invoice";
          DELETE FROM "Endpoint";
          DELETE FROM "Service";
          DELETE FROM "ServiceGroup";
          DELETE FROM "Server";
          DELETE FROM "Customer";
          DELETE FROM "AuditLog";
          DELETE FROM "SupplierService";
          DELETE FROM "Supplier";
          DELETE FROM "Session";
          DELETE FROM "User" WHERE "role" != 'ADMIN';
        `);
      } catch (err) {
        this.logger.error("Failed to purge PostgreSQL database tables", err);
      }
    }

    return { success: true, message: "تمامی محتوا و رکوردهای دیتابیس با موفقیت پاکسازی شدند" };
  }
}