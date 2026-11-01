"use client";

import { useEffect, useState } from "react";

export function HomeSummaryOrder({ children }: { children: React.ReactNode }) {
  const [edit, setEdit] = useState(false);
  const getGrid = () => document.querySelector<HTMLElement>(".home-summary-grid");
  const cardKey = (card: Element) => card.querySelector("a")?.getAttribute("href") ?? "";

  useEffect(() => {
    const grid = getGrid();
    if (!grid) return;
    const saved = JSON.parse(localStorage.getItem("ieumsae-home-summary-order") || "[]") as string[];
    [...Array.from(grid.children)].sort((a, b) => {
      const ai = saved.indexOf(cardKey(a)); const bi = saved.indexOf(cardKey(b));
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    }).forEach((card) => grid.appendChild(card));
  }, []);

  useEffect(() => {
    const grid = getGrid();
    if (!grid) return;
    const cards = Array.from(grid.children) as HTMLElement[];
    cards.forEach((card) => {
      card.classList.toggle("home-summary-card-editing", edit);
      if (!edit) return;
      const controls = document.createElement("div");
      controls.className = "home-order-controls";
      controls.setAttribute("aria-label", "카드 순서 변경");
      const up = document.createElement("button"); up.type = "button"; up.textContent = "↑"; up.setAttribute("aria-label", "위로 이동");
      const down = document.createElement("button"); down.type = "button"; down.textContent = "↓"; down.setAttribute("aria-label", "아래로 이동");
      up.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const previous = card.previousElementSibling;
        if (previous) grid.insertBefore(card, previous);
      };
      down.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const next = card.nextElementSibling;
        if (next) grid.insertBefore(next, card);
      };
      controls.append(up, down); card.appendChild(controls);
    });
    return () => cards.forEach((card) => { card.classList.remove("home-summary-card-editing"); card.querySelector(".home-order-controls")?.remove(); });
  }, [edit]);

  const save = () => {
    const grid = getGrid();
    if (!grid) return;
    localStorage.setItem("ieumsae-home-summary-order", JSON.stringify(Array.from(grid.children).map(cardKey)));
    setEdit(false);
  };

  return <>
    <div className="home-summary-order-tools">
      <button type="button" onClick={() => setEdit((value) => !value)}>{edit ? "순서 변경 닫기" : "순서 변경"}</button>
      {edit ? <><span>각 카드의 ↑↓ 버튼으로 이동</span><button type="button" onClick={save}>저장</button></> : null}
    </div>
    {children}
  </>;
}
