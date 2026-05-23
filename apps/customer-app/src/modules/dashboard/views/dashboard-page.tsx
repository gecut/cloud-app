import useEmblaCarousel from "embla-carousel-react";
import Fade from "embla-carousel-fade";
import { useQuery } from "@tanstack/react-query";
import { DashboardErrorState } from "@/modules/dashboard/states/dashboard-error-state";
import { DashboardEmptyState } from "@/modules/dashboard/states/dashboard-empty-state";
import { DashboardPageSkeleton } from "@/modules/dashboard/skeletons/dashboard-page-skeleton";
import { ServicesSlider } from "@/modules/dashboard/components/services-slider";
import { mockListDashboardServices } from "@/modules/dashboard/_mock/dashboard.mock";
import { useCallback, useEffect } from "react";

import { ServiceDetail } from "../components/service-detail";

export function DashboardPage() {
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

  const servicesQuery = useQuery({
    queryKey: ["dashboard", "my-services"],
    queryFn: mockListDashboardServices,
  });

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
  if (servicesQuery.isError) {
    return <DashboardErrorState message={servicesQuery.error?.message} />;
  }

  const services = servicesQuery.data?.items ?? [];
  if (services.length === 0) return <DashboardEmptyState />;

  return (
    <div className="w-full h-full min-h-0 overflow-hidden flex flex-col py-4 md:py-6">
      <div className="shrink-0">
        <ServicesSlider emblaRef={emblaServicesRef} />
      </div>
      <div className="flex-1 min-h-0">
        <ServiceDetail emblaRef={emblaServiceDetailRef} />
      </div>
    </div>
  );
}
