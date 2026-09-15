/**
 * Small bridge to the opening animation that lives inline in index.html.
 *
 * The splash paints before any of this code exists, so all we do here is
 * report progress and tell it when the first real screen is on the glass.
 */
type SplashApi = { step: (label: string, pct?: number) => void; done: () => void };

function api(): SplashApi | undefined {
  return typeof window === "undefined" ? undefined : (window as any).__ledgeSplash;
}

export function splashStep(label: string, pct?: number) {
  try {
    api()?.step(label, pct);
  } catch {
    /* never let the splash break boot */
  }
}

let hidden = false;

/** Hides the splash on the next painted frame, so it never reveals an empty page. */
export function splashDone() {
  if (hidden) return;
  hidden = true;
  const run = () => {
    try {
      api()?.done();
    } catch {
      /* ignore */
    }
  };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => requestAnimationFrame(run));
  } else {
    run();
  }
}
