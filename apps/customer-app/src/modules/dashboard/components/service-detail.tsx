import type { RouterAppContext } from "@/routes/__root";
import { useMyServicesQuery } from "../api/dashboard.queries";
import { EmblaViewportRefType } from "embla-carousel-react";
import {
  HeartPulse,
  CheckCircle,
  DollarMinimalistic,
  CalendarMinimalistic,
  CalendarMark,
} from "@solar-icons/react-perf/Linear";
import { ReactNode } from "react";
import { ServiceStatus } from "@gecut-cloud/db";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { ServiceUptimeAreaChart } from "./service-uptime-chart";

interface ServiceDetailProps {
  routeContext: Pick<RouterAppContext, "orpc">;
  emblaRef: EmblaViewportRefType;
}

const serviceStatusDescribe = (status: ServiceStatus) => {
  if (status === "ACTIVE") return "سرویس فعال است";
  // TODO: Rewrite with Switch/Case and completely for all statuses

  return "-";
};

export function ServiceDetail({ routeContext, emblaRef }: ServiceDetailProps) {
  const { data } = useMyServicesQuery(routeContext);

  return (
    <div className="w-full h-full min-h-0">
      <div className="overflow-hidden h-full pb-2 md:pb-4" ref={emblaRef}>
        <div className="flex touch-none h-full">
          <ContainerSlide>
            <h1>First</h1>
          </ContainerSlide>
          {data?.items.map((service) => (
            <ContainerSlide key={service.id}>
              {service.status === "ACTIVE" && (
                <HeartPulse className="absolute top-6 end-6 text-accent text-3xl" />
              )}
              <h1 className="font-light text-2xl truncate">{service.name}</h1>
              <p className="text-sm mt-1 opacity-80 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                {service.description}
              </p>
              <Card
                variant="secondary"
                className="mt-3 md:mt-4 py-2 px-4 gap-0 shrink-0"
              >
                <CardHeader>
                  <CardTitle className="font-normal text-xs opacity-70">
                    خلاصه اطلاعات سرویس
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1 py-1.5 md:py-2">
                    <div className="flex gap-1 items-center">
                      <CheckCircle className="size-5 opacity-50" />
                      <span className="opacity-50">وضعیت:</span>
                      <span className="text-accent">
                        {serviceStatusDescribe(service.status)}
                      </span>
                    </div>
                    <div className="flex gap-1 items-center">
                      <DollarMinimalistic className="size-5 opacity-50" />
                      <span className="opacity-50">هزینه:</span>
                      <span>{service.priceToman.toLocaleString("fa-IR")}</span>
                      <span className="text-xs mt-1 opacity-50">تومان</span>
                    </div>
                    <div className="flex gap-1 items-center">
                      <CalendarMinimalistic className="size-5 opacity-50" />
                      <span className="opacity-50">تاریخ ساخت:</span>
                      <span>
                        {service.startDate.toLocaleDateString("fa-IR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex gap-1 items-center">
                      <CalendarMark className="size-5 opacity-50" />
                      <span className="opacity-50">تاریخ تمدید:</span>
                      <span>
                        {service.renewalDate.toLocaleDateString("fa-IR", {
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <ServiceUptimeAreaChart
                className="mt-3 md:mt-4 flex-1 min-h-40"
                bodyClassName="h-full"
              />
            </ContainerSlide>
          ))}
          <ContainerSlide>
            <h1>Last</h1>
          </ContainerSlide>
        </div>
      </div>
    </div>
  );
}

function ContainerSlide({ children }: { children: ReactNode }) {
  return (
    <div className="flex-[0_0_100%] h-full cursor-pointer select-none min-w-0">
      <div className="px-6 relative h-full flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
