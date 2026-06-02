import { Subscription } from "@/routes/_app/data";
import { SubscriptionCard } from "./subscription-card";

interface SubscriptionListProps {
  data: Subscription[];
}

export function SubscriptionList({ data }: SubscriptionListProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      {data.map((subscription) => (
        <SubscriptionCard key={subscription.title} data={subscription} />
      ))}
    </div>
  );
}
