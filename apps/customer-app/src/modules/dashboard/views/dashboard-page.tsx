import useEmblaCarousel from "embla-carousel-react";
import Fade from "embla-carousel-fade";
import { useMyServicesQuery } from "@/modules/dashboard/api/dashboard.queries";
import { DashboardErrorState } from "@/modules/dashboard/states/dashboard-error-state";
import { DashboardEmptyState } from "@/modules/dashboard/states/dashboard-empty-state";
import { DashboardPageSkeleton } from "@/modules/dashboard/skeletons/dashboard-page-skeleton";
import { ServicesSlider } from "@/modules/dashboard/components/services-slider";
import { useCallback, useEffect } from "react";

import type { RouterAppContext } from "@/routes/__root";
import { ServiceDetail } from "../components/service-detail";

interface DashboardPageProps {
  routeContext: Pick<RouterAppContext, "orpc">;
}

export function DashboardPage({ routeContext }: DashboardPageProps) {
  const [emblaServicesRef, emblaServiceApi] = useEmblaCarousel({
    direction: "rtl",
    align: "center",
    startIndex: 1,
  });
  const [emblaServiceDetailRef, emblaServiceDetailApi] = useEmblaCarousel(
    {
      direction: "rtl",
      align: "center",
      startIndex: 1,
    },
    [Fade()]
  );
  const servicesQuery = useMyServicesQuery(routeContext);

  const onSelect = useCallback(() => {
    if (!emblaServiceApi || !emblaServiceDetailApi) return;

    emblaServiceDetailApi.scrollTo(emblaServiceApi.selectedScrollSnap());
  }, [emblaServiceApi, emblaServiceDetailApi]);

  useEffect(() => {
    if (!emblaServiceApi) return;

    onSelect();

    emblaServiceApi.on("select", onSelect).on("reInit", onSelect);

    return () => {
      emblaServiceApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaServiceApi, onSelect]);

  if (servicesQuery.isPending) {
    return (
      <div className="w-full h-full min-h-0 overflow-hidden">
        <DashboardPageSkeleton />
      </div>
    );
  }
  if (servicesQuery.isError)
    return <DashboardErrorState message={servicesQuery.error?.message} />;

  const services = servicesQuery.data?.items ?? [];

  if (services.length === 0) return <DashboardEmptyState />;

  return (
    <div className="w-full h-full min-h-0 overflow-hidden flex flex-col py-4 md:py-6">
      <div className="shrink-0">
        <ServicesSlider
          routeContext={routeContext}
          emblaRef={emblaServicesRef}
        />
      </div>
      <div className="flex-1 min-h-0">
        <ServiceDetail
          routeContext={routeContext}
          emblaRef={emblaServiceDetailRef}
        />
      </div>
    </div>
  );
}
