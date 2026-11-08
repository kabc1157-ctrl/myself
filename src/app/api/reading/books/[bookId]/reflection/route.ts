import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/core/auth/session";
import { createAdminSupabaseClient } from "@/core/db/supabase/server";
import { getServerEnv } from "@/core/config/server-env";

type Context = { params: Promise<{ bookId: string }> };
const db = () => createAdminSupabaseClient() as any;

export async function GET(_: NextRequest, context: Context) {
  const session = await verifySession();
  const { bookId } = await context.params;
  const { data, error } = await db().from("reading_book_reflections").select("*").eq("user_id", session.userId).eq("book_id", bookId).maybeSingle();
  if (error) return NextResponse.json({ error: "독서 회고를 불러오지 못했어요." }, { status: 500 });
  return NextResponse.json({ reflection: data });
}

export async function POST(request: NextRequest, context: Context) {
  const session = await verifySession();
  const { bookId } = await context.params;
  const body = await request.json().catch(() => ({})) as { retry?: boolean; complete?: boolean };
  const admin = db();
  const { data: book } = await admin.from("reading_books").select("id,title,author,is_completed").eq("id", bookId).eq("user_id", session.userId).maybeSingle();
  if (!book) return NextResponse.json({ error: "책을 찾을 수 없어요." }, { status: 404 });
  if (typeof body.complete === "boolean" && body.complete !== book.is_completed) {
    const { error } = await admin.from("reading_books").update({ is_completed: body.complete, completed_at: body.complete ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", bookId).eq("user_id", session.userId);
    if (error) return NextResponse.json({ error: "완독 상태를 저장하지 못했어요." }, { status: 500 });
    book.is_completed = body.complete;
    if (!body.complete) return NextResponse.json({ status: "reading" });
  }
  if (!book.is_completed) return NextResponse.json({ error: "완독 처리 후 회고를 만들 수 있어요." }, { status: 409 });
  const { data: existing } = await admin.from("reading_book_reflections").select("*").eq("user_id", session.userId).eq("book_id", bookId).maybeSingle();
  if (existing?.generation_status === "complete" && !body.retry) return NextResponse.json({ reflection: existing });
  if (existing?.generation_status === "generating" && !body.retry) return NextResponse.json({ reflection: existing });
  const { count } = await admin.from("reading_logs").select("id", { count: "exact", head: true }).eq("user_id", session.userId).eq("book_id", bookId);
  const requestedAt = new Date().toISOString();
  const { data: queued, error: upsertError } = await admin.from("reading_book_reflections").upsert({ user_id: session.userId, book_id: bookId, source_record_count: count ?? 0, generation_status: "generating", error_message: null, requested_at: requestedAt, updated_at: requestedAt }, { onConflict: "user_id,book_id" }).select("*").single();
  if (upsertError) return NextResponse.json({ error: "회고 생성을 준비하지 못했어요." }, { status: 500 });
  const env = getServerEnv();
  if (!env.N8N_BOOK_REFLECTION_WEBHOOK_URL) return NextResponse.json({ reflection: queued, warning: "N8N_BOOK_REFLECTION_WEBHOOK_URL이 설정되지 않았어요." }, { status: 202 });
  try {
    const response = await fetch(env.N8N_BOOK_REFLECTION_WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json", ...(env.N8N_INTEGRATION_SECRET ? { "x-integration-secret": env.N8N_INTEGRATION_SECRET } : {}) }, body: JSON.stringify({ user_id: session.userId, book_id: bookId, trigger: "book_completed" }), signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`n8n webhook returned ${response.status}`);
  } catch (cause) {
    await admin.from("reading_book_reflections").update({ generation_status: "failed", error_message: cause instanceof Error ? cause.message : "Webhook failed", updated_at: new Date().toISOString() }).eq("user_id", session.userId).eq("book_id", bookId);
    return NextResponse.json({ error: "회고 생성을 요청하지 못했어요." }, { status: 502 });
  }
  return NextResponse.json({ reflection: queued }, { status: 202 });
}

export async function PATCH(request: NextRequest, context: Context) {
  const session = await verifySession();
  const { bookId } = await context.params;
  const body = await request.json() as { reflectionText?: string };
  if (typeof body.reflectionText !== "string" || !body.reflectionText.trim()) return NextResponse.json({ error: "회고 내용을 입력해 주세요." }, { status: 400 });
  const { data, error } = await db().from("reading_book_reflections").update({ reflection_text: body.reflectionText.trim(), generation_status: "complete", updated_at: new Date().toISOString() }).eq("user_id", session.userId).eq("book_id", bookId).select("*").single();
  if (error) return NextResponse.json({ error: "회고를 저장하지 못했어요." }, { status: 500 });
  return NextResponse.json({ reflection: data });
}
