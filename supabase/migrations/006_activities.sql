-- ============================================================
-- AQN Praxis — Módulo de Actividades y Niveles de Logro
-- PDPI / TP-CREM / POSMAN
-- ============================================================

-- Tabla de programas de actividades
CREATE TABLE public.activity_programs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        text NOT NULL UNIQUE,  -- 'PDPI', 'TP-CREM', 'POSMAN'
  name        text NOT NULL,
  author      text,
  description text,
  total_sessions int,
  is_aqn_prototype boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

INSERT INTO public.activity_programs (code, name, author, total_sessions, is_aqn_prototype) VALUES
  ('PDPI',   'Programa para el Desarrollo del Pensamiento Inteligente', 'Ps. Juan Francisco Sotomayor Julio', 59, false),
  ('TP-CREM','Técnica Psicoterapéutica para la Conexión y Regulación Emocional', 'Ps. Juan Francisco Sotomayor Julio', 12, false),
  ('POSMAN', 'Ejercicios de Focalización POSMAN', 'Ps. Juan Francisco Sotomayor Julio', 1, false);

-- Tabla de sesiones programadas por paciente
CREATE TABLE public.activity_sessions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  psychologist_id uuid NOT NULL REFERENCES public.profiles(id),
  program_code    text NOT NULL,   -- 'PDPI', 'TP-CREM', etc.
  session_number  int NOT NULL,    -- 0–58 para PDPI
  scheduled_date  date,
  completed_date  date,
  status          text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped')),
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_act_sessions_patient ON public.activity_sessions(patient_id);
CREATE INDEX idx_act_sessions_psy     ON public.activity_sessions(psychologist_id);

ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_sessions: own patients"
  ON public.activity_sessions FOR ALL
  USING (auth.uid() = psychologist_id);

-- Tabla de pautas de logro por sesión
CREATE TABLE public.achievement_records (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_session_id uuid NOT NULL REFERENCES public.activity_sessions(id) ON DELETE CASCADE,
  psychologist_id     uuid NOT NULL REFERENCES public.profiles(id),
  --
  -- Niveles de logro (escala AQN 1-6):
  --   1: No lo logra
  --   2: Logros mínimos, solo con ayuda
  --   3: Logros mínimos sin ayuda / moderados con ayuda
  --   4: Logros moderados sin ayuda / suficientes con ayuda
  --   5: Logros suficientes sin ayuda / sobresalientes con ayuda
  --   6: Logros sobresalientes sin ayuda
  achievement_level   int NOT NULL CHECK (achievement_level BETWEEN 1 AND 6),
  --
  -- Dominios de logro evaluados en esa sesión (array de strings)
  domain_scores       jsonb,  -- { "Identifica idea principal": 4, "Síntesis gráfica": 5 }
  --
  observations        text,
  next_session_notes  text,  -- Indicaciones para la siguiente sesión
  recorded_at         timestamptz DEFAULT now()
);

CREATE INDEX idx_achievement_session ON public.achievement_records(activity_session_id);

ALTER TABLE public.achievement_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievement_records: own data"
  ON public.achievement_records FOR ALL
  USING (auth.uid() = psychologist_id);

-- Vista: progreso de paciente en PDPI
CREATE VIEW public.pdpi_progress AS
SELECT
  ase.patient_id,
  ase.psychologist_id,
  COUNT(*)                                              AS sessions_completed,
  MAX(ase.session_number)                               AS last_session,
  ROUND(AVG(ar.achievement_level)::numeric, 2)          AS avg_achievement,
  MIN(ar.achievement_level)                             AS min_achievement,
  MAX(ar.achievement_level)                             AS max_achievement
FROM public.activity_sessions ase
JOIN public.achievement_records ar ON ar.activity_session_id = ase.id
WHERE ase.program_code = 'PDPI'
  AND ase.status = 'completed'
GROUP BY ase.patient_id, ase.psychologist_id;
