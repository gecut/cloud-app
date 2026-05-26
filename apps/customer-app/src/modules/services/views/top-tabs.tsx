import { Tabs } from "@heroui/react";
import { ServerSquareCloud } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { HeartPulse } from "@solar-icons/react-perf/category/medicine/BoldDuotone";
import { LinkRound } from "@solar-icons/react-perf/category/text-formatting/BoldDuotone";
import { LayersMinimalistic } from "@solar-icons/react-perf/category/tools/BoldDuotone";
import { Server2 } from "@solar-icons/react-perf/category/devices/LineDuotone";

import { ServicesListPage } from "../views/services-list-page";
import { services } from "@/modules/dashboard/_mock/dashboard.mock";
import { ServicesDetail } from "../components/services-details";
import { Link } from "@solar-icons/react-perf/category/text-formatting/LineDuotone";
import { Heart } from "@solar-icons/react-perf/category/like/Bold";

const tabs = [
  {
    id: "all",
    label: "همه",
    icon: <LayersMinimalistic size={24} />,
    content: <ServicesDetail data={services} />,
  },
  {
    id: "services",
    label: "سرویس ها",
    icon: <ServerSquareCloud size={24} />,
    content: <ServicesDetail data={services} />,
  },
  {
    id: "domains",
    label: "دامنه",
    icon: <LinkRound size={24} />,
    content: (
      <ServicesDetail
        icon={<Link size={48} />}
        showIcon={false}
        data={services}
      />
    ),
  },
  {
    id: "hosting",
    label: "میزبانی",
    icon: <Server2 size={24} />,
    content: (
      <ServicesDetail
        data={services}
        icon={<Server2 size={48} />}
        showIcon={false}
      />
    ),
  },
  {
    id: "shares",
    label: "اشتراک",
    icon: <HeartPulse size={24} />,
    content: (
      <div className="w-full flex flex-col gap-10 items-center justify-center h-[50dvh]">
        <div className="flex items-center justify-center text-3xl gap-2">
          در دست احداث لطفا صبور باشید ...
        </div>
        <Heart size={100} color="red" className="animate-wiggle delay-300" />
      </div>
    ),
  },
];

export function TopTabs() {
  return (
    <Tabs defaultSelectedKey="services" className=" mx-auto">
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
