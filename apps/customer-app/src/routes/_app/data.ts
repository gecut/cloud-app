export type ServiceType = "SERVER" | "DOMAIN" | "SERVICE";

export type Service = {
  id: string;
  type: ServiceType;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  priceToman: number;
  startDate: Date;
  renewalDate: Date;
  serviceType: {
    id: string;
    name: string;
  };
};
export type Subscription = {
  title: string;
  subTitle: string;
  totalVolume: number;
  remainedVolume: number;
  buyData: Date;
  price: number;
};
export type Payments = {
  factorNumber: number;
  title: string;
  subTitle: string;
  type: ServiceType;
  factorCreated: Date;
  volume: number;
  price: number;
  paymentDeadline: Date;
  status: "paid" | "Awaiting payment";
};

export type Transaction = {
  id: string;
  name: string;
  price: number;
  date: Date;
};
export const dataTypes: {
  services: Service[];
} = {
  services: [
    {
      id: "svc_1",

      type: "DOMAIN",

      name: "وب‌سایت شرکتی",

      description: "هاست و پشتیبانی وب‌سایت اصلی شرکت",

      status: "ACTIVE",

      priceToman: 2500000,

      startDate: new Date("2026-05-01"),

      renewalDate: new Date("2026-12-01"),

      serviceType: {
        id: "srv_type_1",
        name: "Cloud Hosting",
      },
    },

    {
      id: "svc_2",

      type: "SERVICE",

      name: "سرور دانلود",

      description: "سرور اختصاصی دانلود فایل و بکاپ",

      status: "SUSPENDED",

      priceToman: 4800000,

      startDate: new Date("2026-02-15"),

      renewalDate: new Date("2026-08-15"),

      serviceType: {
        id: "srv_type_2",
        name: "Dedicated Server",
      },
    },

    {
      id: "svc_3",

      type: "DOMAIN",

      name: "اپلیکیشن فروشگاهی",

      description: "بک‌اند و دیتابیس اپلیکیشن فروشگاهی",

      status: "INACTIVE",

      priceToman: 3200000,

      startDate: new Date("2025-11-10"),

      renewalDate: new Date("2026-04-10"),

      serviceType: {
        id: "srv_type_3",
        name: "Backend API",
      },
    },

    {
      id: "svc_4",

      type: "SERVER",

      name: "پنل مدیریت",

      description: "سرویس مدیریت کاربران و احراز هویت",

      status: "ACTIVE",

      priceToman: 1800000,

      startDate: new Date("2026-01-01"),

      renewalDate: new Date("2026-10-01"),

      serviceType: {
        id: "srv_type_4",
        name: "Authentication",
      },
    },

    {
      id: "svc_5",

      type: "SERVICE",

      name: "سیستم مانیتورینگ",

      description: "مانیتورینگ سرویس‌ها و گزارش خطاها",

      status: "ACTIVE",

      priceToman: 1500000,

      startDate: new Date("2026-03-20"),

      renewalDate: new Date("2026-09-20"),

      serviceType: {
        id: "srv_type_5",
        name: "Monitoring",
      },
    },

    {
      id: "svc_6",

      type: "SERVER",

      name: "شبکه توزیع محتوا",

      description: "افزایش سرعت و امنیت فایل‌های استاتیک",

      status: "ACTIVE",

      priceToman: 900000,

      startDate: new Date("2026-04-01"),

      renewalDate: new Date("2026-11-01"),

      serviceType: {
        id: "srv_type_6",
        name: "CDN Service",
      },
    },
  ],
};

export const subscriptions: Subscription[] = [
  {
    title: "اشتراک گیمینگ",
    subTitle: "برای گیمرها و استریم",
    totalVolume: 100,
    remainedVolume: 35,
    buyData: new Date("2026-05-01"),
    price: 350000,
  },
  {
    title: "سرور مجازی اروپا",
    subTitle: "مناسب پروژه‌های بین‌المللی",
    totalVolume: 500,
    remainedVolume: 220,
    buyData: new Date("2026-04-12"),
    price: 1200000,
  },
  {
    title: "هاست دانلود",
    subTitle: "برای ذخیره و دانلود فایل‌ها",
    totalVolume: 10000,
    remainedVolume: 760,
    buyData: new Date("2026-03-08"),
    price: 780000,
  },
  {
    title: "فوتوتر",
    subTitle: "نامحدود برای استفاده عمومی",
    totalVolume: 100,
    remainedVolume: 50,
    buyData: new Date("2026-05-20"),
    price: 990000,
  },
];

export const payments: Payments[] = [
  {
    factorNumber: 1001,
    title: "بسته فوتوتیتر",
    subTitle: "پشت پرده",
    type: "DOMAIN",
    factorCreated: new Date("2026-05-01"),
    volume: 120,
    price: 450000,
    paymentDeadline: new Date("2026-05-10"),
    status: "paid",
  },
  {
    factorNumber: 1002,
    title: "اشتراک سرویس ابری",
    subTitle: "پلن پایه ذخیره‌سازی",
    type: "SERVICE",
    factorCreated: new Date("2026-05-03"),
    volume: 50,
    price: 300000,
    paymentDeadline: new Date("2026-05-12"),
    status: "Awaiting payment",
  },
  {
    factorNumber: 1003,
    title: "سرویس API",
    subTitle: "درخواست‌های ماهانه API",
    type: "SERVER",
    factorCreated: new Date("2026-05-05"),
    volume: 1000000,
    price: 1200000,
    paymentDeadline: new Date("2026-05-15"),
    status: "paid",
  },
  {
    factorNumber: 1004,
    title: "دامنه وب‌سایت",
    subTitle: "هاست اشتراکی پرسرعت",
    type: "DOMAIN",
    factorCreated: new Date("2026-05-07"),
    volume: 200,
    price: 750000,
    paymentDeadline: new Date("2026-05-18"),
    status: "Awaiting payment",
  },
  {
    factorNumber: 1005,
    title: "سرویس پشتیبانی",
    subTitle: "پشتیبانی 24/7",
    type: "SERVER",
    factorCreated: new Date("2026-05-09"),
    volume: 300,
    price: 500000,
    paymentDeadline: new Date("2026-05-20"),
    status: "paid",
  },
];
