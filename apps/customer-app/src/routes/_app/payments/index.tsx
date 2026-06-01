import { Factor } from "@/app/components/pages/dashboard/factor";
import { Tabs } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { payments } from "../data";
import { CardTransfer } from "@solar-icons/react-perf/category/money/LineDuotone";
import { Documents } from "@solar-icons/react-perf/category/notes/LineDuotone";
import { PaymentDetails } from "@/app/components/pages/payments/payment/payment-details";
import { Transactions } from "@/app/components/pages/payments/transactions/transaction";

export const Route = createFileRoute("/_app/payments/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-full flex flex-col gap-2 p-0">
      <h2>مالــی</h2>

      <Factor price={80213000} />

      <Tabs className="w-full max-w-md p-0">
        <Tabs.ListContainer>
          <Tabs.List className="bg-surface " aria-label="Options">
            <Tabs.Tab
              className="w-full h-full flex flex-col items-center p-4 gap-1 justify-center"
              id="payments"
            >
              <Documents size={20} />
              فاکتورها
              <Tabs.Indicator className="bg-accent rounded-2xl" />
            </Tabs.Tab>

            <Tabs.Tab
              id="transactions"
              className="w-full h-full flex flex-col items-center p-4 gap-1 justify-center"
            >
              <Tabs.Indicator className="bg-accent rounded-2xl" />
              <CardTransfer size={20} />
              <span>تراکنش ها</span>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="p-0" id="payments">
          <PaymentDetails data={payments} />
        </Tabs.Panel>
        <Tabs.Panel className="p-0" id="transactions">
          <Transactions data={payments} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
