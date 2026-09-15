export type ServiceType = "SERVER" | "DOMAIN" | "SERVICE" | "PACKAGE";

export type Service = {
  id: string;
  type: ServiceType;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  priceToman: number;
  startDate: Date;
  renewalDate: Date;
  quantity?: number;
  remainedQuantity?: number;
  billingCycle?: string;
  autoRenew?: boolean;
  serviceType: {
    id: string;
    name: string;
    slug?: string;
  };
};
export type Subscription = {
  id?: string;
  title: string;
  subTitle: string;
  totalVolume: number;
  remainedVolume: number;
  buyData: Date;
  price: number;
};
export type Payments = {
  id?: string;
  factorNumber: string | number;
  title: string;
  subTitle: string;
  type: ServiceType;
  factorCreated: Date | string;
  volume: number;
  price: number;
  paymentDeadline: Date | string;
  status: "paid" | "Awaiting payment" | "cancelled";
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
  services: [],
};

export const subscriptions: Subscription[] = [];

export const payments: Payments[] = [];
