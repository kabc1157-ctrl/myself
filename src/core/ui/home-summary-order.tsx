"use client";

import { useEffect, useState } from "react";

// 이음새 홈 카드 기본 순서
const DEFAULT_ORDER = [
  "/routines",
  "/journal",
  "/planner",
  "/exercise",
  "/investment",
  "/reading",
  "/payroll",
];

const STORAGE_KEY = "ieumsae-home-summary-order";

export function HomeSummaryOrder({
  children,
}: {
  children: React.ReactNode;
}) {
  const [edit, setEdit] = useState(false);

  const getGrid = () =>
    document.querySelector<HTMLElement>(".home-summary-grid");

  const cardKey = (card: Element) => {
    const link = card.matches("a")
      ? card
      : card.querySelector("a");

    return link?.getAttribute("href") ?? "";
  };

  // 저장된 순서 또는 기본 순서 적용
  useEffect(() => {
    const grid = getGrid();
    if (!grid) return;

    let savedOrder: string[] = [];

    try {
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      if (Array.isArray(stored)) {
        savedOrder = stored.filter(
          (item): item is string => typeof item === "string"
        );
      }
    } catch {
      savedOrder = [];
    }

    const order =
      savedOrder.length > 0
        ? savedOrder
        : DEFAULT_ORDER;

    const getPosition = (card: Element) => {
      const href = cardKey(card);

      const index = order.findIndex(
        (path) =>
          href === path ||
          href.startsWith(`${path}?`)
      );

      return index === -1 ? 999 : index;
    };

    Array.from(grid.children)
      .sort((a, b) => getPosition(a) - getPosition(b))
      .forEach((card) => grid.appendChild(card));
  }, []);

  // 순서 변경 편집 모드
  useEffect(() => {
    const grid = getGrid();
    if (!grid) return;

    const cards = Array.from(grid.children) as HTMLElement[];

    const navigationHandlers = new Map<
      HTMLElement,
      (event: Event) => void
    >();

    const originalHrefs = new Map<
      HTMLAnchorElement,
      string
    >();

    grid.classList.toggle("is-ordering", edit);

    cards.forEach((card, index) => {
      card.classList.toggle(
        "home-summary-card-editing",
        edit
      );

      const blockNavigation = (event: Event) => {
        if (
          edit &&
          !(
            event.target instanceof Element &&
            event.target.closest("select, option, button")
          )
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      };

      if (edit) {
        const cardLink = card.matches("a")
          ? (card as HTMLAnchorElement)
          : card.querySelector<HTMLAnchorElement>("a");

        if (cardLink) {
          originalHrefs.set(
            cardLink,
            cardLink.getAttribute("href") ?? ""
          );

          cardLink.removeAttribute("href");
        }

        card.addEventListener(
          "click",
          blockNavigation,
          true
        );

        navigationHandlers.set(
          card,
          blockNavigation
        );
      }

      if (!edit) return;

      // 카드 위치 선택 UI
      const controls = document.createElement("div");

      controls.className = "home-order-controls";

      controls.setAttribute(
        "aria-label",
        "카드 순서 변경"
      );

      const select = document.createElement("select");

      select.setAttribute(
        "aria-label",
        "카드 위치 선택"
      );

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
          if (
            targetIndex < currentCards.indexOf(card)
          ) {
            grid.insertBefore(card, target);
          } else {
            grid.insertBefore(card, target.nextSibling);
          }
        }
      };

      select.onclick = (event) => {
        event.stopPropagation();
      };

      controls.replaceChildren(select);

      card.appendChild(controls);
    });

    // 편집 모드 종료 시 정리
    return () => {
      grid.classList.remove("is-ordering");

      cards.forEach((card) => {
        card.classList.remove(
          "home-summary-card-editing"
        );

        card
          .querySelector(".home-order-controls")
          ?.remove();

        const handler = navigationHandlers.get(card);

        if (handler) {
          card.removeEventListener(
            "click",
            handler,
            true
          );
        }
      });

      originalHrefs.forEach((href, link) => {
        link.setAttribute("href", href);
      });
    };
  }, [edit]);

  // 변경된 순서 저장
  const save = () => {
    const grid = getGrid();

    if (!grid) return;

    const currentOrder = Array.from(grid.children).map(
      cardKey
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(currentOrder)
    );

    setEdit(false);
  };

  return (
    <>
      <div className="home-summary-order-tools">
        <button
          type="button"
          onClick={() => setEdit((value) => !value)}
        >
          {edit ? "닫기" : "순서 변경"}
        </button>

        {edit ? (
          <>
            <span>블록 번호 선택으로 이동</span>

            <button
              type="button"
              onClick={save}
            >
              저장
            </button>
          </>
        ) : null}
      </div>

      {children}
    </>
  );
}
