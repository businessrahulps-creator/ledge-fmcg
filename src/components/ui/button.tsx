import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Fluent 2 button anatomy
 * - Radius: 8px (rounded-md → calc(var(--radius) - 2px))
 * - Heights: 32px compact, 40px default, 48px lg
 * - Depth: rest depth-2 on filled, depth-4 on hover, none on ghost/link/outline
 * - Motion: 100ms fluent ease (decel on hover-in)
 * - Active: subtle press (no scale on link)
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium tracking-[-0.005em] ring-offset-background transition-[background-color,box-shadow,transform,color,border-color,opacity] duration-[90ms] ease-fluent motion-reduce:!transition-opacity motion-reduce:!duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&:not([data-state]):not([aria-haspopup=true])]:active:scale-[0.97] motion-reduce:active:!scale-100 aria-busy:cursor-progress",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-depth-2 hover:bg-primary/90 hover:shadow-depth-4 active:shadow-depth-2 active:opacity-[0.96]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-depth-2 hover:bg-destructive/90 hover:shadow-depth-4 active:shadow-depth-2 active:opacity-[0.96]",
        outline:
          "border border-input bg-background hover:bg-muted/60 hover:text-foreground hover:border-foreground/20 active:bg-muted active:opacity-[0.96]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-depth-2 hover:bg-secondary/80 hover:shadow-depth-4 active:shadow-depth-2 active:opacity-[0.96]",
        ghost: "hover:bg-muted/60 hover:text-foreground active:bg-muted active:opacity-[0.96]",
        subtle: "bg-transparent text-foreground/80 hover:bg-muted/50 hover:text-foreground active:bg-muted active:opacity-[0.96]",
        link: "text-primary underline-offset-4 hover:underline active:opacity-[0.96]",
        success:
          "bg-success text-success-foreground shadow-depth-2 hover:bg-success/90 hover:shadow-depth-4 active:shadow-depth-2 active:opacity-[0.96]",
        pill: "rounded-pill bg-primary text-primary-foreground shadow-depth-2 hover:bg-primary/90 hover:shadow-depth-4 active:opacity-[0.96]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs touch-target",
        compact: "h-8 px-3 text-sm touch-target",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10 touch-target",
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
  /** Shows a spinner, sets aria-busy and ignores taps while keeping focus. */
  loading?: boolean;
}

/**
 * Every button shows a spinner while its action runs: pass `loading`, or just
 * return a Promise from onClick and the button stays busy until it settles.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, onClick, ...props }, ref) => {
    const [pending, setPending] = React.useState(false);
    const mounted = React.useRef(true);
    const inFlight = React.useRef(false);
    React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    const busy = loading || pending;

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (busy || inFlight.current) { e.preventDefault(); return; }
        const result = onClick?.(e) as unknown;
        if (result && typeof (result as Promise<unknown>).then === "function") {
          inFlight.current = true;
          setPending(true);
          const done = () => { inFlight.current = false; if (mounted.current) setPending(false); };
          (result as Promise<unknown>).then(done, done);
        }
      },
      [busy, onClick],
    );

    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} onClick={onClick} {...props}>
          {children}
        </Slot>
      );
    }
    const spinner = <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />;
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        aria-busy={busy || undefined}
        aria-disabled={busy || props["aria-disabled"] || undefined}
        onClick={handleClick}
      >
        {busy ? (size === "icon" ? spinner : <>{spinner}{children}</>) : children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
