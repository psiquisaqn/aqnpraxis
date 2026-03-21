-- ============================================================
-- AQN Praxis — Tabla de pagos y lógica de plan freemium
-- ============================================================

-- Tabla de transacciones de pago
create table public.payments (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  buy_order            text not null unique,
  plan_type            text not null check (plan_type in ('pro_monthly', 'per_report')),
  report_id            uuid references public.reports(id) on delete set null,
  amount               int not null,         -- total con IVA en CLP
  amount_net           int not null,         -- sin IVA
  status               text not null default 'pending'
                         check (status in ('pending', 'completed', 'failed', 'cancelled')),
  transbank_token      text,
  authorization_code   text,
  transbank_response   jsonb,
  created_at           timestamptz not null default now(),
  completed_at         timestamptz
);

alter table public.payments enable row level security;
create policy "payments: own data"
  on public.payments for select using (auth.uid() = user_id);

-- Índices
create index idx_payments_user   on public.payments(user_id);
create index idx_payments_status on public.payments(status);

-- Agregar columnas a reports para control de acceso
alter table public.reports
  add column if not exists is_paid    boolean default false,
  add column if not exists paid_at    timestamptz;

-- ============================================================
-- FUNCIÓN: verificar si un psicólogo puede exportar un informe
-- Regla: plan 'free' → máximo 3 informes exportados en total
--        plan 'pro'  → ilimitados, siempre que plan_expires_at > now()
-- ============================================================

create or replace function public.can_export_report(p_user_id uuid)
returns boolean
language plpgsql security definer as $$
declare
  v_plan         text;
  v_plan_expires timestamptz;
  v_report_count int;
begin
  select plan, plan_expires_at
    into v_plan, v_plan_expires
    from public.profiles
   where id = p_user_id;

  -- Plan pro activo
  if v_plan = 'pro' and v_plan_expires > now() then
    return true;
  end if;

  -- Plan free: contar informes ya exportados o pagados individualmente
  select count(*)
    into v_report_count
    from public.reports
   where psychologist_id = p_user_id
     and (pdf_url is not null or is_paid = true);

  return v_report_count < 3;
end;
$$;

-- ============================================================
-- FUNCIÓN: obtener estado del plan de un usuario
-- ============================================================

create or replace function public.get_plan_status(p_user_id uuid)
returns jsonb
language plpgsql security definer as $$
declare
  v_plan            text;
  v_plan_expires    timestamptz;
  v_reports_used    int;
  v_reports_limit   int := 3;
begin
  select plan, plan_expires_at
    into v_plan, v_plan_expires
    from public.profiles
   where id = p_user_id;

  select count(*)
    into v_reports_used
    from public.reports
   where psychologist_id = p_user_id
     and (pdf_url is not null or is_paid = true);

  return jsonb_build_object(
    'plan',           v_plan,
    'is_pro',         (v_plan = 'pro' and v_plan_expires > now()),
    'plan_expires_at', v_plan_expires,
    'reports_used',   v_reports_used,
    'reports_limit',  case when v_plan = 'pro' and v_plan_expires > now() then null else v_reports_limit end,
    'can_export',     public.can_export_report(p_user_id)
  );
end;
$$;
