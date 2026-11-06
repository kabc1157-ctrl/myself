export type InvestmentTrade = { symbol_id: string; trade_date: string; trade_type: string; quantity: number; trade_amount: number };

export function calculateRealizedPeriodMetrics(trades: readonly InvestmentTrade[], start: string, end: string) {
  const state = new Map<string, { quantity: number; cost: number }>();
  let profit = 0;
  let investedCost = 0;
  for (const trade of [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date) || (a.trade_type === "buy" ? -1 : b.trade_type === "buy" ? 1 : 0))) {
    const current = state.get(trade.symbol_id) ?? { quantity: 0, cost: 0 };
    if (trade.trade_type === "buy") { current.quantity += trade.quantity; current.cost += trade.trade_amount; }
    else if (trade.trade_type === "sell" && current.quantity > 0) {
      const soldQuantity = Math.min(current.quantity, trade.quantity);
      const averageCost = current.cost / current.quantity;
      if (trade.trade_date >= start && trade.trade_date <= end) { profit += trade.trade_amount * (soldQuantity / trade.quantity) - averageCost * soldQuantity; investedCost += averageCost * soldQuantity; }
      current.quantity -= soldQuantity;
      current.cost = Math.max(0, current.cost - averageCost * soldQuantity);
    }
    state.set(trade.symbol_id, current);
  }
  return { profit, returnRate: investedCost ? (profit / investedCost) * 100 : 0 };
}
