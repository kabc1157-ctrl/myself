alter table public.user_feature_settings
  add column navigation_order jsonb not null default '[]'::jsonb;

alter table public.user_feature_settings
  add constraint user_feature_settings_navigation_order_valid
  check (jsonb_typeof(navigation_order) = 'array');
