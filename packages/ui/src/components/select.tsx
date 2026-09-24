import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@gecut-cloud/ui/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, disabled, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            "h-10 w-full appearance-none rounded-xl border border-input/70 bg-muted/20 pr-10 pl-3.5 text-xs md:text-sm font-medium transition-all duration-200 outline-none shadow-xs hover:border-input hover:bg-muted/35 focus:border-emerald-500 focus:bg-background focus:ring-3 focus:ring-emerald-500/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-muted/15 dark:hover:bg-muted/25 dark:focus:bg-background/80 cursor-pointer",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center justify-center text-muted-foreground/70">
          <ChevronDown className="h-4 w-4 stroke-[2.2] transition-transform duration-200" />
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";

export { Select };
