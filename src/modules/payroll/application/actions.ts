"use server";

import { revalidatePath } from "next/cache";

import { verifySession } from "@/core/auth/session";
import { getIsoWeekday } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import {
  bulkWorkShiftSchema,
  shiftIdSchema,
  workplaceIdSchema,
  workplaceSchema,
  workShiftSchema,
} from "@/modules/payroll/application/schemas";

export type PayrollFormState = {
  error?: string;
  message?: string;
};

export async function createWorkplaceAction(
  _previousState: PayrollFormState,
  formData: FormData,
): Promise<PayrollFormState> {
  const result = workplaceSchema.safeParse({
    name: formData.get("name"),
    defaultPayType: formData.get("defaultPayType"),
    defaultRate: formData.get("defaultRate"),
    payPeriodStartDay: formData.get("payPeriodStartDay"),
    payDay: formData.get("payDay"),
    defaultStartTime: formData.get("defaultStartTime") || undefined,
    defaultEndTime: formData.get("defaultEndTime") || undefined,
    defaultBreakMinutes: formData.get("defaultBreakMinutes"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("workplaces").insert({
    user_id: session.userId,
    name: result.data.name,
    default_pay_type: result.data.defaultPayType,
    default_rate: result.data.defaultRate,
    pay_period_start_day: result.data.payPeriodStartDay,
    pay_day: result.data.payDay,
    default_start_time: result.data.defaultStartTime ?? null,
    default_end_time: result.data.defaultEndTime ?? null,
    default_break_minutes: result.data.defaultBreakMinutes,
    color: "apricot",
  });

  if (error) {
    return { error: "근무지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath("/payroll");
  return { message: "근무지를 추가했습니다." };
}

export async function updateWorkplaceAction(
  _previousState: PayrollFormState,
  formData: FormData,
): Promise<PayrollFormState> {
  const workplaceId = workplaceIdSchema.safeParse(formData.get("workplaceId"));
  const result = workplaceSchema.safeParse({
    name: formData.get("name"),
    defaultPayType: formData.get("defaultPayType"),
    defaultRate: formData.get("defaultRate"),
    payPeriodStartDay: formData.get("payPeriodStartDay"),
    payDay: formData.get("payDay"),
    defaultStartTime: formData.get("defaultStartTime") || undefined,
    defaultEndTime: formData.get("defaultEndTime") || undefined,
    defaultBreakMinutes: formData.get("defaultBreakMinutes"),
  });
  if (!workplaceId.success || !result.success) {
    return { error: result.success ? "근무지를 확인해 주세요." : result.error.issues[0]?.message };
  }
  await verifySession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("workplaces").update({
    name: result.data.name,
    default_pay_type: result.data.defaultPayType,
    default_rate: result.data.defaultRate,
    pay_period_start_day: result.data.payPeriodStartDay,
    pay_day: result.data.payDay,
    default_start_time: result.data.defaultStartTime ?? null,
    default_end_time: result.data.defaultEndTime ?? null,
    default_break_minutes: result.data.defaultBreakMinutes,
    updated_at: new Date().toISOString(),
  }).eq("id", workplaceId.data);
  if (error) return { error: "근무지 정보를 수정하지 못했습니다." };
  revalidatePath("/payroll");
  return { message: "근무지 정보를 수정했습니다." };
}

export async function createWorkShiftAction(
  _previousState: PayrollFormState,
  formData: FormData,
): Promise<PayrollFormState> {
  const result = workShiftSchema.safeParse({
    workplaceId: formData.get("workplaceId"),
    workDate: formData.get("workDate"),
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
    breakMinutes: formData.get("breakMinutes"),
    payType: formData.get("payType"),
    payRate: formData.get("payRate"),
    quantity: formData.get("quantity"),
    additionalPay: formData.get("additionalPay"),
    memo: formData.get("memo") || undefined,
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const workplace = await supabase
    .from("workplaces")
    .select("id")
    .eq("id", result.data.workplaceId)
    .maybeSingle();

  if (workplace.error || !workplace.data) {
    return { error: "사용할 수 있는 근무지를 선택해 주세요." };
  }

  const { error } = await supabase.from("work_shifts").insert({
    workplace_id: result.data.workplaceId,
    user_id: session.userId,
    work_date: result.data.workDate,
    start_time: result.data.startTime ?? null,
    end_time: result.data.endTime ?? null,
    break_minutes: result.data.breakMinutes,
    pay_type: result.data.payType,
    pay_rate: result.data.payRate,
    quantity: result.data.quantity,
    additional_pay: result.data.additionalPay,
    memo: result.data.memo ?? null,
  });

  if (error) {
    return { error: "근무 기록을 저장하지 못했습니다. 입력값을 확인해 주세요." };
  }

  revalidatePath("/payroll");
  return { message: "근무 기록을 추가했습니다." };
}

export async function deleteWorkShiftAction(formData: FormData) {
  const shiftId = shiftIdSchema.parse(formData.get("shiftId"));
  await verifySession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("work_shifts").delete().eq("id", shiftId);

  if (error) {
    throw new Error(`Failed to delete work shift: ${error.message}`);
  }

  revalidatePath("/payroll");
}

export async function quickAddWorkShiftAction(formData: FormData) {
  const workplaceId = workplaceIdSchema.parse(formData.get("workplaceId"));
  const workDate = String(formData.get("workDate") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) throw new Error("Invalid work date");
  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const { data: workplace, error: workplaceError } = await supabase.from("workplaces").select("*").eq("id", workplaceId).maybeSingle();
  if (workplaceError || !workplace) throw new Error("Workplace not found");
  const { data: existing } = await supabase.from("work_shifts").select("id").eq("workplace_id", workplaceId).eq("work_date", workDate).limit(1);
  if (existing?.length) return;
  const { error } = await supabase.from("work_shifts").insert({
    workplace_id: workplaceId,
    user_id: session.userId,
    work_date: workDate,
    start_time: workplace.default_pay_type === "hourly" ? workplace.default_start_time : null,
    end_time: workplace.default_pay_type === "hourly" ? workplace.default_end_time : null,
    break_minutes: workplace.default_break_minutes,
    pay_type: workplace.default_pay_type,
    pay_rate: workplace.default_rate,
    quantity: 1,
    additional_pay: 0,
  });
  if (error) throw new Error(`Failed to quick add shift: ${error.message}`);
  revalidatePath("/payroll");
}

export async function bulkAddWorkShiftsAction(
  _previousState: PayrollFormState,
  formData: FormData,
): Promise<PayrollFormState> {
  const result = bulkWorkShiftSchema.safeParse({
    workplaceId: formData.get("workplaceId"),
    month: formData.get("month"),
    weekdays: formData.getAll("weekdays"),
  });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "입력값을 확인해 주세요." };

  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const { data: workplace, error: workplaceError } = await supabase
    .from("workplaces")
    .select("*")
    .eq("id", result.data.workplaceId)
    .maybeSingle();
  if (workplaceError || !workplace) return { error: "사용할 수 있는 근무지를 선택해 주세요." };
  if (workplace.default_pay_type === "hourly" && (!workplace.default_start_time || !workplace.default_end_time)) {
    return { error: "근무지의 기본 시작·종료 시간을 먼저 설정해 주세요." };
  }

  const [yearText, monthText] = result.data.month.split("-");
  const daysInMonth = new Date(Date.UTC(Number(yearText), Number(monthText), 0)).getUTCDate();
  const dates = Array.from({ length: daysInMonth }, (_, index) => `${result.data.month}-${String(index + 1).padStart(2, "0")}`)
    .filter((workDate) => result.data.weekdays.includes(getIsoWeekday(workDate)));
  const { data: existing, error: existingError } = await supabase
    .from("work_shifts")
    .select("work_date")
    .eq("workplace_id", workplace.id)
    .gte("work_date", `${result.data.month}-01`)
    .lte("work_date", `${result.data.month}-${String(daysInMonth).padStart(2, "0")}`);
  if (existingError) return { error: "기존 근무 기록을 확인하지 못했습니다." };

  const existingDates = new Set(existing?.map((shift) => shift.work_date) ?? []);
  const newDates = dates.filter((workDate) => !existingDates.has(workDate));
  if (newDates.length === 0) return { message: "선택한 요일의 근무가 이미 모두 등록되어 있어요." };

  const { error } = await supabase.from("work_shifts").insert(newDates.map((workDate) => ({
    workplace_id: workplace.id,
    user_id: session.userId,
    work_date: workDate,
    start_time: workplace.default_pay_type === "hourly" ? workplace.default_start_time : null,
    end_time: workplace.default_pay_type === "hourly" ? workplace.default_end_time : null,
    break_minutes: workplace.default_break_minutes,
    pay_type: workplace.default_pay_type,
    pay_rate: workplace.default_rate,
    quantity: 1,
    additional_pay: 0,
  })));
  if (error) return { error: "한 달 근무를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요." };

  revalidatePath("/payroll");
  return { message: `${newDates.length}일의 근무를 한 번에 등록했습니다.` };
}

export async function updateWorkShiftAction(
  _previousState: PayrollFormState,
  formData: FormData,
): Promise<PayrollFormState> {
  const shiftId = shiftIdSchema.safeParse(formData.get("shiftId"));
  const result = workShiftSchema.safeParse({
    workplaceId: formData.get("workplaceId"), workDate: formData.get("workDate"),
    startTime: formData.get("startTime") || undefined, endTime: formData.get("endTime") || undefined,
    breakMinutes: formData.get("breakMinutes"), payType: formData.get("payType"), payRate: formData.get("payRate"),
    quantity: formData.get("quantity"), additionalPay: formData.get("additionalPay"), memo: formData.get("memo") || undefined,
  });
  if (!shiftId.success || !result.success) return { error: result.success ? "근무 기록을 확인해 주세요." : result.error.issues[0]?.message };
  await verifySession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("work_shifts").update({
    work_date: result.data.workDate, start_time: result.data.startTime ?? null, end_time: result.data.endTime ?? null,
    break_minutes: result.data.breakMinutes, pay_type: result.data.payType, pay_rate: result.data.payRate,
    quantity: result.data.quantity, additional_pay: result.data.additionalPay, memo: result.data.memo ?? null,
    updated_at: new Date().toISOString(),
  }).eq("id", shiftId.data).eq("workplace_id", result.data.workplaceId);
  if (error) return { error: "근무 기록을 수정하지 못했습니다." };
  revalidatePath("/payroll");
  return { message: "근무 기록을 수정했습니다." };
}
