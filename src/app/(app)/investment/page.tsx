import Link from "next/link";

import { verifySession } from "@/core/auth/session";
import { getLocalDate, isMonth } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { AiInsight } from "@/core/ui/ai-insight";
import { ActivityCalendar } from "@/core/ui/activity-calendar";
import { PersistentDetails } from "@/core/ui/persistent-details";
import { deleteInvestmentTradeAction, saveInvestmentSymbolAction } from "@/modules/life/application/actions";
import { getFeatureSettings, getInvestmentSymbols, getInvestmentTrades } from "@/modules/life/infrastructure/repository";
import { InvestmentTradeForm } from "@/modules/life/ui/investment-trade-form";
import { getOrCreateProfile } from "@/core/user/profile-repository";

type Props = { searchParams: Promise<{ date?: string; month?: string; year?: string; sort?: string; symbol?: string; edit?: string }> };

const won = (value: number) => `${new Intl.NumberFormat("ko-KR").format(Math.round(value))}원`;
const signedQuantity = (trade: { trade_type: string; quantity: number }) => trade.trade_type === "buy" ? trade.quantity : -trade.quantity;

export default async function InvestmentPage({ searchParams }: Props) {
  const [session, supabase, query] = await Promise.all([verifySession(), createServerSupabaseClient(), searchParams]);
  const profile = await getOrCreateProfile(supabase, session.userId);
  const date = getLocalDate(profile.timezone);
  const requestedYear = typeof query.year === "string" && /^\d{4}$/.test(query.year) ? query.year : date.slice(0, 4);
  const month = typeof query.month === "string" && isMonth(query.month) && query.month.startsWith(requestedYear) ? query.month : requestedYear === date.slice(0, 4) ? date.slice(0, 7) : `${requestedYear}-01`;
  const selectedDate = typeof query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : date;
  const [settings, symbols, trades, insights] = await Promise.all([
    getFeatureSettings(supabase, session.userId),
    getInvestmentSymbols(supabase, session.userId),
    getInvestmentTrades(supabase, session.userId),
    supabase.from("ai_insights").select("id,content,title,source_date").eq("user_id", session.userId).eq("category", "investment").eq("source_date", selectedDate).order("created_at", { ascending: false }),
  ]);
  if (insights.error) throw new Error(`Failed to load investment insights: ${insights.error.message}`);
  if (!settings.investment_enabled) return <div className="feature-page"><section className="settings-card"><div className="card-heading"><span>기능 설정</span><h1>투자 기능이 꺼져 있어요</h1></div><p>마이페이지의 기능 설정에서 투자(매매 일지)를 켜면 사용할 수 있어요.</p><Link className="primary-button" href="/my-page">기능 설정으로 이동</Link></section></div>;

  const monthTrades = trades.filter((trade) => trade.trade_date.startsWith(month));
  const yearTrades = trades.filter((trade) => trade.trade_date.startsWith(requestedYear));
  const calculatePeriod = (start: string, end: string) => { const state = new Map<string, { quantity: number; cost: number }>(); let profit = 0; let investedCost = 0; for (const trade of [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date))) { const current = state.get(trade.symbol_id) ?? { quantity: 0, cost: 0 }; if (trade.trade_type === "buy") { current.quantity += trade.quantity; current.cost += trade.trade_amount; } else if (current.quantity > 0) { const averageCost = current.cost / current.quantity; if (trade.trade_date >= start && trade.trade_date <= end) { profit += trade.trade_amount - averageCost * trade.quantity; investedCost += averageCost * trade.quantity; } current.quantity = Math.max(0, current.quantity - trade.quantity); current.cost = Math.max(0, current.cost - averageCost * trade.quantity); } state.set(trade.symbol_id, current); } return { profit, returnRate: investedCost ? (profit / investedCost) * 100 : 0 }; };
  const yearMetrics = calculatePeriod(`${requestedYear}-01-01`, `${requestedYear}-12-31`);
  const monthMetrics = calculatePeriod(`${month}-01`, `${month}-31`);
  const holdings = symbols.map((symbol) => {
    const symbolTrades = trades.filter((trade) => trade.symbol_id === symbol.id);
    const quantity = symbolTrades.reduce((sum, trade) => sum + signedQuantity(trade), 0);
    const buyQuantity = symbolTrades.filter((trade) => trade.trade_type === "buy").reduce((sum, trade) => sum + trade.quantity, 0);
    const buyAmount = symbolTrades.filter((trade) => trade.trade_type === "buy").reduce((sum, trade) => sum + trade.trade_amount, 0);
    const sellAmount = symbolTrades.filter((trade) => trade.trade_type === "sell").reduce((sum, trade) => sum + trade.trade_amount, 0);
    return { ...symbol, quantity, averagePrice: buyQuantity ? buyAmount / buyQuantity : 0, tradeAmount: buyAmount - sellAmount };
  }).filter((item) => item.quantity > 0);
  const sortedHoldings = [...holdings].sort((left, right) => right.tradeAmount - left.tradeAmount);
  const selectedTrades = trades.filter((trade) => trade.trade_date === selectedDate && (!query.symbol || trade.symbol_id === query.symbol));
  const editingTrade = trades.find((trade) => trade.id === query.edit);
  const calendarValues = Array.from(new Map(trades.filter((trade) => trade.trade_date.startsWith(month)).map((trade) => [trade.trade_date, trade])).keys()).map((tradeDate) => {
    const dayTrades = trades.filter((trade) => trade.trade_date === tradeDate);
    const types = new Set(dayTrades.map((trade) => trade.trade_type));
    const tone = types.size > 1 ? "both" as const : dayTrades[0]?.trade_type as "buy" | "sell";
    return { date: tradeDate, label: `${dayTrades.some((trade) => trade.trade_type === "buy") ? "●" : ""}${dayTrades.some((trade) => trade.trade_type === "sell") ? "●" : ""}`, level: 4, tone };
  });
  return <div className="feature-page investment-page">
    <section className="investment-metrics"><article><span><form className="investment-inline-period" method="get"><input name="month" type="hidden" value={month}/><label><select aria-label="연도 선택" name="year" defaultValue={requestedYear}>{Array.from(new Set([date.slice(0, 4), "2024", "2025", "2026"])).sort().map((value) => <option key={value} value={value}>{value}년</option>)}</select> 수익률</label><button className="text-button">보기</button></form></span><strong className={yearMetrics.returnRate >= 0 ? "positive-return" : "negative-return"}>{yearMetrics.returnRate >= 0 ? "+" : ""}{yearMetrics.returnRate.toFixed(1)}%</strong><small>수익 금액 {won(yearMetrics.profit)}</small></article><article><span><form className="investment-inline-period" method="get"><input name="year" type="hidden" value={requestedYear}/><label><select aria-label="월 선택" name="month" defaultValue={month}>{Array.from({length: 12}, (_, index) => `${requestedYear}-${String(index + 1).padStart(2, "0")}`).map((value) => <option key={value} value={value}>{value}</option>)}</select> 수익률</label><button className="text-button">보기</button></form></span><strong className={monthMetrics.returnRate >= 0 ? "positive-return" : "negative-return"}>{monthMetrics.returnRate >= 0 ? "+" : ""}{monthMetrics.returnRate.toFixed(1)}%</strong><small>수익 금액 {won(monthMetrics.profit)}</small></article></section>

    <PersistentDetails className="settings-card expandable-panel" defaultOpen storageKey="investment-holdings"><summary><div className="card-heading"><span>보유 현황 · 거래대금순</span><h2>투자 종목</h2></div><span className="expand-icon">+</span></summary><div className="investment-holdings">{sortedHoldings.slice(0, 5).map((holding) => <Link className="investment-holding" href={`/investment?symbol=${holding.id}`} key={holding.id}><div><strong>{holding.name}</strong><span>{holding.ticker.startsWith("NAME-") ? "코드 없음" : holding.ticker}</span></div><div><strong>{holding.quantity}주</strong><span>평균 {won(holding.averagePrice)}</span></div><b>{won(holding.tradeAmount)}</b></Link>)}{sortedHoldings.length > 5 ? <Link className="home-routine-more-link" href="/investment">{sortedHoldings.length - 5}개 더 보기</Link> : null}</div></PersistentDetails>

    <PersistentDetails className="settings-card expandable-panel" storageKey="investment-symbol-form"><summary><div className="card-heading"><span>투자 기록</span><h1>종목 추가</h1></div><span className="expand-icon">+</span></summary><form action={saveInvestmentSymbolAction} className="feature-form investment-symbol-form"><label>종목 코드<input list="investment-symbol-codes" name="ticker" placeholder="선택하거나 직접 입력"/><datalist id="investment-symbol-codes"><option value="005930">삼성전자</option><option value="000660">SK하이닉스</option><option value="035420">NAVER</option><option value="035720">카카오</option></datalist></label><label>종목명<input name="name" placeholder="예: 삼성전자" required /></label><button className="secondary-button">종목 저장</button></form></PersistentDetails>

    {!editingTrade ? <PersistentDetails className="settings-card expandable-panel" storageKey="investment-trade-form"><summary><div className="card-heading"><span>매매 기록</span><h1>매매일지 쓰기</h1></div><span className="expand-icon">+</span></summary><InvestmentTradeForm date={selectedDate} symbols={symbols}/></PersistentDetails> : null}

    <section className="settings-card investment-calendar-card"><ActivityCalendar month={month} selectedDate={selectedDate} title="매매 기록" values={calendarValues} hrefForDate={(value) => `/investment?year=${value.slice(0,4)}&month=${value.slice(0,7)}&date=${value}${query.symbol ? `&symbol=${query.symbol}` : ""}`} hrefForMonth={(value) => `/investment?year=${value.slice(0,4)}&month=${value}`} weekStartsOn={profile.week_starts_on}/><div className="investment-calendar-legend"><span className="buy">매수</span><span className="sell">매도</span></div>{selectedTrades.length ? <div className="feature-list">{selectedTrades.map((trade) => <article className={trade.trade_type === "buy" ? "investment-trade-buy" : "investment-trade-sell"} key={trade.id}><div><small>{trade.symbol?.name ?? "종목"} · {trade.trade_type === "buy" ? "매수" : "매도"}</small><h3>{trade.quantity}주 · {won(trade.unit_price)}</h3><p>거래금액 {won(trade.trade_amount)}</p>{trade.reason ? <p>{trade.reason}</p> : null}{trade.memo ? <p>{trade.memo}</p> : null}</div><div className="inline-actions"><Link className="archive-button" href={`/investment?year=${requestedYear}&month=${month}&date=${selectedDate}&edit=${trade.id}`}>수정</Link><form action={deleteInvestmentTradeAction}><input name="id" type="hidden" value={trade.id}/><button className="text-button danger">삭제</button></form></div>{editingTrade?.id === trade.id ? <div className="investment-inline-edit"><InvestmentTradeForm date={selectedDate} symbols={symbols} trade={editingTrade}/></div> : null}</article>)}</div> : <p>선택한 날짜에 작성된 매매일지가 없어요.</p>}</section>

    <section className="feature-insight"><div className="card-heading"><span>AI INSIGHT</span><h2>투자 인사이트</h2></div>{insights.data?.map((insight) => <article className="selected-day-card" key={insight.id}><h3>{insight.title}</h3><AiInsight value={insight.content}/></article>)}{!insights.data?.length ? <p>선택한 날짜의 AI 인사이트가 아직 없어요.</p> : null}</section>
  </div>;
}
