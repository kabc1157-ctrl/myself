import { describe, expect, it } from "vitest";

import { enabledServiceModules } from "./modules";

describe("enabledServiceModules", () => {
  it("활성화된 메뉴를 합의한 순서로 노출한다", () => {
    expect(enabledServiceModules.map(({ id, label, href }) => ({ id, label, href }))).toEqual([
      { id: "home", label: "홈", href: "/home" },
      { id: "journal", label: "일기", href: "/journal" },
      { id: "routines", label: "루틴", href: "/routines" },
      { id: "notes", label: "메모", href: "/notes" },
      { id: "exercise", label: "운동", href: "/exercise" },
      { id: "planner", label: "일정", href: "/planner" },
      { id: "payroll", label: "월급", href: "/payroll" },
      { id: "my-page", label: "마이페이지", href: "/my-page" },
    ]);
  });
});
