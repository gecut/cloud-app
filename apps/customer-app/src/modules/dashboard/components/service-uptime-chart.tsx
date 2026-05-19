"use client";

import { cardVariants } from "@heroui/styles";
import { cn } from "@heroui/styles";
import { memo, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type UptimePoint = {
  date: string;
  uptime: number;
  responseTimeMs: number;
};

const demoUptimeData: UptimePoint[] = [
  { date: "۱ اردیبهشت", uptime: 99.96, responseTimeMs: 182 },
  { date: "۲ اردیبهشت", uptime: 99.92, responseTimeMs: 196 },
  { date: "۳ اردیبهشت", uptime: 99.98, responseTimeMs: 171 },
  { date: "۴ اردیبهشت", uptime: 99.87, responseTimeMs: 224 },
  { date: "۵ اردیبهشت", uptime: 99.94, responseTimeMs: 188 },
  { date: "۶ اردیبهشت", uptime: 99.99, responseTimeMs: 164 },
  { date: "۷ اردیبهشت", uptime: 99.91, responseTimeMs: 203 },
];

type ServiceUptimeAreaChartProps = {
  title?: string;
  description?: string;
  data?: UptimePoint[];
  className?: string;
  bodyClassName?: string;
  isLoading?: boolean;
  errorMessage?: string;
};

function formatUptime(value: number) {
  return `${value.toFixed(2)}٪`;
}

type UptimeTooltipPayload = {
  payload?: UptimePoint;
};

type UptimeTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: UptimeTooltipPayload[];
};

function UptimeTooltip({ active, payload, label }: UptimeTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/95 px-4 py-3 text-right shadow-xl backdrop-blur">
      <p className="mb-2 text-sm font-medium text-zinc-100">{label}</p>

      <div className="space-y-1 text-xs text-zinc-300">
        <p>
          آپتایم:{" "}
          <span className="font-semibold text-emerald-400">
            {formatUptime(point.uptime)}
          </span>
        </p>
        <p>
          زمان پاسخ:{" "}
          <span className="font-semibold text-zinc-100">
            {point.responseTimeMs}ms
          </span>
        </p>
      </div>
    </div>
  );
}

function ChartSkeleton({ bodyClassName }: { bodyClassName: string }) {
  return (
    <div
      className={cn(
        bodyClassName,
        "animate-pulse rounded-3xl border border-white/10 bg-zinc-900/70 p-5"
      )}
    >
      <div className="mb-6 h-5 w-40 rounded-full bg-white/10" />
      <div className="h-44 rounded-2xl bg-white/5" />
    </div>
  );
}

function ChartStateMessage({
  message,
  bodyClassName,
}: {
  message: string;
  bodyClassName: string;
}) {
  return (
    <div
      className={cn(
        bodyClassName,
        "flex items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/70 p-6 text-center text-sm text-zinc-400"
      )}
    >
      {message}
    </div>
  );
}

export const ServiceUptimeAreaChart = memo(function ServiceUptimeAreaChart({
  title = "وضعیت آپتایم سرویس (هفته اخیر)",
  data = demoUptimeData,
  isLoading = false,
  className,
  bodyClassName = "h-64",
  errorMessage,
}: ServiceUptimeAreaChartProps) {
  const chartData = useMemo(() => data, [data]);

  if (isLoading) return <ChartSkeleton bodyClassName={bodyClassName} />;

  if (errorMessage) {
    return (
      <ChartStateMessage message={errorMessage} bodyClassName={bodyClassName} />
    );
  }

  if (chartData.length === 0) {
    return (
      <ChartStateMessage
        message="هنوز داده‌ای برای آپتایم این سرویس ثبت نشده است."
        bodyClassName={bodyClassName}
      />
    );
  }

  return (
    <section
      dir="rtl"
      aria-label={title}
      className={cardVariants({ variant: "secondary" }).base({
        className: ["relative", className],
      })}
    >
      <header className="mb-5 flex items-center justify-start gap-2">
        <div className="size-1.5 rounded-full bg-accent shadow-accent animate-shadow-ping" />
        <h2 className="font-normal text-xs opacity-70">{title}</h2>
      </header>

      <div className={cn(bodyClassName, "w-full")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#119b9e" stopOpacity={0.38} />
                <stop offset="95%" stopColor="#119b9e" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
            />

            <YAxis
              domain={[
                chartData
                  .map((item) => item.uptime)
                  .reduce((p, c) => Math.min(p, c)),
                chartData
                  .map((item) => item.uptime)
                  .reduce((p, c) => Math.max(p, c)),
              ]}
              axisLine={false}
              tickLine={false}
              tickMargin={45}
              tickFormatter={formatUptime}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              width={50}
            />

            <Tooltip
              cursor={{ stroke: "rgba(16,185,129,0.35)", strokeWidth: 1 }}
              content={<UptimeTooltip />}
            />

            <Area
              type="monotone"
              dataKey="uptime"
              name="آپتایم"
              stroke="#119b9e"
              strokeWidth={2.5}
              fill="url(#uptimeGradient)"
              activeDot={{ r: 5, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
});
