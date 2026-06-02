import { Tabs } from "@heroui/react";
import { Factor } from "../dashboard/factor";
import { Documents } from "@solar-icons/react-perf/category/notes/Linear";
import { CardTransfer } from "@solar-icons/react-perf/category/money/LineDuotone";
import { InvoiceList } from "./payment/invoice-list";
import { payments } from "@/routes/_app/data";
import { Transactions } from "./transactions/transaction";

export function Payments() {
  return (
    <div className="w-full flex flex-col gap-2 p-0">
      <Factor price={80213000} />

      <Tabs className="w-full max-w-md p-0">
        <Tabs.ListContainer>
          <Tabs.List className="bg-surface " aria-label="Options">
            <Tabs.Tab
              id="transactions"
              className="w-full h-full flex flex-col items-center p-4 gap-1 justify-center"
            >
              <Tabs.Indicator className="bg-accent rounded-2xl" />
              <CardTransfer size={20} />
              <span>تراکنش ها</span>
            </Tabs.Tab>
            <Tabs.Tab
              className="w-full h-full flex flex-col items-center p-4 gap-1 justify-center"
              id="payments"
            >
              <Documents size={20} />
              فاکتورها
              <Tabs.Indicator className="bg-accent rounded-2xl" />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="p-0" id="transactions">
          <Transactions data={payments} />
        </Tabs.Panel>
        <Tabs.Panel className="p-0" id="payments">
          <InvoiceList data={payments} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
