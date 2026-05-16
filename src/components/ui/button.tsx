import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Fluent 2 button anatomy
 * - Radius: 6px (rounded-md → var(--radius))
 * - Heights: 32px compact, 40px default, 48px lg
 * - Depth: rest depth-2 on filled, depth-4 on hover, none on ghost/link/outline
 * - Motion: 100ms fluent ease (decel on hover-in)
 * - Active: subtle press (no scale on link)
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium tracking-[-0.005em] ring-offset-background transition-[background-color,box-shadow,transform,color,border-color] duration-fast ease-fluent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-depth-2 hover:bg-primary/90 hover:shadow-depth-4 active:shadow-depth-2 active:translate-y-[0.5px]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-depth-2 hover:bg-destructive/90 hover:shadow-depth-4 active:shadow-depth-2 active:translate-y-[0.5px]",
        outline:
          "border border-input bg-background hover:bg-muted/60 hover:text-foreground hover:border-foreground/20 active:bg-muted active:translate-y-[0.5px]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-depth-2 hover:bg-secondary/80 hover:shadow-depth-4 active:shadow-depth-2 active:translate-y-[0.5px]",
        ghost: "hover:bg-muted/60 hover:text-foreground active:bg-muted",
        subtle: "bg-transparent text-foreground/80 hover:bg-muted/50 hover:text-foreground active:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-success text-success-foreground shadow-depth-2 hover:bg-success/90 hover:shadow-depth-4 active:shadow-depth-2 active:translate-y-[0.5px]",
        pill: "rounded-pill bg-primary text-primary-foreground shadow-depth-2 hover:bg-primary/90 hover:shadow-depth-4",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        compact: "h-8 px-3 text-sm",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
