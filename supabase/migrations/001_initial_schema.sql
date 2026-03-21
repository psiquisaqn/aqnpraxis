-- ============================================================
-- PsyEval — Schema inicial
-- Motor WISC-V Chile + estructura base de la plataforma
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- USUARIOS Y ROLES
-- ============================================================

create type user_role as enum ('psychologist', 'admin');

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  email        text not null,
  role         user_role not null default 'psychologist',
  rut          text,                          -- RUT chileno (opcional)
  specialty    text,                          -- "escolar", "clínico", etc.
  institution  text,
  avatar_url   text,
  plan         text not null default 'free',  -- "free" | "pro" | "enterprise"
  plan_expires_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- PACIENTES
-- ============================================================

create table public.patients (
  id             uuid primary key default uuid_generate_v4(),
  psychologist_id uuid not null references public.profiles(id) on delete cascade,
  full_name      text not null,
  rut            text,
  birth_date     date not null,
  gender         text check (gender in ('M', 'F', 'NB', 'NS')),
  school         text,
  grade          text,
  city           text default 'Chile',
  notes          text,
  is_archived    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- CATÁLOGO DE TESTS
-- ============================================================

create table public.test_catalog (
  id           text primary key,              -- "wisc5_cl", "beck", "coopersmith", etc.
  name         text not null,
  full_name    text not null,
  version      text,
  country      text default 'CL',
  age_min_months int,                         -- edad mínima en meses
  age_max_months int,
  description  text,
  is_active    boolean not null default true,
  is_proprietary boolean not null default false,  -- tests propios de la empresa
  created_at   timestamptz not null default now()
);

-- Datos del catálogo inicial
insert into public.test_catalog (id, name, full_name, version, country, age_min_months, age_max_months, description) values
  ('wisc5_cl', 'WISC-V', 'Escala de Inteligencia de Wechsler para Niños — 5ª Edición (Chile)', '5 CL', 'CL', 72, 203, 'Evaluación de inteligencia para niños y adolescentes de 6 a 16 años 11 meses'),
  ('beck_bdi2', 'BDI-II', 'Inventario de Depresión de Beck — 2ª Edición', '2', 'CL', 168, null, 'Evaluación de síntomas depresivos'),
  ('coopersmith', 'Coopersmith', 'Inventario de Autoestima de Coopersmith', null, 'CL', 96, null, 'Evaluación de autoestima en niños y adolescentes'),
  ('stai', 'STAI', 'Inventario de Ansiedad Estado-Rasgo', null, 'CL', 192, null, 'Evaluación de ansiedad estado y rasgo'),
  ('vineland3', 'Vineland-3', 'Escalas de Comportamiento Adaptativo de Vineland — 3ª Edición', '3', 'CL', 0, null, 'Evaluación de conducta adaptativa');

-- ============================================================
-- SESIONES DE EVALUACIÓN
-- ============================================================

create type session_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');

create table public.sessions (
  id               uuid primary key default uuid_generate_v4(),
  psychologist_id  uuid not null references public.profiles(id) on delete cascade,
  patient_id       uuid not null references public.patients(id) on delete cascade,
  test_id          text not null references public.test_catalog(id),
  status           session_status not null default 'scheduled',
  scheduled_at     timestamptz,
  started_at       timestamptz,
  completed_at     timestamptz,
  -- Edad exacta al momento de la evaluación (calculada al iniciar)
  age_years        int,
  age_months       int,
  age_days         int,
  age_group        text,   -- "6:0-6:5", "6:6-6:11", etc. (para lookup en tablas)
  -- Canal en tiempo real (Supabase Realtime channel name)
  realtime_channel text unique default ('session_' || uuid_generate_v4()::text),
  -- Configuración de la sesión
  settings         jsonb not null default '{}',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- PUNTAJES WISC-V (tabla central del motor de scoring)
-- ============================================================

-- Subpruebas con sus puntajes brutos y escalares
create table public.wisc5_scores (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  -- Subpruebas primarias (CIT)
  cc_raw       int,  cc_scaled   int,  -- Construcción con Cubos
  an_raw       int,  an_scaled   int,  -- Analogías
  mr_raw       int,  mr_scaled   int,  -- Matrices de Razonamiento
  rd_raw       int,  rd_scaled   int,  -- Retención de Dígitos
  cla_raw      int,  cla_scaled  int,  -- Claves
  voc_raw      int,  voc_scaled  int,  -- Vocabulario
  bal_raw      int,  bal_scaled  int,  -- Balanzas
  -- Subpruebas complementarias
  rv_raw       int,  rv_scaled   int,  -- Rompecabezas Visuales
  ri_raw       int,  ri_scaled   int,  -- Retención de Imágenes
  bs_raw       int,  bs_scaled   int,  -- Búsqueda de Símbolos
  inf_raw      int,  inf_scaled  int,  -- Información
  sln_raw      int,  sln_scaled  int,  -- Span de Letras y Números
  can_raw      int,  can_scaled  int,  -- Cancelación
  com_raw      int,  com_scaled  int,  -- Comprensión
  ari_raw      int,  ari_scaled  int,  -- Aritmética
  -- Puntajes de proceso (brutos)
  cc_sb_raw    int,  -- CC sin bonificación tiempo
  cc_p_raw     int,  -- CC puntaje parcial
  rd_d_raw     int,  -- RD dígitos directos
  rd_i_raw     int,  -- RD dígitos inversos
  rd_s_raw     int,  -- RD dígitos en secuencia
  can_a_raw    int,  -- Cancelación aleatoria
  can_e_raw    int,  -- Cancelación estructurada
  -- Índices principales (calculados)
  icv          int,  icv_percentile numeric, icv_ci90_lo int, icv_ci90_hi int,
  ive          int,  ive_percentile numeric, ive_ci90_lo int, ive_ci90_hi int,
  irf          int,  irf_percentile numeric, irf_ci90_lo int, irf_ci90_hi int,
  imt          int,  imt_percentile numeric, imt_ci90_lo int, imt_ci90_hi int,
  ivp          int,  ivp_percentile numeric, ivp_ci90_lo int, ivp_ci90_hi int,
  cit          int,  cit_percentile numeric, cit_ci90_lo int, cit_ci90_hi int,
  -- Suma de puntajes escala por índice (para auditoría)
  sum_icv      int, sum_ive int, sum_irf int, sum_imt int, sum_ivp int, sum_cit int,
  -- Diagnóstico descriptivo calculado
  classification text,   -- "Muy superior", "Superior", "Promedio alto", etc.
  -- Pronóstico en tiempo real (va actualizándose durante la sesión)
  realtime_prediction jsonb default '{}',
  -- Sustituciones usadas
  substitutions jsonb default '[]',
  is_prorated   boolean default false,
  -- Metadatos
  calculated_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (session_id)
);

-- ============================================================
-- RESPUESTAS ITEM A ITEM (para análisis cualitativo)
-- ============================================================

create table public.item_responses (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  subtest_code text not null,   -- "CC", "AN", "MR", etc.
  item_number  int not null,
  raw_score    int,
  time_seconds int,
  response_text text,           -- para subtests verbales
  notes        text,
  created_at   timestamptz not null default now(),
  unique (session_id, subtest_code, item_number)
);

-- ============================================================
-- AGENDA
-- ============================================================

create table public.appointments (
  id               uuid primary key default uuid_generate_v4(),
  psychologist_id  uuid not null references public.profiles(id) on delete cascade,
  patient_id       uuid references public.patients(id) on delete set null,
  session_id       uuid references public.sessions(id) on delete set null,
  title            text not null,
  description      text,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  location         text,
  is_virtual       boolean default false,
  meeting_url      text,
  status           text not null default 'scheduled'
                     check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  reminder_sent    boolean default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- INFORMES PSICOLÓGICOS
-- ============================================================

create table public.reports (
  id               uuid primary key default uuid_generate_v4(),
  session_id       uuid not null references public.sessions(id) on delete cascade,
  psychologist_id  uuid not null references public.profiles(id) on delete cascade,
  patient_id       uuid not null references public.patients(id) on delete cascade,
  title            text not null,
  content          jsonb not null default '{}',  -- estructura del informe en JSON
  pdf_url          text,
  is_signed        boolean default false,
  signed_at        timestamptz,
  version          int not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- TABLAS NORMATIVAS WISC-V (Tabla A.1 — PD → PE por edad)
-- ============================================================

-- Almacena la tabla A.1 completa: dado (grupo etario, subprueba, puntaje bruto) → puntaje escala
create table public.wisc5_norms_subtest (
  id            serial primary key,
  age_group     text not null,           -- "6:0-6:5", "6:6-6:11", etc.
  subtest_code  text not null,           -- "CC", "AN", "MR", etc.
  raw_score_min int not null,
  raw_score_max int not null,
  scaled_score  int not null,
  check (raw_score_min <= raw_score_max),
  check (scaled_score between 1 and 19)
);

create index idx_wisc5_norms_lookup
  on public.wisc5_norms_subtest(age_group, subtest_code, raw_score_min, raw_score_max);

-- ============================================================
-- TABLAS NORMATIVAS WISC-V (Tablas A.2–A.7 — Suma PE → Índice)
-- ============================================================

create table public.wisc5_norms_composite (
  id              serial primary key,
  index_code      text not null,   -- "ICV", "IVE", "IRF", "IMT", "IVP", "CIT"
  sum_scaled_min  int not null,
  sum_scaled_max  int not null,
  composite_score int not null,
  percentile      text not null,   -- almacenamos como text ("0.1", "99.9", ">99.9", "<0.1")
  ci90_lo         int not null,
  ci90_hi         int not null,
  ci95_lo         int not null,
  ci95_hi         int not null
);

create index idx_wisc5_composite_lookup
  on public.wisc5_norms_composite(index_code, sum_scaled_min, sum_scaled_max);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

alter table public.profiles         enable row level security;
alter table public.patients         enable row level security;
alter table public.sessions         enable row level security;
alter table public.wisc5_scores     enable row level security;
alter table public.item_responses   enable row level security;
alter table public.appointments     enable row level security;
alter table public.reports          enable row level security;

-- Políticas: cada psicólogo solo ve sus propios datos
create policy "profiles: own data"
  on public.profiles for all using (auth.uid() = id);

create policy "patients: own data"
  on public.patients for all using (auth.uid() = psychologist_id);

create policy "sessions: own data"
  on public.sessions for all using (auth.uid() = psychologist_id);

create policy "wisc5_scores: via session"
  on public.wisc5_scores for all using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.psychologist_id = auth.uid()
    )
  );

create policy "item_responses: via session"
  on public.item_responses for all using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.psychologist_id = auth.uid()
    )
  );

create policy "appointments: own data"
  on public.appointments for all using (auth.uid() = psychologist_id);

create policy "reports: own data"
  on public.reports for all using (auth.uid() = psychologist_id);

-- Tablas normativas son públicas (read-only)
alter table public.wisc5_norms_subtest    enable row level security;
alter table public.wisc5_norms_composite  enable row level security;
alter table public.test_catalog           enable row level security;

create policy "norms: read only" on public.wisc5_norms_subtest    for select using (true);
create policy "norms_c: read only" on public.wisc5_norms_composite  for select using (true);
create policy "catalog: read only" on public.test_catalog           for select using (true);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger trg_patients_updated_at
  before update on public.patients
  for each row execute function public.touch_updated_at();

create trigger trg_sessions_updated_at
  before update on public.sessions
  for each row execute function public.touch_updated_at();

create trigger trg_wisc5_scores_updated_at
  before update on public.wisc5_scores
  for each row execute function public.touch_updated_at();

create trigger trg_reports_updated_at
  before update on public.reports
  for each row execute function public.touch_updated_at();
