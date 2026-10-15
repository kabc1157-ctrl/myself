export type ServiceModule = {
  id: string;
  label: string;
  href: string;
  icon: string;
  description: string;
};

export const enabledServiceModules = [
  {
    id: "journal",
    label: "일기",
    href: "/journal",
    icon: "✎",
    description: "오늘의 마음과 최근 기록",
  },
  {
    id: "routines",
    label: "루틴",
    href: "/routines",
    icon: "✓",
    description: "오늘의 루틴과 회고",
  },
  {
    id: "payroll",
    label: "월급",
    href: "/payroll",
    icon: "₩",
    description: "근무 기록과 예상 금액",
  },
  {
    id: "my-page",
    label: "마이페이지",
    href: "/my-page",
    icon: "○",
    description: "계정과 서비스 설정",
  },
] as const satisfies readonly ServiceModule[];
