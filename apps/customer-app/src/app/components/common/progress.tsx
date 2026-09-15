interface ProgressProps {
  progress: number;
  className?: string;
  variant?: "default" | "emerald" | "amber" | "rose" | "auto";
}

export function Progress({ progress, className = "", variant = "auto" }: ProgressProps) {
  const clamped = Math.min(Math.max(Number(progress) || 0, 0), 100);

  let fillColor = "bg-primary";
  if (variant === "emerald") {
    fillColor = "bg-emerald-500";
  } else if (variant === "amber") {
    fillColor = "bg-amber-500";
  } else if (variant === "rose") {
    fillColor = "bg-rose-500";
  } else if (variant === "auto") {
    if (clamped <= 15) {
      fillColor = "bg-rose-500";
    } else if (clamped <= 40) {
      fillColor = "bg-amber-500";
    } else {
      fillColor = "bg-emerald-500";
    }
  }

  return (
    <div className={`w-full h-2 bg-muted/40 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${fillColor} rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

