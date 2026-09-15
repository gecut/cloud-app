import type { ReactNode } from "react";

interface Brand3DBadgeProps {
  title: string;
  subtitle?: string;
  badgeAction?: ReactNode;
}

export function Brand3DBadge({ title, subtitle, badgeAction }: Brand3DBadgeProps) {
  return (
    <div className="relative flex flex-col items-center justify-center pt-3 pb-2 select-none">
      {/* Optional Top action like Switch button */}
      {badgeAction && (
        <div className="absolute top-0 right-0 z-20">
          {badgeAction}
        </div>
      )}

      {/* Ambient Emerald Glow Backlight */}
      <div className="absolute -top-4 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 w-28 h-28 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* 3D Floating Stage */}
      <div className="relative flex items-center justify-center my-3 perspective-[1000px]">
        {/* Isometric Pedestal Shadow/Plate */}
        {/* <div
          className="absolute -bottom-3.5 w-28 h-12 rounded-[28px] bg-gradient-to-b from-emerald-500/20 via-zinc-900/80 to-black/90 border border-emerald-500/30 shadow-[0_10px_25px_rgba(16,185,129,0.25)] blur-[0.5px]"
          style={{
            transform: "rotateX(60deg) rotateZ(0deg)",
          }}
        /> */}

        {/* Secondary Lower Base Pedestal Rim */}
      

        {/* Floating Glossy 3D Badge Box */}
        <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-b from-zinc-800/90 via-zinc-900 to-black border border-emerald-500/40 shadow-[0_8px_30px_rgba(16,185,129,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] transform transition-transform duration-300">
          {/* Internal gradient shine */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/10 via-transparent to-white/10 pointer-events-none" />
          
          {/* Gecut Emerald Logo */}
          <img
            src="/logo.png"
            alt="Gecut Cloud"
            className="w-13 h-13 object-contain drop-shadow-[0_4px_12px_rgba(16,185,129,0.5)]"
          />
        </div>
      </div>

      {/* Headings */}
      <div className="text-center flex flex-col items-center gap-1 mt-2 z-10">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
