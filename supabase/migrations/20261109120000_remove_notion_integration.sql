-- Remove the retired Notion integration only.
-- Historical migrations remain unchanged; this migration is intentionally
-- destructive for the Notion-only tables because the feature is retired.
drop table if exists public.notion_sync_events cascade;
drop table if exists public.notion_todo_links cascade;
drop table if exists public.notion_todo_configs cascade;
drop table if exists public.notion_archives cascade;
drop table if exists public.notion_connections cascade;
