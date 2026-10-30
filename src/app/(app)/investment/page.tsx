import Link from "next/link";

import { verifySession } from "@/core/auth/session";
import { getLocalDate, isMonth } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { AiInsight } from "@/core/ui/ai-insight";
import { ActivityCalendar } from "@/core/ui/activity-calendar";
import { PersistentDetails } from "@/core/ui/persistent-details";
import { deleteInvestmentTradeAction, saveInvestmentSymbolAction, saveInvestmentTradeAction } from "@/modules/life/application/actions";
import { getFeatureSettings, getInvestmentSymbols, getInvestmentTrades } from "@/modules/life/infrastructure/repository";
import { getOrCreateProfile } from "@/core/user/profile-repository";

type Props = { searchParams: Promise<{ date?: string; month?: string; sort?: string; symbol?: string }> };

const won = (value: number) => `${new Intl.NumberFormat("ko-KR").format(Math.round(value))}원`;
const signedQuantity = (trade: { trade_type: string; quantity: number }) => trade.trade_type === "buy" ? trade.quantity : -trade.quantity;

export default async function InvestmentPage({ searchParams }: Props) {
  const [session, supabase, query] = await Promise.all([verifySession(), createServerSupabaseClient(), searchParams]);
  const profile = await getOrCreateProfile(supabase, session.userId);
  const date = getLocalDate(profile.timezone);
  const month = typeof query.month === "string" && isMonth(query.month) ? query.month : date.slice(0, 7);
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
  const yearTrades = trades.filter((trade) => trade.trade_date.startsWith(date.slice(0, 4)));
  const netReturn = (items: typeof trades) => {
    const buys = items.filter((item) => item.trade_type === "buy").reduce((sum, item) => sum + item.trade_amount, 0);
    const sells = items.filter((item) => item.trade_type === "sell").reduce((sum, item) => sum + item.trade_amount, 0);
    return buys ? ((sells - buys) / buys) * 100 : 0;
  };
  const profitAmount = (items: typeof trades) => items.filter((item) => item.trade_type === "sell").reduce((sum, trade) => sum + trade.trade_amount, 0) - items.filter((item) => item.trade_type === "buy").reduce((sum, trade) => sum + trade.trade_amount, 0);
  const holdings = symbols.map((symbol) => {
    const symbolTrades = trades.filter((trade) => trade.symbol_id === symbol.id);
    const quantity = symbolTrades.reduce((sum, trade) => sum + signedQuantity(trade), 0);
    const buyQuantity = symbolTrades.filter((trade) => trade.trade_type === "buy").reduce((sum, trade) => sum + trade.quantity, 0);
    const buyAmount = symbolTrades.filter((trade) => trade.trade_type === "buy").reduce((sum, trade) => sum + trade.trade_amount, 0);
    return { ...symbol, quantity, averagePrice: buyQuantity ? buyAmount / buyQuantity : 0, tradeAmount: symbolTrades.reduce((sum, trade) => sum + trade.trade_amount, 0) };
  }).filter((item) => item.quantity > 0);
  const sort = query.sort === "amount" ? "amount" : "quantity";
  const sortedHoldings = [...holdings].sort((left, right) => sort === "amount" ? right.tradeAmount - left.tradeAmount : right.quantity - left.quantity);
  const selectedTrades = trades.filter((trade) => trade.trade_date === selectedDate && (!query.symbol || trade.symbol_id === query.symbol));
  const calendarValues = Array.from(new Map(trades.filter((trade) => trade.trade_date.startsWith(month)).map((trade) => [trade.trade_date, trade])).keys()).map((tradeDate) => {
    const dayTrades = trades.filter((trade) => trade.trade_date === tradeDate);
    const names = dayTrades.map((trade) => `${trade.symbol?.ticker ?? "종목"} ${trade.trade_type === "buy" ? "매수" : "매도"}`).join(" · ");
    const tone = new Set(dayTrades.map((trade) => trade.trade_type)).size === 1 ? dayTrades[0]?.trade_type as "buy" | "sell" : undefined;
    return { date: tradeDate, label: names, level: 4, tone };
  });
  return <div className="feature-page investment-page">
    <section className="investment-metrics"><article><span>{date.slice(0, 4)}년 수익률</span><strong>{netReturn(yearTrades).toFixed(1)}%</strong><small>수익 금액 {won(profitAmount(yearTrades))}</small></article><article><span>{month} 수익률</span><strong>{netReturn(monthTrades).toFixed(1)}%</strong><small>수익 금액 {won(profitAmount(monthTrades))}</small></article></section>

    <section className="settings-card"><div className="list-heading"><div className="card-heading"><span>보유 현황</span><h2>투자 종목</h2></div><div className="topic-filter-list"><Link href="/investment?sort=quantity">수량순</Link><Link href="/investment?sort=amount">거래금액순</Link></div></div><div className="investment-holdings">{sortedHoldings.slice(0, 5).map((holding) => <Link className="investment-holding" href={`/investment?symbol=${holding.id}`} key={holding.id}><div><strong>{holding.name}</strong><span>{holding.ticker}</span></div><div><strong>{holding.quantity}주</strong><span>평균 {won(holding.averagePrice)}</span></div><b>{won(holding.tradeAmount)}</b></Link>)}{sortedHoldings.length > 5 ? <Link className="home-routine-more-link" href="/investment?sort=quantity">{sortedHoldings.length - 5}개 더 보기</Link> : null}</div></section>

    <PersistentDetails className="settings-card expandable-panel" storageKey="investment-symbol-form"><summary><div className="card-heading"><span>투자 기록</span><h1>종목 추가</h1></div><span className="expand-icon">+</span></summary><form action={saveInvestmentSymbolAction} className="feature-form investment-symbol-form"><label>종목 코드<select defaultValue="" name="ticker"><option value="">코드 없음</option><option value="005930">005930 · 삼성전자</option><option value="000660">000660 · SK하이닉스</option><option value="035420">035420 · NAVER</option><option value="035720">035720 · 카카오</option></select></label><label>종목명<input name="name" placeholder="예: 삼성전자" required /></label><button className="secondary-button">종목 저장</button></form></PersistentDetails>

    <PersistentDetails className="settings-card expandable-panel" defaultOpen storageKey="investment-trade-form"><summary><div className="card-heading"><span>매매 기록</span><h1>매매일지 쓰기</h1></div><span className="expand-icon">+</span></summary><form action={saveInvestmentTradeAction} className="feature-form investment-trade-form"><label>날짜<input name="tradeDate" type="date" defaultValue={selectedDate} required /></label><label>종목<select name="symbolId" required><option value="">종목을 선택해 주세요</option>{symbols.map((symbol) => <option key={symbol.id} value={symbol.id}>{symbol.name} · {symbol.ticker}</option>)}</select></label><label>매수 / 매도<select defaultValue="buy" name="tradeType"><option value="buy">매수</option><option value="sell">매도</option></select></label><div className="form-row"><label>수량<input min="0.0001" name="quantity" step="any" type="number" required /></label><label>1주당 가격<input min="0" name="unitPrice" step="any" type="number" required /></label></div><label>총 거래금액<input min="0" name="tradeAmount" placeholder="비워두면 수량 × 가격" step="any" type="number" /></label><label>손절매 금액 (예정)<input min="0" name="expectedExitAmount" step="any" type="number" /></label><label>매수 / 매도 이유<textarea name="reason" rows={4} /></label><label>메모<textarea name="memo" rows={4} /></label><button className="primary-button">매매일지 저장</button></form></PersistentDetails>

    <section className="settings-card"><div className="card-heading"><span>투자 기록 달력</span><h2>{selectedDate} 매매일지</h2></div><ActivityCalendar month={month} selectedDate={selectedDate} title="매매 달력" values={calendarValues} hrefForDate={(value) => `/investment?month=${month}&date=${value}${query.symbol ? `&symbol=${query.symbol}` : ""}`} hrefForMonth={(value) => `/investment?month=${value}`} weekStartsOn={profile.week_starts_on}/><div className="investment-calendar-legend"><span className="buy">매수</span><span className="sell">매도</span></div>{selectedTrades.length ? <div className="feature-list">{selectedTrades.map((trade) => <article key={trade.id}><div><small>{trade.symbol?.name ?? "종목"} · {trade.trade_type === "buy" ? "매수" : "매도"}</small><h3>{trade.quantity}주 · {won(trade.unit_price)}</h3><p>거래금액 {won(trade.trade_amount)}</p>{trade.reason ? <p>{trade.reason}</p> : null}{trade.memo ? <p>{trade.memo}</p> : null}</div><form action={deleteInvestmentTradeAction}><input name="id" type="hidden" value={trade.id}/><button className="text-button danger">삭제</button></form></article>)}</div> : <p>선택한 날짜에 작성된 매매일지가 없어요.</p>}</section>

    <section className="feature-insight"><div className="card-heading"><span>AI INSIGHT</span><h2>투자 인사이트</h2></div>{insights.data?.map((insight) => <article className="selected-day-card" key={insight.id}><h3>{insight.title}</h3><AiInsight value={insight.content}/></article>)}{!insights.data?.length ? <p>선택한 날짜의 AI 인사이트가 아직 없어요.</p> : null}</section>
  </div>;
}
