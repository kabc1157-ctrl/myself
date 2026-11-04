"use client";

import { useState } from "react";

type NavigationOption = { id: string; label: string };

export function NavigationOrderForm({ options, initialOrder, action }: { options: NavigationOption[]; initialOrder: string[]; action: (formData: FormData) => void }) {
  const [order, setOrder] = useState(() => [...new Set([...initialOrder, ...options.map((option) => option.id)])]);
  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= order.length) return;
    setOrder((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  return <form action={action} className="feature-form"><input name="order" type="hidden" value={JSON.stringify(order)} readOnly /><p className="form-hint">+ 메뉴에서 보이는 순서입니다.</p><ol className="navigation-order-list">{order.map((id, index) => { const option = options.find((item) => item.id === id); if (!option) return null; return <li key={id}><span>{option.label}</span><span><button aria-label={`${option.label} 위로`} className="text-button" disabled={index === 0} onClick={() => move(index, -1)} type="button">↑</button><button aria-label={`${option.label} 아래로`} className="text-button" disabled={index === order.length - 1} onClick={() => move(index, 1)} type="button">↓</button></span></li>; })}</ol><button className="secondary-button" type="submit">메뉴 순서 저장</button></form>;
}
