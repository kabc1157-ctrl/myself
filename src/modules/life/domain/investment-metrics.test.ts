import { describe, expect, it } from "vitest";
import { calculateRealizedPeriodMetrics } from "./investment-metrics";

describe("investment realized metrics", () => {
  it("returns zero when only buys exist", () => {
    expect(calculateRealizedPeriodMetrics([{ symbol_id: "s", trade_date: "2026-11-03", trade_type: "buy", quantity: 2, trade_amount: 100 }], "2026-11-01", "2026-11-30")).toEqual({ profit: 0, returnRate: 0 });
  });
  it("uses weighted average cost for realized sells", () => {
    const result = calculateRealizedPeriodMetrics([
      { symbol_id: "s", trade_date: "2026-11-01", trade_type: "buy", quantity: 2, trade_amount: 100 },
      { symbol_id: "s", trade_date: "2026-11-02", trade_type: "buy", quantity: 2, trade_amount: 300 },
      { symbol_id: "s", trade_date: "2026-11-03", trade_type: "sell", quantity: 2, trade_amount: 300 },
    ], "2026-11-01", "2026-11-30");
    expect(result.profit).toBe(100);
    expect(result.returnRate).toBeCloseTo(50);
  });
});
