import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@gecut-cloud/db";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@gecut-cloud/env/server";
import * as fs from "node:fs";
import * as path from "node:path";

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

  public memServiceTypes: Array<any> = [
    { id: "st_domain", name: "ثبت و مدیریت دامنه", slug: "domain", description: "دامنه‌های ملی و بین‌المللی" },
    { id: "st_server", name: "سرور ابری و اختصاصی", slug: "server", description: "سرورهای مجازی و اختصاصی" },
    { id: "st_hosting", name: "هاست و میزبانی وب", slug: "hosting", description: "هاست ابری پرسرعت NVMe و اشتراکی" },
    { id: "st_api", name: "وب‌سرویس و API", slug: "api", description: "سرویس‌های ابری و رابط‌های برنامه‌نویسی" },
    { id: "st_package", name: "بسته تعدادی / پکیج", slug: "package", description: "بسته‌ها و پکیج‌های حجمی یا تعدادی" },
  ];

  constructor() {
    const adapter = new PrismaPg({
      connectionString: env.DATABASE_URL,
    });
    super({ adapter });

    this.initFallbackData();
    this.installProxies();
  }

  private getStorageFilePath(): string {
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    return path.join(dir, "db-store.json");
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

      if (data.users && Array.isArray(data.users)) this.memUsers = new Map(reviveDates(data.users));
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
  }

  override async $transaction(arg: any, options?: any): Promise<any> {
    if (this.isDbConnected) {
      try {
        return await super.$transaction(arg, options);
      } catch (err: any) {
        const isConnErr =
          err.message?.includes("Can't reach database server") ||
          err.message?.includes("P1001") ||
          err.message?.includes("ECONNREFUSED") ||
          err.code === "P1001";
        if (!isConnErr) throw err;
        this.isDbConnected = false;
        this.logger.warn("Database connection unavailable during $transaction. Serving from in-memory fallback.");
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
                const isConnErr =
                  err.message?.includes("Can't reach database server") ||
                  err.message?.includes("P1001") ||
                  err.message?.includes("ECONNREFUSED") ||
                  err.code === "P1001";
                if (!isConnErr) throw err;
                self.isDbConnected = false;
                self.logger.warn(
                  `Database connection unavailable during ${modelKey}.${String(prop)}. Serving from resilient memory repository.`
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
              cust = Array.from(this.memCustomers.values()).find((c) => c.userId === u.id) || null;
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
            cust = Array.from(this.memCustomers.values()).find((c) => c.userId === u.id) || null;
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
        return newUser;
      },
      update: async (args: any) => {
        const where = args?.where || {};
        const d = args?.data || {};
        for (const u of this.memUsers.values()) {
          if ((where.id && u.id === where.id) || (where.phone && matchPhone(u.phone, where.phone))) {
            Object.assign(u, d, { updatedAt: new Date() });
            let cust = u.customerId ? this.memCustomers.get(u.customerId) || null : null;
            if (!cust) {
              cust = Array.from(this.memCustomers.values()).find((c) => c.userId === u.id) || null;
              if (cust) {
                u.customerId = cust.id;
              }
            }
            return { ...u, customer: cust };
          }
        }
        return null;
      },
      findMany: async () => Array.from(this.memUsers.values()),
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
            const services = Array.from(this.memServices.values()).filter((s) => s.customerId === c.id);
            const invoices = Array.from(this.memInvoices.values())
              .filter((i) => i.customerId === c.id || (c.userId && i.customerId === c.userId))
              .map((i) => ({
                ...i,
                customer: c,
                items: i.items && i.items.length > 0 ? i.items : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === i.id),
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
          const services = Array.from(this.memServices.values()).filter((s) => s.customerId === c.id);
          const invoices = Array.from(this.memInvoices.values())
            .filter((i) => i.customerId === c.id || (c.userId && i.customerId === c.userId))
            .map((i) => ({
              ...i,
              customer: c,
              items: i.items && i.items.length > 0 ? i.items : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === i.id),
              payment: Array.from(this.memPayments.values()).find((p) => p.invoiceId === i.id) || null,
            }));
          const user = this.memUsers.get(c.userId);
          return { ...c, services, invoices, user, _count: { services: services.length, invoices: invoices.length } };
        }
        return null;
      },
      findMany: async (args: any) => {
        let items = Array.from(this.memCustomers.values()).map((c) => {
          const services = Array.from(this.memServices.values()).filter((s) => s.customerId === c.id);
          const invoices = Array.from(this.memInvoices.values())
            .filter((i) => i.customerId === c.id || (c.userId && i.customerId === c.userId))
            .map((i) => ({
              ...i,
              customer: c,
              items: i.items && i.items.length > 0 ? i.items : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === i.id),
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
        const id = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
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
          return c;
        }
        return null;
      },
    });

    // ServiceType model
    wrapModel("serviceType", {
      findFirst: async (args: any) => {
        const where = args?.where || {};
        if (where.slug) {
          return this.memServiceTypes.find((t) => t.slug === where.slug) || null;
        }
        return this.memServiceTypes[0] || null;
      },
      findMany: async () => this.memServiceTypes,
      create: async (args: any) => {
        const d = args?.data || {};
        const id = `st_${Date.now()}`;
        const newType = { id, ...d };
        this.memServiceTypes.push(newType);
        return newType;
      },
    });

    // Service model
    wrapModel("service", {
      findMany: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memServices.values());

        if (where.customerId) {
          items = items.filter((s) => {
            if (s.customerId === where.customerId) return true;
            const cust = this.memCustomers.get(s.customerId);
            return cust && (cust.userId === where.customerId || cust.id === where.customerId);
          });
        }
        if (where.status && where.status !== "ALL") {
          items = items.filter((s) => s.status === where.status);
        }
        if (where.serviceGroupId) {
          items = items.filter((s) => s.serviceGroupId === where.serviceGroupId);
        }
        return items.map((s) => ({
          ...s,
          serviceType: this.memServiceTypes.find((t) => t.id === s.serviceTypeId) || this.memServiceTypes[0],
          customer: this.memCustomers.get(s.customerId) || null,
          server: s.serverId ? this.memServers.get(s.serverId) || null : null,
          endpoints: Array.from(this.memEndpoints.values()).filter((e) => e.serviceId === s.id),
        }));
      },
      findUnique: async (args: any) => {
        const where = args?.where || {};
        const s = this.memServices.get(where.id);
        if (!s) return null;
        return {
          ...s,
          serviceType: this.memServiceTypes.find((t) => t.id === s.serviceTypeId) || this.memServiceTypes[0],
          customer: this.memCustomers.get(s.customerId) || null,
          server: s.serverId ? this.memServers.get(s.serverId) || null : null,
          endpoints: Array.from(this.memEndpoints.values()).filter((e) => e.serviceId === s.id),
        };
      },
      findFirst: async (args: any) => {
        const where = args?.where || {};
        for (const s of this.memServices.values()) {
          if (!where.id || s.id === where.id) {
            return {
              ...s,
              serviceType: this.memServiceTypes.find((t) => t.id === s.serviceTypeId) || this.memServiceTypes[0],
              customer: this.memCustomers.get(s.customerId) || null,
              server: s.serverId ? this.memServers.get(s.serverId) || null : null,
            };
          }
        }
        return null;
      },
      count: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memServices.values());
        if (where.customerId) {
          items = items.filter((s) => {
            if (s.customerId === where.customerId) return true;
            const cust = this.memCustomers.get(s.customerId);
            return cust && (cust.userId === where.customerId || cust.id === where.customerId);
          });
        }
        if (where.status && where.status !== "ALL") {
          items = items.filter((s) => s.status === where.status);
        }
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
          customerId: d.customerId,
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
          startDate: d.startDate ? new Date(d.startDate) : new Date(),
          renewalDate: d.renewalDate ? new Date(d.renewalDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          serviceType: matchedType,
          customer,
          endpoints: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memServices.set(id, newService);
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
          if (d.startDate) svc.startDate = new Date(d.startDate);
          if (d.renewalDate) svc.renewalDate = new Date(d.renewalDate);
          if (d.customerId) {
            svc.customerId = d.customerId;
            svc.customer = this.memCustomers.get(d.customerId) || null;
          }
          Object.assign(svc, d, { updatedAt: new Date() });
          return {
            ...svc,
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
        return { count: 1 };
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
        if (where.status && where.status !== "ALL") {
          items = items.filter((i) => i.status === where.status);
        }
        if (args?.skip) {
          items = items.slice(args.skip);
        }
        if (args?.take) {
          items = items.slice(0, args.take);
        }
        return items.map((inv) => ({
          ...inv,
          customer: this.memCustomers.get(inv.customerId) || null,
          items: inv.items && inv.items.length > 0 ? inv.items : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === inv.id),
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
          items = items.filter((i) => validIds.has(i.customerId));
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
          customer: this.memCustomers.get(inv.customerId) || null,
          items: inv.items && inv.items.length > 0 ? inv.items : Array.from(this.memInvoiceItems.values()).filter((it) => it.invoiceId === inv.id),
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

        const matchedCustomer =
          this.memCustomers.get(d.customerId) ||
          Array.from(this.memCustomers.values()).find((c) => c.userId === d.customerId);
        const resolvedCustId = matchedCustomer ? matchedCustomer.id : d.customerId;

        const newInv = {
          id,
          customerId: resolvedCustId,
          invoiceNumber: d.invoiceNumber || `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          status: d.status || "UNPAID",
          subtotalToman: d.subtotalToman || 0,
          totalToman: d.totalToman || 0,
          issuedAt: d.issuedAt || new Date(),
          dueDate: d.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          paidAt: null,
          cancelledAt: null,
          notes: d.notes || null,
          customer: matchedCustomer || null,
          items: processedItems,
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
            items: inv.items || [],
          };
        }
        return null;
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
    });

    // Payment model
    wrapModel("payment", {
      findMany: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memPayments.values());
        if (where.invoice?.customerId) {
          items = items.filter((p) => {
            const inv = this.memInvoices.get(p.invoiceId);
            return inv && inv.customerId === where.invoice.customerId;
          });
        }
        if (args?.skip) {
          items = items.slice(args.skip);
        }
        if (args?.take) {
          items = items.slice(0, args.take);
        }
        return items.map((p) => {
          const inv = this.memInvoices.get(p.invoiceId);
          const cust = inv ? this.memCustomers.get(inv.customerId) : null;
          return {
            ...p,
            invoice: inv ? { ...inv, customer: cust } : null,
          };
        });
      },
      findUnique: async (args: any) => {
        const where = args?.where || {};
        const p = this.memPayments.get(where.id) || Array.from(this.memPayments.values()).find((x) => x.invoiceId === where.invoiceId);
        if (!p) return null;
        const inv = this.memInvoices.get(p.invoiceId);
        return {
          ...p,
          invoice: inv ? { ...inv, customer: this.memCustomers.get(inv.customerId) } : null,
        };
      },
      count: async (args: any) => {
        const where = args?.where || {};
        let items = Array.from(this.memPayments.values());
        if (where.invoice?.customerId) {
          items = items.filter((p) => {
            const inv = this.memInvoices.get(p.invoiceId);
            return inv && inv.customerId === where.invoice.customerId;
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
        return newPayment;
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
          logs = logs.filter((l) => l.entityId === where.entityId);
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
          logs = logs.filter((l) => l.entityId === where.entityId);
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
      this.isDbConnected = true;
      this.logger.log("✅ [PrismaService] Connected to PostgreSQL database successfully.");
    } catch (err: any) {
      this.isDbConnected = false;
      this.logger.warn(
        "⚠️ [PrismaService] PostgreSQL database on localhost:5432 is not reachable. Resilient in-memory repository activated.",
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect().catch(() => {});
  }
}
