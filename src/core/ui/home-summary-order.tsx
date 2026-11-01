"use client";

import { useEffect, useState } from "react";

export function HomeSummaryOrder({ children }: { children: React.ReactNode }) {
  const [edit, setEdit] = useState(false);
  const getGrid = () => document.querySelector<HTMLElement>(".home-summary-grid");
  const cardKey = (card: Element) => {
    const link = card.matches("a") ? card : card.querySelector("a");
    return link?.getAttribute("href") ?? "";
  };

  useEffect(() => {
    const grid = getGrid();
    if (!grid) return;
    const saved = JSON.parse(localStorage.getItem("ieumsae-home-summary-order") || "[]") as string[];
    const usableSaved = saved.filter(Boolean);
    if (usableSaved.length === 0) return;
    [...Array.from(grid.children)].sort((a, b) => {
      const ai = usableSaved.indexOf(cardKey(a)); const bi = usableSaved.indexOf(cardKey(b));
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    }).forEach((card) => grid.appendChild(card));
  }, []);

  useEffect(() => {
    const grid = getGrid();
    if (!grid) return;
    const cards = Array.from(grid.children) as HTMLElement[];
    const navigationHandlers = new Map<HTMLElement, (event: Event) => void>();
    const originalHrefs = new Map<HTMLAnchorElement, string>();
    grid.classList.toggle("is-ordering", edit);
    cards.forEach((card, index) => {
      card.classList.toggle("home-summary-card-editing", edit);
      const blockNavigation = (event: Event) => {
        if (edit && !(event.target instanceof Element && event.target.closest("select, option, button"))) {
          event.preventDefault();
          event.stopPropagation();
        }
      };
      if (edit) {
        const cardLink = card.matches("a") ? card as HTMLAnchorElement : card.querySelector<HTMLAnchorElement>("a");
        if (cardLink) {
          originalHrefs.set(cardLink, cardLink.getAttribute("href") ?? "");
          cardLink.removeAttribute("href");
        }
        card.addEventListener("click", blockNavigation, true);
        navigationHandlers.set(card, blockNavigation);
      }
      if (!edit) return;
      const controls = document.createElement("div");
      controls.className = "home-order-controls";
      controls.setAttribute("aria-label", "카드 순서 변경");
      const select = document.createElement("select");
      select.setAttribute("aria-label", "카드 위치 선택");
      cards.forEach((_, position) => {
        const option = document.createElement("option");
        option.value = String(position);
        option.textContent = `${position + 1}번`;
        option.selected = position === index;
        select.appendChild(option);
      });
      select.onchange = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const targetIndex = Number(select.value);
        const currentCards = Array.from(grid.children);
        const target = currentCards[targetIndex];
        if (target && target !== card) {
          if (targetIndex < currentCards.indexOf(card)) grid.insertBefore(card, target);
          else grid.insertBefore(card, target.nextSibling);
        }
      };
      select.onclick = (event) => event.stopPropagation();
      controls.replaceChildren(select); card.appendChild(controls);
    });
    return () => {
      grid.classList.remove("is-ordering");
      cards.forEach((card) => {
        card.classList.remove("home-summary-card-editing");
        card.querySelector(".home-order-controls")?.remove();
        const handler = navigationHandlers.get(card);
        if (handler) card.removeEventListener("click", handler, true);
      });
      originalHrefs.forEach((href, link) => link.setAttribute("href", href));
    };
  }, [edit]);

  const save = () => {
    const grid = getGrid();
    if (!grid) return;
    localStorage.setItem("ieumsae-home-summary-order", JSON.stringify(Array.from(grid.children).map(cardKey)));
    setEdit(false);
  };

  return <>
    <div className="home-summary-order-tools">
      <button type="button" onClick={() => setEdit((value) => !value)}>{edit ? "닫기" : "순서 변경"}</button>
      {edit ? <><span>블록 번호 선택으로 이동</span><button type="button" onClick={save}>저장</button></> : null}
    </div>
    {children}
  </>;
}
