import { Payments } from "@/routes/_app/data";
import { InvoiceCard } from "./invoice-card";

export interface InvoiceListProps {
  data: Payments[];
}

export function InvoiceList({ data }: InvoiceListProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      {data.map((payment) => {
        return <InvoiceCard data={payment} key={payment.title} />;
      })}
    </div>
  );
}
