import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture calls to .range() so we can verify pagination behavior
const rangeCalls: Array<{ table: string; column: string; ids: string[]; from: number; to: number }> = [];

// Mock dataset registry: table -> rows
let mockRows: any[] = [];

vi.mock("@/integrations/supabase/client", () => {
  const builder = (table: string) => {
    const state: { column?: string; ids?: string[] } = {};
    const chain: any = {
      select: vi.fn(() => chain),
      in: vi.fn((column: string, ids: string[]) => {
        state.column = column;
        state.ids = ids;
        return chain;
      }),
      range: vi.fn((from: number, to: number) => {
        rangeCalls.push({
          table,
          column: state.column!,
          ids: state.ids!,
          from,
          to,
        });
        const filtered = mockRows.filter(r => state.ids!.includes(r[state.column!]));
        const page = filtered.slice(from, to + 1);
        return Promise.resolve({ data: page, error: null });
      }),
    };
    return chain;
  };
  return {
    supabase: {
      from: vi.fn((table: string) => builder(table)),
    },
  };
});

import { batchIn } from "../data-utils";

// Helper: which [from,to] ranges were actually requested
const calledRanges = () => new Set(rangeCalls.map(c => `${c.from}-${c.to}`));

describe("batchIn pagination", () => {
  beforeEach(() => {
    rangeCalls.length = 0;
    mockRows = [];
  });

  it("returns [] immediately for empty id list (no queries)", async () => {
    const result = await batchIn("order_lines", "order_id", []);
    expect(result).toEqual([]);
    expect(rangeCalls).toHaveLength(0);
  });

  it("returns all rows when result fits under a single 1000-row page", async () => {
    mockRows = Array.from({ length: 250 }, (_, i) => ({ order_id: "o1", n: i }));
    const result = await batchIn("order_lines", "order_id", ["o1"]);
    expect(result).toHaveLength(250);
    // First page must be requested (parallel wave may also probe trailing
    // empty pages — that's fine).
    expect(rangeCalls[0]).toMatchObject({ from: 0, to: 999 });
  });

  it("paginates past the 1000-row Supabase cap and preserves ordering", async () => {
    // 2350 rows for the same id -> needs pages 0, 1, 2 (short). Parallel wave
    // may overshoot but all rows must be returned in order.
    mockRows = Array.from({ length: 2350 }, (_, i) => ({ order_id: "o1", idx: i }));
    const result = await batchIn("order_lines", "order_id", ["o1"]);
    expect(result).toHaveLength(2350);

    // Required pages were all requested
    const ranges = calledRanges();
    expect(ranges.has("0-999")).toBe(true);
    expect(ranges.has("1000-1999")).toBe(true);
    expect(ranges.has("2000-2999")).toBe(true);

    // Ordering preserved across pages
    expect(result[0].idx).toBe(0);
    expect(result[1500].idx).toBe(1500);
    expect(result[2349].idx).toBe(2349);
  });

  it("stops after fetching exactly a multiple of 1000 (next page returns empty)", async () => {
    mockRows = Array.from({ length: 2000 }, (_, i) => ({ order_id: "o1", idx: i }));
    const result = await batchIn("order_lines", "order_id", ["o1"]);
    expect(result).toHaveLength(2000);
    // Must probe at least one page past the end to detect end-of-results
    const ranges = calledRanges();
    expect(ranges.has("0-999")).toBe(true);
    expect(ranges.has("1000-1999")).toBe(true);
    expect(ranges.has("2000-2999")).toBe(true);
  });

  it("chunks id list into batches of 500", async () => {
    const ids = Array.from({ length: 1200 }, (_, i) => `o${i}`);
    // one row per id keeps page sizes small (single page per chunk)
    mockRows = ids.map(id => ({ order_id: id }));
    const result = await batchIn("order_lines", "order_id", ids);
    expect(result).toHaveLength(1200);
    // 3 chunks (500 + 500 + 200), each chunk only needs one page
    // (parallel wave may overshoot — the important invariant is that exactly
    // 3 distinct id-chunks were requested at offset 0)
    const firstPageCalls = rangeCalls.filter(c => c.from === 0);
    expect(firstPageCalls).toHaveLength(3);
    const chunkSizes = firstPageCalls.map(c => c.ids.length).sort((a, b) => a - b);
    expect(chunkSizes).toEqual([200, 500, 500]);
  });

  it("paginates per id-chunk independently", async () => {
    const ids = Array.from({ length: 600 }, (_, i) => `o${i}`);
    // Chunk 1 (ids 0-499): 1500 rows total
    // Chunk 2 (ids 500-599): 200 rows total
    const chunk1Rows = Array.from({ length: 1500 }, (_, i) => ({ order_id: `o${i % 500}`, k: `c1-${i}` }));
    const chunk2Rows = Array.from({ length: 200 }, (_, i) => ({ order_id: `o${500 + (i % 100)}`, k: `c2-${i}` }));
    mockRows = [...chunk1Rows, ...chunk2Rows];

    const result = await batchIn("order_lines", "order_id", ids);
    expect(result).toHaveLength(1700);

    // Chunk 1 must have probed pages 0-999 and 1000-1999 for a 500-id chunk
    const chunk1Calls = rangeCalls.filter(c => c.ids.length === 500);
    const chunk1Ranges = new Set(chunk1Calls.map(c => `${c.from}-${c.to}`));
    expect(chunk1Ranges.has("0-999")).toBe(true);
    expect(chunk1Ranges.has("1000-1999")).toBe(true);

    // Chunk 2 only needs page 0
    const chunk2Calls = rangeCalls.filter(c => c.ids.length === 100);
    expect(chunk2Calls.some(c => c.from === 0 && c.to === 999)).toBe(true);
  });

  it("propagates supabase errors", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.from as any).mockImplementationOnce(() => ({
      select: () => ({
        in: () => ({
          range: () => Promise.resolve({ data: null, error: { message: "boom" } }),
        }),
      }),
    }));
    await expect(batchIn("order_lines", "order_id", ["o1"])).rejects.toMatchObject({ message: "boom" });
  });
});
