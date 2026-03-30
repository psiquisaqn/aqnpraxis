create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  device_name text not null,
  device_type text not null default 'laptop',
  device_brand text,
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.devices enable row level security;

create policy "devices: own devices"
  on public.devices
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());