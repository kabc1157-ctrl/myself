"use server";

import { revalidatePath } from "next/cache";

import { verifySession } from "@/core/auth/session";
import { getLocalDate, shiftDate } from "@/core/date/local-date";
import { createServerSupabaseClient } from "@/core/db/supabase/server";
import { getOrCreateProfile } from "@/core/user/profile-repository";
import {
  createRoutineSchema,
  reviewSchema,
  routineDateSchema,
  routineIdSchema,
  updateRoutineSchema,
} from "@/modules/routines/application/schemas";
import { getRoutineDay } from "@/modules/routines/infrastructure/routine-repository";

export type RoutineFormState = {
  error?: string;
  message?: string;
};

async function getRoutineRequestContext() {
  const session = await verifySession();
  const supabase = await createServerSupabaseClient();
  const profile = await getOrCreateProfile(supabase, session.userId);

  return {
    session,
    supabase,
    date: getLocalDate(profile.timezone),
  };
}

export async function createRoutineAction(
  _previousState: RoutineFormState,
  formData: FormData,
): Promise<RoutineFormState> {
  const result = createRoutineSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    weekdays: formData.getAll("weekdays"),
    preferredTime: formData.get("preferredTime") || undefined,
    timePeriod: formData.get("timePeriod") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { supabase } = await getRoutineRequestContext();
  const optionalArgs = {
    ...(result.data.description ? { p_description: result.data.description } : {}),
    ...(result.data.preferredTime ? { p_preferred_time: result.data.preferredTime } : {}),
  };
  const { data: routineId, error } = await supabase.rpc("create_routine_with_schedule", {
    p_name: result.data.name,
    p_start_date: result.data.startDate,
    p_weekdays: result.data.weekdays,
    p_color: "sage",
    ...optionalArgs,
  });

  if (error) {
    return { error: "루틴을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  if (result.data.endDate && routineId) {
    const { error: endDateError } = await supabase
      .from("routines")
      .update({ end_date: result.data.endDate })
      .eq("id", routineId);
    if (endDateError) return { error: "루틴 종료일을 저장하지 못했습니다." };
  }

  if (result.data.timePeriod && routineId) {
    const { error: periodError } = await supabase
      .from("routine_schedule_versions")
      .update({ time_period: result.data.timePeriod })
      .eq("routine_id", routineId)
      .eq("effective_from", result.data.startDate);
    if (periodError) return { error: "루틴 시간대를 저장하지 못했습니다." };
  }

  revalidatePath("/routines");
  return { message: "루틴을 추가했습니다." };
}

export async function toggleRoutineCompletionAction(formData: FormData) {
  const routineId = routineIdSchema.parse(formData.get("routineId"));
  const context = await getRoutineRequestContext();
  const requestedDate = formData.get("routineDate");
  const date = requestedDate ? routineDateSchema.parse(requestedDate) : context.date;
  const { session, supabase } = context;
  const day = await getRoutineDay(supabase, date);
  const item = day.items.find((candidate) => candidate.id === routineId);

  if (!item) {
    throw new Error("Today's scheduled routine was not found");
  }

  if (item.completed) {
    const { error } = await supabase
      .from("routine_completions")
      .delete()
      .eq("routine_id", routineId)
      .eq("routine_date", date);

    if (error) {
      throw new Error(`Failed to remove routine completion: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from("routine_completions").insert({
      routine_id: routineId,
      user_id: session.userId,
      routine_date: date,
    });

    if (error) {
      throw new Error(`Failed to complete routine: ${error.message}`);
    }
  }

  revalidatePath("/routines");
  revalidatePath("/home");
}

export async function updateRoutineAction(
  _previousState: RoutineFormState,
  formData: FormData,
): Promise<RoutineFormState> {
  const result = updateRoutineSchema.safeParse({
    routineId: formData.get("routineId"),
    name: formData.get("name"),
    weekdays: formData.getAll("weekdays"),
    preferredTime: formData.get("preferredTime") || undefined,
    timePeriod: formData.get("timePeriod") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
  });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "입력값을 확인해 주세요." };

  const { session, supabase } = await getRoutineRequestContext();
  const now = new Date().toISOString();
  const { error: routineError } = await supabase
    .from("routines")
    .update({ name: result.data.name, start_date: result.data.startDate, end_date: result.data.endDate || null, updated_at: now })
    .eq("id", result.data.routineId)
    .eq("user_id", session.userId);
  if (routineError) return { error: "루틴 기본 정보를 수정하지 못했습니다." };

  const { data: latestSchedule, error: scheduleReadError } = await supabase
    .from("routine_schedule_versions")
    .select("id")
    .eq("routine_id", result.data.routineId)
    .eq("user_id", session.userId)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (scheduleReadError || !latestSchedule) return { error: "루틴 실행 일정을 찾지 못했습니다." };

  const { error: scheduleError } = await supabase
    .from("routine_schedule_versions")
    .update({
      effective_from: result.data.startDate,
      weekdays: result.data.weekdays,
      preferred_time: result.data.preferredTime || null,
      time_period: result.data.timePeriod || null,
    })
    .eq("id", latestSchedule.id)
    .eq("user_id", session.userId);
  if (scheduleError) return { error: "루틴 실행 일정을 수정하지 못했습니다." };

  revalidatePath("/routines");
  revalidatePath("/home");
  return { message: "루틴을 수정했습니다." };
}

export async function archiveRoutineAction(formData: FormData) {
  const routineId = routineIdSchema.parse(formData.get("routineId"));
  const { supabase } = await getRoutineRequestContext();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("routines")
    .update({ archived_at: now, updated_at: now })
    .eq("id", routineId);

  if (error) {
    throw new Error(`Failed to archive routine: ${error.message}`);
  }

  revalidatePath("/routines");
}

export async function restoreRoutineAction(formData: FormData) {
  const routineId = routineIdSchema.parse(formData.get("routineId"));
  const { supabase } = await getRoutineRequestContext();
  const { error } = await supabase
    .from("routines")
    .update({ archived_at: null, updated_at: new Date().toISOString() })
    .eq("id", routineId);
  if (error) throw new Error(`Failed to restore routine: ${error.message}`);
  revalidatePath("/routines");
}

export async function deleteRoutineAction(formData: FormData) {
  const routineId = routineIdSchema.parse(formData.get("routineId"));
  const { supabase } = await getRoutineRequestContext();
  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", routineId)
    .not("archived_at", "is", null);
  if (error) throw new Error(`Failed to delete routine: ${error.message}`);
  revalidatePath("/routines");
}

export async function saveDailyReviewAction(
  _previousState: RoutineFormState,
  formData: FormData,
): Promise<RoutineFormState> {
  const result = reviewSchema.safeParse({
    reflection: formData.get("reflection"),
    reviewDate: formData.get("reviewDate"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "회고를 확인해 주세요." };
  }

  const { session, supabase, date } = await getRoutineRequestContext();
  if (result.data.reviewDate !== date && result.data.reviewDate !== shiftDate(date, -1)) {
    return { error: "오늘 또는 전날 회고만 작성할 수 있어요." };
  }
  const day = await getRoutineDay(supabase, result.data.reviewDate);
  const now = new Date().toISOString();
  const { error } = await supabase.from("routine_daily_reviews").upsert(
    {
      user_id: session.userId,
      review_date: result.data.reviewDate,
      reflection: result.data.reflection,
      completion_count: day.completedCount,
      total_count: day.totalCount,
      updated_at: now,
    },
    { onConflict: "user_id,review_date" },
  );

  if (error) {
    return { error: "회고를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath("/routines");
  return { message: result.data.reviewDate === date ? "오늘의 회고를 저장했습니다." : "전날 회고를 저장했습니다." };
}
