import { useQuery } from "@tanstack/react-query";
import { cardVariants, cn } from "@heroui/styles";

import { mockListDashboardServices } from "@/modules/dashboard/_mock/dashboard.mock";
import type { EmblaViewportRefType } from "embla-carousel-react";
import type { ReactNode } from "react";
import { ServerSquare } from "@solar-icons/react-perf/LineDuotone";

export interface ServicesSliderProps {
  emblaRef: EmblaViewportRefType;
}

export function ServicesSlider({ emblaRef }: ServicesSliderProps) {
  const { data } = useQuery({
    queryKey: ["dashboard", "my-services"],
    queryFn: mockListDashboardServices,
  });

  return (
    <div className="w-full">
      <div className="overflow-hidden pb-3 md:pb-4" ref={emblaRef}>
        <div className="flex touch-pan-y touch-pinch-zoom -ms-4">
          <CardSlide>
            <h1>First</h1>
          </CardSlide>
          {data?.items.map((service) => (
            <CardSlide key={service.id}>
              {service.status === "ACTIVE" && (
                <span className="absolute top-0 start-0 size-px shadow-[0_0_6rem_3rem] shadow-accent/50" />
              )}
              <ServerSquare className="size-8 opacity-80 absolute my-auto end-4" />
              <div className="flex flex-col w-full z-10">
                <span className={cn("text-xs font-bold mb-1", service.status === "ACTIVE" && "text-accent")}>
                  {service.serviceType.name}
                </span>
                <h2 className="font-light mb-4 truncate">{service.name}</h2>
                <span className="text-xs font-light opacity-70 mb-1">
                  تمدید:{" "}
                  {service.renewalDate.toLocaleDateString("fa-IR", {
                    day: "numeric",
                    month: "long",
                  })}
                </span>
                <div className="flex gap-1 items-end">
                  <span className="leading-5 text-xl">{service.priceToman.toLocaleString("fa-IR")}</span>
                  <span className="text-xs font-light opacity-70">تومان</span>
                </div>
              </div>
            </CardSlide>
          ))}
          <CardSlide>
            <h1>Last</h1>
          </CardSlide>
        </div>
      </div>
    </div>
  );
}

function CardSlide({ children }: { children: ReactNode }) {
  return (
    <div className="flex-[0_0_calc(100%-(var(--spacing)_*_20))] ps-4 cursor-pointer select-none min-w-0">
      <div className={cardVariants().base({ className: "relative p-5 rounded-3xl" })}>{children}</div>
    </div>
  );
}
