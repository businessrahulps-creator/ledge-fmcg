import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Fluent 2 input anatomy
 * - 40px height, 6px radius
 * - Hairline border + depth-2 rest, ring on focus
 * - 200ms fluent motion
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-depth-2 ring-offset-background transition-[box-shadow,border-color,background-color] duration-normal ease-fluent file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
