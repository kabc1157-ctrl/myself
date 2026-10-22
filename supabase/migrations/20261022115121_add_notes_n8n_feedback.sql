alter table public.notes
  add column if not exists ai_feedback jsonb;

comment on column public.notes.ai_feedback is
  'Insight payload written by the external n8n automation.';
