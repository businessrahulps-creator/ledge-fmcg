import { useState, useEffect, useCallback, useMemo } from "react";

const DEFAULT_PAGE_SIZE = 10;

/**
 * @param resetKey  Any value describing the active search/filter. Changing it sends the
 *                  user back to page 1 — needed because a different filter can produce a
 *                  list of the same length, which the item count alone cannot detect.
 */
export function usePagination(totalItems: number, pageSize = DEFAULT_PAGE_SIZE, resetKey?: unknown) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const resetToken = typeof resetKey === "string" ? resetKey : JSON.stringify(resetKey ?? null);

  // Reset to page 1 when the result count or the active search/filter changes
  useEffect(() => {
    setPage(1);
  }, [totalItems, resetToken]);

  // Clamp page if it exceeds totalPages
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const from = (page - 1) * pageSize;
  const to = Math.min(from + pageSize, totalItems);

  const nextPage = useCallback(() => setPage((p) => Math.min(p + 1, totalPages)), [totalPages]);
  const prevPage = useCallback(() => setPage((p) => Math.max(p - 1, 1)), []);
  const resetPage = useCallback(() => setPage(1), []);

  return useMemo(
    () => ({ page, totalPages, from, to, setPage, nextPage, prevPage, resetPage }),
    [page, totalPages, from, to, nextPage, prevPage, resetPage]
  );
}
