import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/route-prefetch";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, onMouseEnter, onTouchStart, onFocus, ...props }, ref) => {
    const target = typeof to === "string" ? to : (to as any)?.pathname ?? "";

    const warm = useCallback(() => prefetchRoute(target), [target]);

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        warm();
        onMouseEnter?.(e);
      },
      [warm, onMouseEnter],
    );

    const handleTouchStart = useCallback(
      (e: React.TouchEvent<HTMLAnchorElement>) => {
        warm();
        onTouchStart?.(e);
      },
      [warm, onTouchStart],
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLAnchorElement>) => {
        warm();
        onFocus?.(e);
      },
      [warm, onFocus],
    );

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        onMouseEnter={handleMouseEnter}
        onTouchStart={handleTouchStart}
        onFocus={handleFocus}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
