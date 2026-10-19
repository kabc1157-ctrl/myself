import { describe, expect, it } from "vitest";

import { enabledServiceModules } from "./modules";

describe("enabledServiceModules", () => {
  it("첫 출시 메뉴를 합의한 순서로 노출한다", () => {
    expect(enabledServiceModules.map(({ id, label, href }) => ({ id, label, href }))).toEqual([
      { id: "home", label: "홈", href: "/home" },
      { id: "journal", label: "일기", href: "/journal" },
      { id: "routines", label: "루틴", href: "/routines" },
      { id: "payroll", label: "월급", href: "/payroll" },
      { id: "my-page", label: "마이페이지", href: "/my-page" },
    ]);
  });
});
