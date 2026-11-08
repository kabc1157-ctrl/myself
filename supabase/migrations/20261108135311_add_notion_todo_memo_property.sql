alter table public.notion_todo_configs
  add column if not exists memo_property_id text;
