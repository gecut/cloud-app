import { Tabs } from "@heroui/react";
import { ServerSquareCloud } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { HeartPulse } from "@solar-icons/react-perf/category/medicine/BoldDuotone";
import { LinkRound } from "@solar-icons/react-perf/category/text-formatting/BoldDuotone";
import { LayersMinimalistic } from "@solar-icons/react-perf/category/tools/BoldDuotone";
import { Server2 } from "@solar-icons/react-perf/category/devices/LineDuotone";

import { dataTypes, ServiceType, subscriptions } from "@/app/data";
import { ServiceDetailList } from "./service-detail-list";
import { SubscriptionList } from "./subscription/subscription-list";

const allData = dataTypes.services;

const getFilteredData = (type?: ServiceType) => {
  return allData.filter((item) => item.type === type);
};
const tabs = [
  {
    id: "all",
    label: "همه",
    icon: <LayersMinimalistic size={24} />,
    content: <ServiceDetailList data={allData} />,
  },
  {
    id: "services",
    label: "سرویس ها",
    icon: <ServerSquareCloud size={24} className="*:stroke-1" />,
    content: <ServiceDetailList data={getFilteredData("SERVICE")} />,
  },
  {
    id: "domains",
    label: "دامنه",
    icon: <LinkRound size={24} />,
    content: <ServiceDetailList data={getFilteredData("DOMAIN")} />,
  },
  {
    id: "hosting",
    label: "میزبانی",
    icon: <Server2 size={24} />,
    content: <ServiceDetailList data={getFilteredData("DOMAIN")} />,
  },
  {
    id: "shares",
    label: "اشتراک",
    icon: <HeartPulse size={24} />,
    content: <SubscriptionList data={subscriptions} />,
  },
];
export function Services() {
  return (
    <Tabs defaultSelectedKey="services" className="mx-auto">
      <Tabs.ListContainer>
        <Tabs.List
          aria-label="Dashboard Tabs"
          className="bg-surface h-20 p-2 rounded-2xl"
        >
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab.id}
              id={tab.id}
              className="relative flex h-full w-full flex-col items-center justify-center rounded-xl text-sm"
            >
              {tab.icon}
              <span className="text-xs whitespace-nowrap">{tab.label}</span>

              <Tabs.Indicator className="bg-accent rounded-xl" />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>

      {tabs.map((tab) => (
        <Tabs.Panel key={tab.id} id={tab.id} className="w-full p-0">
          {tab.content}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
