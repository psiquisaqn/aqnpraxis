-- ============================================================
-- PsyEval — Tabla PECA (Prueba de Evaluación de Conducta Adaptativa)
-- Ps. Antonio Baeza Henríquez — Psiquis AQN
-- ============================================================

-- Respuestas ítem a ítem (1–4 para cada uno de los 45 ítems)
create table public.peca_scores (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid not null references public.sessions(id) on delete cascade,

  -- Respuestas brutas (1–4)
  p01 smallint check (p01 between 1 and 4),
  p02 smallint check (p02 between 1 and 4),
  p03 smallint check (p03 between 1 and 4),
  p04 smallint check (p04 between 1 and 4),
  p05 smallint check (p05 between 1 and 4),
  p06 smallint check (p06 between 1 and 4),
  p07 smallint check (p07 between 1 and 4),
  p08 smallint check (p08 between 1 and 4),
  p09 smallint check (p09 between 1 and 4),
  p10 smallint check (p10 between 1 and 4),
  p11 smallint check (p11 between 1 and 4),
  p12 smallint check (p12 between 1 and 4),
  p13 smallint check (p13 between 1 and 4),
  p14 smallint check (p14 between 1 and 4),
  p15 smallint check (p15 between 1 and 4),
  p16 smallint check (p16 between 1 and 4),
  p17 smallint check (p17 between 1 and 4),
  p18 smallint check (p18 between 1 and 4),
  p19 smallint check (p19 between 1 and 4),
  p20 smallint check (p20 between 1 and 4),
  p21 smallint check (p21 between 1 and 4),
  p22 smallint check (p22 between 1 and 4),
  p23 smallint check (p23 between 1 and 4),
  p24 smallint check (p24 between 1 and 4),
  p25 smallint check (p25 between 1 and 4),
  p26 smallint check (p26 between 1 and 4),
  p27 smallint check (p27 between 1 and 4),
  p28 smallint check (p28 between 1 and 4),
  p29 smallint check (p29 between 1 and 4),
  p30 smallint check (p30 between 1 and 4),
  p31 smallint check (p31 between 1 and 4),
  p32 smallint check (p32 between 1 and 4),
  p33 smallint check (p33 between 1 and 4),
  p34 smallint check (p34 between 1 and 4),
  p35 smallint check (p35 between 1 and 4),
  p36 smallint check (p36 between 1 and 4),
  p37 smallint check (p37 between 1 and 4),
  p38 smallint check (p38 between 1 and 4),
  p39 smallint check (p39 between 1 and 4),
  p40 smallint check (p40 between 1 and 4),
  p41 smallint check (p41 between 1 and 4),
  p42 smallint check (p42 between 1 and 4),
  p43 smallint check (p43 between 1 and 4),
  p44 smallint check (p44 between 1 and 4),
  p45 smallint check (p45 between 1 and 4),

  -- Factores principales (0.0–1.0, valor absoluto)
  hcon          numeric(4,3),  -- Habilidades Conceptuales
  hsoc          numeric(4,3),  -- Habilidades Sociales
  hpra          numeric(4,3),  -- Habilidades Prácticas

  -- Niveles de los factores principales
  hcon_level    text check (hcon_level in ('buen_nivel','requiere_apoyo')),
  hsoc_level    text check (hsoc_level in ('buen_nivel','requiere_apoyo')),
  hpra_level    text check (hpra_level in ('buen_nivel','requiere_apoyo')),

  -- Subescalas (0.0–1.0)
  score_com     numeric(4,3),  -- Comunicación
  score_acu     numeric(4,3),  -- Autocuidado
  score_avd     numeric(4,3),  -- Actividades de la Vida Diaria
  score_hs      numeric(4,3),  -- Habilidades Sociales
  score_haf     numeric(4,3),  -- Habilidades Académicas Funcionales
  score_uco     numeric(4,3),  -- Uso de la Comunidad
  score_adi     numeric(4,3),  -- Autodirección
  score_css     numeric(4,3),  -- Cuidado de Salud y Seguridad
  score_aor     numeric(4,3),  -- Actividades de Ocio y Recreación

  -- Niveles de subescalas
  level_com     text check (level_com  in ('buen_nivel','limitado','extenso','generalizado')),
  level_acu     text check (level_acu  in ('buen_nivel','limitado','extenso','generalizado')),
  level_avd     text check (level_avd  in ('buen_nivel','limitado','extenso','generalizado')),
  level_hs      text check (level_hs   in ('buen_nivel','limitado','extenso','generalizado')),
  level_haf     text check (level_haf  in ('buen_nivel','limitado','extenso','generalizado')),
  level_uco     text check (level_uco  in ('buen_nivel','limitado','extenso','generalizado')),
  level_adi     text check (level_adi  in ('buen_nivel','limitado','extenso','generalizado')),
  level_css     text check (level_css  in ('buen_nivel','limitado','extenso','generalizado')),
  level_aor     text check (level_aor  in ('buen_nivel','limitado','extenso','generalizado')),

  -- Nivel de participación global
  participation_level       numeric(4,3),
  participation_level_label text,
  participation_description text,

  -- Metadatos de administración
  administration_mode text default 'self_report'   -- 'self_report' | 'assisted'
    check (administration_mode in ('self_report','assisted')),
  completed_items     smallint default 0,
  calculated_at       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (session_id)
);

-- RLS
alter table public.peca_scores enable row level security;
create policy "peca_scores: via session"
  on public.peca_scores for all using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.psychologist_id = auth.uid()
    )
  );

create trigger trg_peca_scores_updated_at
  before update on public.peca_scores
  for each row execute function public.touch_updated_at();

-- Añadir PECA al catálogo de tests
insert into public.test_catalog (id, name, full_name, version, country, description, is_proprietary)
values (
  'peca_aqn',
  'PECA',
  'Prueba de Evaluación de Conducta Adaptativa',
  '1.0',
  'CL',
  'Evaluación de conducta adaptativa en 45 ítems. Mide Habilidades Conceptuales, Sociales y Prácticas, con 9 subescalas. Creada por Ps. Antonio Baeza Henríquez — Psiquis AQN. Test en proceso de validación científica.',
  true
)
on conflict (id) do nothing;
