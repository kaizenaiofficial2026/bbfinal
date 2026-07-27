import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => [] as Array<[string, ...unknown[]]>);

vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: () => {
    const builder = {
      select: (...args: unknown[]) => {
        calls.push(["select", ...args]);
        return builder;
      },
      eq: (...args: unknown[]) => {
        calls.push(["eq", ...args]);
        return builder;
      },
      not: (...args: unknown[]) => {
        calls.push(["not", ...args]);
        return builder;
      },
      lt: (...args: unknown[]) => {
        calls.push(["lt", ...args]);
        return builder;
      },
      order: (...args: unknown[]) => {
        calls.push(["order", ...args]);
        return builder;
      },
      limit: async (...args: unknown[]) => {
        calls.push(["limit", ...args]);
        return { data: [], error: null };
      },
    };

    return {
      from: (table: string) => {
        calls.push(["from", table]);
        return builder;
      },
    };
  },
}));

import { listStalePendingPayments } from "@/lib/data/payments";

describe("listStalePendingPayments", () => {
  beforeEach(() => {
    calls.length = 0;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-27T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("only selects persisted pending MPGS sessions by update age", async () => {
    await expect(
      listStalePendingPayments({ olderThanMinutes: 15, limit: 25 }),
    ).resolves.toEqual([]);

    expect(calls).toContainEqual(["from", "payments"]);
    expect(calls).toContainEqual(["eq", "status", "pending"]);
    expect(calls).toContainEqual([
      "not",
      "mpgs_session_id",
      "is",
      null,
    ]);
    expect(calls).toContainEqual([
      "lt",
      "updated_at",
      "2026-07-27T11:45:00.000Z",
    ]);
    expect(calls).toContainEqual([
      "order",
      "updated_at",
      { ascending: true },
    ]);
    expect(calls).toContainEqual(["limit", 25]);
    expect(calls.some(([method]) => method === "in")).toBe(false);
  });
});
