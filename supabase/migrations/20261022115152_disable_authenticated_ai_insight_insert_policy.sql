alter policy "Users create own generated insights"
  on public.ai_insights
  with check (false);
