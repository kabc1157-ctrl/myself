export type PayType = "hourly" | "daily" | "per_task" | "bonus";

export type PayableShift = {
  workDate: string;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number;
  payType: PayType;
  payRate: number;
  quantity: number;
  additionalPay: number;
};

export const payTypeLabels: Record<PayType, string> = {
  hourly: "시급",
  daily: "일급",
  per_task: "건별",
  bonus: "상여",
};

function timeToMinutes(time: string): number {
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  return hour * 60 + minute;
}

export function getWorkedMinutes(shift: PayableShift): number | null {
  if (!shift.startTime || !shift.endTime) {
    return null;
  }

  const start = timeToMinutes(shift.startTime);
  let end = timeToMinutes(shift.endTime);
  if (end < start) {
    end += 24 * 60;
  }

  return Math.max(0, end - start - shift.breakMinutes);
}

export function calculateShiftPay(shift: PayableShift): number {
  let basePay: number;

  if (shift.payType === "hourly") {
    const workedMinutes = getWorkedMinutes(shift) ?? 0;
    basePay = (workedMinutes / 60) * shift.payRate * shift.quantity;
  } else {
    basePay = shift.payRate * shift.quantity;
  }

  return Math.round(basePay + shift.additionalPay);
}

export function formatWon(amount: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(amount))}원`;
}
