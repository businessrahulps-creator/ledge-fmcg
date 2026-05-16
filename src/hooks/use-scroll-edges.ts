import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether a scroll container has content scrolled above (top edge)
 * and/or content remaining below (bottom edge). Used to render fade
 * affordances that signal "there's more here".
 *
 * Returns a ref to attach to the scrolling element + two booleans.
 */
export function useScrollEdges<T extends HTMLElement = HTMLDivElement>(deps: unknown[] = []) {
  const ref = useRef<T | null>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setAtTop(scrollTop <= 2);
      setAtBottom(scrollTop + clientHeight >= scrollHeight - 2);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // Observe children too — content can change height after data loads.
    for (const child of Array.from(el.children)) ro.observe(child);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, atTop, atBottom, showTopFade: !atTop, showBottomFade: !atBottom };
}
