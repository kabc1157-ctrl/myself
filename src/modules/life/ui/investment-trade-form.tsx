"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { saveInvestmentTradeAction } from "@/modules/life/application/actions";

type SymbolOption = { id: string; name: string; ticker: string };
type Trade = { id: string; symbol_id: string; trade_date: string; trade_type: string; quantity: number; unit_price: number; trade_amount: number; expected_exit_amount: number | null; reason: string | null; memo: string | null };
function SaveButton({ editing }: { editing: boolean }) { const { pending } = useFormStatus(); const router = useRouter(); const finish = () => { if (editing && !pending) { const url = new URL(window.location.href); url.searchParams.delete("edit"); router.replace(url.pathname + url.search, { scroll: false }); } }; return <button className="primary-button" onClick={finish} type="submit">{pending ? "저장 중…" : editing ? "매매 기록 수정" : "매매일지 저장"}</button>; }

export function InvestmentTradeForm({ date, symbols, trade }: { date: string; symbols: SymbolOption[]; trade?: Trade }) {
  const [quantity, setQuantity] = useState(String(trade?.quantity ?? ""));
  const [unitPrice, setUnitPrice] = useState(String(trade?.unit_price ?? ""));
  const amount = useMemo(() => (Number(quantity) || 0) * (Number(unitPrice) || 0), [quantity, unitPrice]);
  return <form action={saveInvestmentTradeAction} className="feature-form investment-trade-form">
    {trade ? <input name="id" type="hidden" value={trade.id}/> : null}
    <label>날짜<input name="tradeDate" type="date" defaultValue={trade?.trade_date ?? date} required /></label>
    <label>종목<select name="symbolId" defaultValue={trade?.symbol_id ?? ""} required><option value="">종목을 선택해 주세요</option>{symbols.map((symbol) => <option key={symbol.id} value={symbol.id}>{symbol.name}{symbol.ticker.startsWith("NAME-") ? "" : ` · ${symbol.ticker}`}</option>)}</select></label>
    <label>매수 / 매도<select defaultValue={trade?.trade_type ?? "buy"} name="tradeType"><option value="buy">매수</option><option value="sell">매도</option></select></label>
    <div className="form-row"><label>수량<input min="0.0001" name="quantity" onChange={(event) => setQuantity(event.target.value)} step="any" type="number" value={quantity} required /></label><label>1주당 가격<input min="0" name="unitPrice" onChange={(event) => setUnitPrice(event.target.value)} step="any" type="number" value={unitPrice} required /></label></div>
    <label>총 거래금액<input name="tradeAmount" readOnly value={amount || ""} placeholder="수량 × 단가로 자동 계산" /></label>
    <label>손절매 금액 (예정)<input defaultValue={trade?.expected_exit_amount ?? ""} min="0" name="expectedExitAmount" step="any" type="number" /></label>
    <label>매수 / 매도 이유<textarea defaultValue={trade?.reason ?? ""} name="reason" rows={4} /></label>
    <label>메모<textarea defaultValue={trade?.memo ?? ""} name="memo" rows={4} /></label>
    <SaveButton editing={Boolean(trade)} />
  </form>;
}
