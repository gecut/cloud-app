import { createFileRoute } from "@tanstack/react-router";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import {
  HardDrive,
  Cpu,
  Server,
  Activity,
  Globe,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/servers/")({
  component: AdminServersListPage,
});

const DEMO_SERVERS = [
  {
    id: "srv_node_1",
    name: "Hetzner-Primary-DE",
    provider: "Hetzner Cloud",
    ipAddress: "138.201.55.190",
    location: "Nuremberg, Germany",
    specs: { cpu: "8 vCPU", ram: "32 GB RAM", storage: "500 GB NVMe" },
    monthlyCostToman: 3400000,
    status: "ACTIVE",
    hostedServicesCount: 6,
  },
  {
    id: "srv_node_2",
    name: "OVH-Storage-FR",
    provider: "OVHcloud",
    ipAddress: "51.89.140.22",
    location: "Gravelines, France",
    specs: { cpu: "4 vCPU", ram: "16 GB RAM", storage: "2 TB SATA" },
    monthlyCostToman: 2100000,
    status: "ACTIVE",
    hostedServicesCount: 3,
  },
  {
    id: "srv_node_3",
    name: "ParsOnline-Edge-IR",
    provider: "ParsOnline DC",
    ipAddress: "185.110.188.4",
    location: "Tehran, Iran",
    specs: { cpu: "16 vCPU", ram: "64 GB RAM", storage: "1 TB SSD" },
    monthlyCostToman: 7500000,
    status: "MAINTENANCE",
    hostedServicesCount: 8,
  },
];

function AdminServersListPage() {
  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">سرورها و زیرساخت فیزیکی / ابری</h1>
            <p className="text-sm text-muted-foreground mt-1">
              نظارت بر نودهای میزبان، مشخصات سخت‌افزاری و ظرفیت میزبانی سرویس‌های مشتریان
            </p>
          </div>
        </div>

        {/* Server Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMO_SERVERS.map((server) => (
            <Card key={server.id} className="rounded-xl border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{server.name}</h3>
                      <span className="text-[11px] text-muted-foreground font-mono">{server.provider}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      server.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {server.status === "ACTIVE" ? "آنلاین" : "تعمیرات"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                  <div className="flex flex-col text-muted-foreground">
                    <span>آدرس IP:</span>
                    <span className="font-mono text-foreground">{server.ipAddress}</span>
                  </div>
                  <div className="flex flex-col text-muted-foreground">
                    <span>موقعیت دیتاسنتر:</span>
                    <span className="text-foreground">{server.location}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>سخت‌افزار:</span>
                    <span className="font-mono text-foreground">{server.specs.cpu} | {server.specs.ram}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>فضای دیسک:</span>
                    <span className="font-mono text-foreground">{server.specs.storage}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-3 border-t text-xs">
                <span className="text-muted-foreground">
                  میزبان <strong className="text-foreground">{server.hostedServicesCount}</strong> سرویس
                </span>
                <span className="font-semibold text-foreground">
                  {server.monthlyCostToman.toLocaleString("fa-IR")} ت/ماه
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

