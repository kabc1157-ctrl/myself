import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { getLocalDate } from "@/core/date/local-date";
import { buildRoutineDay } from "@/modules/routines/domain/routine-day";
import { hashRoutineWidgetToken } from "@/core/widgets/routine-widget-token";

export const dynamic = "force-dynamic";

async function authenticate(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return null;
  const supabase = createAdminSupabaseClient() as any;
  const { data } = await supabase.from("routine_widget_tokens").select("user_id").eq("token_hash", hashRoutineWidgetToken(token)).is("revoked_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
  return data?.user_id ? { supabase, userId: data.user_id } : null;
}

export async function GET(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth) return NextResponse.json({ error: "위젯 인증이 만료되었어요." }, { status: 401 });
    const { supabase, userId } = auth;
    const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle();
    const date = getLocalDate(profile?.timezone || "Asia/Seoul");
    const { data: routines, error } = await supabase.from("routines").select("*").eq("user_id", userId).is("archived_at", null).lte("start_date", date).order("sort_order").order("created_at");
    if (error) throw error;
    const ids = (routines ?? []).map((routine: any) => routine.id);
    const [scheduleResult, completionResult] = ids.length ? await Promise.all([
      supabase.from("routine_schedule_versions").select("*").eq("user_id", userId).in("routine_id", ids).lte("effective_from", date).order("effective_from", { ascending: false }),
      supabase.from("routine_completions").select("*").eq("user_id", userId).in("routine_id", ids).eq("routine_date", date),
    ]) : [{ data: [], error: null }, { data: [], error: null }];
    if (scheduleResult.error || completionResult.error) throw scheduleResult.error ?? completionResult.error;
    const day = buildRoutineDay(date, routines ?? [], scheduleResult.data ?? [], completionResult.data ?? []);
    return NextResponse.json({ date, completedCount: day.completedCount, totalCount: day.totalCount, completionRate: day.completionRate, routines: day.items.filter((item) => !item.completed).map((item) => ({ id: item.id, name: item.name, schedule: [item.preferredTime, item.timePeriod].filter(Boolean).join(" · ") || null })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "위젯 데이터를 불러오지 못했습니다." }, { status: 500 });
  }
}
