import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";

describe("useUnsavedChangesGuard", () => {
  afterEach(() => vi.restoreAllMocks());

  it("never asks when the form becomes dirty or stays on the same page", () => {
    window.history.replaceState(null, "", "/orders/new");
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { unmount } = renderHook(() => useUnsavedChangesGuard(true));
    window.history.pushState(null, "", window.location.href);
    window.history.pushState(null, "", "/orders/new?menu=1");
    window.history.pushState(null, "", "#more");
    expect(confirm).not.toHaveBeenCalled();
    unmount();
  });

  it("asks when going to a different page, and stays if cancelled", () => {
    window.history.replaceState(null, "", "/orders/new");
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { unmount } = renderHook(() => useUnsavedChangesGuard(true));
    window.history.pushState(null, "", "/dashboard");
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/orders/new");
    unmount();
  });

  it("does not ask when nothing is filled", () => {
    window.history.replaceState(null, "", "/orders/new");
    const confirm = vi.spyOn(window, "confirm");
    const { unmount } = renderHook(() => useUnsavedChangesGuard(false));
    window.history.pushState(null, "", "/dashboard");
    expect(confirm).not.toHaveBeenCalled();
    unmount();
  });
});
