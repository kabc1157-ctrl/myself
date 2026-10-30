import { describe, expect, it } from "vitest";

import { splitBottomNavigationModules } from "./bottom-navigation";
import { enabledServiceModules } from "./modules";

describe("enabledServiceModules", () => {
  it("활성화된 메뉴를 합의한 순서로 노출한다", () => {
    expect(enabledServiceModules.map(({ id, label, href }) => ({ id, label, href }))).toEqual([
      { id: "home", label: "홈", href: "/home" },
      { id: "journal", label: "일기", href: "/journal" },
      { id: "routines", label: "루틴", href: "/routines" },
      { id: "notes", label: "메모", href: "/notes" },
      { id: "reading", label: "독서", href: "/reading" },
      { id: "exercise", label: "운동", href: "/exercise" },
      { id: "planner", label: "일정", href: "/planner" },
      { id: "investment", label: "투자", href: "/investment" },
      { id: "payroll", label: "월급", href: "/payroll" },
      { id: "my-page", label: "마이페이지", href: "/my-page" },
    ]);
  });
});

describe("splitBottomNavigationModules", () => {
  it("고정 메뉴는 최대 네 개, 나머지는 더보기 메뉴로 나눈다", () => {
    const result = splitBottomNavigationModules(enabledServiceModules.slice(0, 8));
    expect(result.primary.map(({ id }) => id)).toEqual(["home", "journal", "routines", "notes"]);
    expect(result.overflow.map(({ id }) => id)).toEqual(["reading", "exercise", "planner", "investment"]);
  });
});
