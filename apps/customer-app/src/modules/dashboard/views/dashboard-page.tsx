"use client";

import { services } from "../_mock/dashboard.mock";
import { Services } from "../components/service-detail";
import { ServicesSlider } from "../components/services-slider";

export function DashboardPage() {
  return (
    <div className="w-full flex flex-col gap-2">
      <ServicesSlider />
      <h2 className="text-2xl py-4">داشبورد</h2>
      <Services data={services} />
    </div>
  );
}
