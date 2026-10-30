export type ServiceModule = {
  id: string;
  label: string;
  href: string;
  icon: string;
  description: string;
};

export const enabledServiceModules = [
  {
    id: "home",
    label: "홈",
    href: "/home",
    icon: "⌂",
    description: "오늘의 생활 요약",
  },
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
  { id: "notes", label: "메모", href: "/notes", icon: "▤", description: "주제별 메모" },
  { id: "reading", label: "독서", href: "/reading", icon: "▥", description: "책과 생각 기록" },
  { id: "exercise", label: "운동", href: "/exercise", icon: "◇", description: "운동 기록과 인사이트" },
  { id: "planner", label: "일정", href: "/planner", icon: "□", description: "브레인 덤프와 시간표" },
  { id: "investment", label: "투자", href: "/investment", icon: "₿", description: "매매 일지와 투자 기록" },
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

export type ServiceModuleId = (typeof enabledServiceModules)[number]["id"];
