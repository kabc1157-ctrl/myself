import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getMonthRange } from "@/core/date/local-date";
import type { Database } from "@/core/db/database.types";
import { calculateShiftPay, getWorkedMinutes, type PayType } from "@/modules/payroll/domain/payroll";

export async function getPayrollOverview(
  supabase: SupabaseClient<Database>,
  month: string,
) {
  const { start, endExclusive } = getMonthRange(month);
  const [workplacesResult, shiftsResult] = await Promise.all([
    supabase
      .from("workplaces")
      .select("*")
      .is("archived_at", null)
      .or(`end_date.is.null,end_date.gte.${start}`)
      .order("created_at"),
    supabase
      .from("work_shifts")
      .select("*")
      .gte("work_date", start)
      .lt("work_date", endExclusive)
      .order("work_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (workplacesResult.error) {
    throw new Error(`Failed to read workplaces: ${workplacesResult.error.message}`);
  }
  if (shiftsResult.error) {
    throw new Error(`Failed to read work shifts: ${shiftsResult.error.message}`);
  }

  const shifts = shiftsResult.data.map((shift) => {
    const payableShift = {
      workDate: shift.work_date,
      startTime: shift.start_time,
      endTime: shift.end_time,
      breakMinutes: shift.break_minutes,
      payType: shift.pay_type as PayType,
      payRate: shift.pay_rate,
      quantity: shift.quantity,
      additionalPay: shift.additional_pay,
    };
    return {
      ...shift,
      calculatedPay: calculateShiftPay(payableShift),
      workedMinutes: getWorkedMinutes(payableShift),
    };
  });

  const workplaceSummaries = workplacesResult.data.map((workplace) => {
    const workplaceShifts = shifts.filter((shift) => shift.workplace_id === workplace.id);
    return {
      ...workplace,
      shiftCount: workplaceShifts.length,
      totalPay: workplaceShifts.reduce((sum, shift) => sum + shift.calculatedPay, 0),
    };
  });

  const dailyTotals = shifts.reduce<Record<string, number>>((totals, shift) => {
    totals[shift.work_date] = (totals[shift.work_date] ?? 0) + shift.calculatedPay;
    return totals;
  }, {});

  return {
    workplaces: workplacesResult.data,
    workplaceSummaries,
    shifts,
    dailyTotals,
    totalPay: shifts.reduce((sum, shift) => sum + shift.calculatedPay, 0),
  };
}
