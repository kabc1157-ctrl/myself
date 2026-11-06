"use client";

import { useState, useTransition } from "react";
import { deleteInvestmentTradeAction } from "@/modules/life/application/actions";
import { InvestmentTradeForm } from "@/modules/life/ui/investment-trade-form";

type SymbolOption = { id: string; name: string; ticker: string };
type Trade = { id: string; symbol_id: string; trade_date: string; trade_type: string; quantity: number; unit_price: number; trade_amount: number; expected_exit_amount: number | null; reason: string | null; memo: string | null; symbol?: { name: string; ticker: string } | null };
const won = (value: number) => new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value);

export function InvestmentTradeCard({ trade, symbols }: { trade: Trade; symbols: SymbolOption[] }) {
  const [editing, setEditing] = useState(false); const [pendingDelete, startDelete] = useTransition();
  const remove = () => { if (!window.confirm("이 매매 기록을 삭제할까요?")) return; const position = window.scrollY; const data = new FormData(); data.set("id", trade.id); startDelete(async () => { await deleteInvestmentTradeAction(data); requestAnimationFrame(() => window.scrollTo({ top: position, behavior: "instant" })); setEditing(false); }); };
  const isBuy = trade.trade_type === "buy";
  return <article className={isBuy ? "investment-trade-buy" : "investment-trade-sell"}>
    <div>
      <small>{trade.symbol?.name ?? "종목"} · {isBuy ? "매수" : "매도"} · {trade.trade_date}</small>
      <h3>{trade.quantity}주 · {won(trade.unit_price)}</h3>
      <p>거래금액 {won(trade.trade_amount)}</p>
      {trade.reason ? <p className="investment-trade-reason"><strong>{trade.reason}</strong></p> : null}
      {trade.memo ? <p>{trade.memo}</p> : null}
    </div>
    <div className="inline-actions">
      <button className="archive-button" onClick={() => setEditing((value) => !value)} type="button">{editing ? "수정 닫기" : "수정"}</button>
      <button className="text-button danger" disabled={pendingDelete} onClick={remove} type="button">{pendingDelete ? "삭제 중…" : "삭제"}</button>
    </div>
    {editing ? <div className="investment-inline-edit"><InvestmentTradeForm date={trade.trade_date} symbols={symbols} trade={trade} onSaved={() => setEditing(false)} /></div> : null}
  </article>;
}
