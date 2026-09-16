import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@gecut-cloud/ui/lib/utils";
import * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-input/70 bg-muted/20 px-3.5 py-2 text-xs md:text-sm font-medium transition-all duration-200 outline-none shadow-xs hover:border-input hover:bg-muted/35 focus-visible:border-emerald-500/60 focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-emerald-500/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground/60 dark:bg-muted/15 dark:hover:bg-muted/25 dark:focus-visible:bg-background/80",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
