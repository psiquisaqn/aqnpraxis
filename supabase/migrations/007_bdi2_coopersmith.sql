-- ============================================================
-- AQN Praxis — Tablas BDI-II y Coopersmith
-- Migración: 007_bdi2_coopersmith.sql
-- ============================================================

-- ── BDI-II ───────────────────────────────────────────────────
CREATE TABLE public.bdi2_scores (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,

  -- Respuestas ítem a ítem (0–3)
  i01 smallint CHECK (i01 BETWEEN 0 AND 3),
  i02 smallint CHECK (i02 BETWEEN 0 AND 3),
  i03 smallint CHECK (i03 BETWEEN 0 AND 3),
  i04 smallint CHECK (i04 BETWEEN 0 AND 3),
  i05 smallint CHECK (i05 BETWEEN 0 AND 3),
  i06 smallint CHECK (i06 BETWEEN 0 AND 3),
  i07 smallint CHECK (i07 BETWEEN 0 AND 3),
  i08 smallint CHECK (i08 BETWEEN 0 AND 3),
  i09 smallint CHECK (i09 BETWEEN 0 AND 3),
  i10 smallint CHECK (i10 BETWEEN 0 AND 3),
  i11 smallint CHECK (i11 BETWEEN 0 AND 3),
  i12 smallint CHECK (i12 BETWEEN 0 AND 3),
  i13 smallint CHECK (i13 BETWEEN 0 AND 3),
  i14 smallint CHECK (i14 BETWEEN 0 AND 3),
  i15 smallint CHECK (i15 BETWEEN 0 AND 3),
  i16 smallint CHECK (i16 BETWEEN 0 AND 3),
  i17 smallint CHECK (i17 BETWEEN 0 AND 3),
  i18 smallint CHECK (i18 BETWEEN 0 AND 3),
  i19 smallint CHECK (i19 BETWEEN 0 AND 3),
  i20 smallint CHECK (i20 BETWEEN 0 AND 3),
  i21 smallint CHECK (i21 BETWEEN 0 AND 3),

  -- Resultados
  total_score                 smallint,
  severity                    text CHECK (severity IN ('minima','leve','moderada','grave')),
  severity_label              text,
  cognitive_affective_score   smallint,
  somatic_motivational_score  smallint,
  suicidal_ideation_score     smallint,
  flagged_items               jsonb DEFAULT '[]',
  is_complete                 boolean DEFAULT false,
  calculated_at               timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (session_id)
);

ALTER TABLE public.bdi2_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bdi2_scores: via session"
  ON public.bdi2_scores FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.psychologist_id = auth.uid()
    )
  );

CREATE TRIGGER trg_bdi2_updated_at
  BEFORE UPDATE ON public.bdi2_scores
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Añadir BDI-II al catálogo (si no existe)
INSERT INTO public.test_catalog (id, name, full_name, version, country, description)
VALUES ('beck_bdi2', 'BDI-II', 'Inventario de Depresión de Beck — 2ª Edición', '2', 'CL',
        'Evaluación de síntomas depresivos. 21 ítems, puntaje 0–63.')
ON CONFLICT (id) DO NOTHING;


-- ── Coopersmith ──────────────────────────────────────────────
CREATE TABLE public.coopersmith_scores (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,

  -- Respuestas ítem a ítem ('igual' | 'diferente')
  r01 text CHECK (r01 IN ('igual','diferente')),
  r02 text CHECK (r02 IN ('igual','diferente')),
  r03 text CHECK (r03 IN ('igual','diferente')),
  r04 text CHECK (r04 IN ('igual','diferente')),
  r05 text CHECK (r05 IN ('igual','diferente')),
  r06 text CHECK (r06 IN ('igual','diferente')),
  r07 text CHECK (r07 IN ('igual','diferente')),
  r08 text CHECK (r08 IN ('igual','diferente')),
  r09 text CHECK (r09 IN ('igual','diferente')),
  r10 text CHECK (r10 IN ('igual','diferente')),
  r11 text CHECK (r11 IN ('igual','diferente')),
  r12 text CHECK (r12 IN ('igual','diferente')),
  r13 text CHECK (r13 IN ('igual','diferente')),
  r14 text CHECK (r14 IN ('igual','diferente')),
  r15 text CHECK (r15 IN ('igual','diferente')),
  r16 text CHECK (r16 IN ('igual','diferente')),
  r17 text CHECK (r17 IN ('igual','diferente')),
  r18 text CHECK (r18 IN ('igual','diferente')),
  r19 text CHECK (r19 IN ('igual','diferente')),
  r20 text CHECK (r20 IN ('igual','diferente')),
  r21 text CHECK (r21 IN ('igual','diferente')),
  r22 text CHECK (r22 IN ('igual','diferente')),
  r23 text CHECK (r23 IN ('igual','diferente')),
  r24 text CHECK (r24 IN ('igual','diferente')),
  r25 text CHECK (r25 IN ('igual','diferente')),
  r26 text CHECK (r26 IN ('igual','diferente')),
  r27 text CHECK (r27 IN ('igual','diferente')),
  r28 text CHECK (r28 IN ('igual','diferente')),
  r29 text CHECK (r29 IN ('igual','diferente')),
  r30 text CHECK (r30 IN ('igual','diferente')),
  r31 text CHECK (r31 IN ('igual','diferente')),
  r32 text CHECK (r32 IN ('igual','diferente')),
  r33 text CHECK (r33 IN ('igual','diferente')),
  r34 text CHECK (r34 IN ('igual','diferente')),
  r35 text CHECK (r35 IN ('igual','diferente')),
  r36 text CHECK (r36 IN ('igual','diferente')),
  r37 text CHECK (r37 IN ('igual','diferente')),
  r38 text CHECK (r38 IN ('igual','diferente')),
  r39 text CHECK (r39 IN ('igual','diferente')),
  r40 text CHECK (r40 IN ('igual','diferente')),
  r41 text CHECK (r41 IN ('igual','diferente')),
  r42 text CHECK (r42 IN ('igual','diferente')),
  r43 text CHECK (r43 IN ('igual','diferente')),
  r44 text CHECK (r44 IN ('igual','diferente')),
  r45 text CHECK (r45 IN ('igual','diferente')),
  r46 text CHECK (r46 IN ('igual','diferente')),
  r47 text CHECK (r47 IN ('igual','diferente')),
  r48 text CHECK (r48 IN ('igual','diferente')),
  r49 text CHECK (r49 IN ('igual','diferente')),
  r50 text CHECK (r50 IN ('igual','diferente')),
  r51 text CHECK (r51 IN ('igual','diferente')),
  r52 text CHECK (r52 IN ('igual','diferente')),
  r53 text CHECK (r53 IN ('igual','diferente')),
  r54 text CHECK (r54 IN ('igual','diferente')),
  r55 text CHECK (r55 IN ('igual','diferente')),
  r56 text CHECK (r56 IN ('igual','diferente')),
  r57 text CHECK (r57 IN ('igual','diferente')),
  r58 text CHECK (r58 IN ('igual','diferente')),

  -- Resultados
  total_raw           smallint,
  total_scaled        smallint,
  level               text CHECK (level IN ('alta','media_alta','media_baja','baja')),
  level_label         text,
  score_general       smallint,
  score_social        smallint,
  score_hogar         smallint,
  score_escolar       smallint,
  lie_scale_raw       smallint,
  lie_scale_invalid   boolean DEFAULT false,
  is_complete         boolean DEFAULT false,
  calculated_at       timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  UNIQUE (session_id)
);

ALTER TABLE public.coopersmith_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coopersmith_scores: via session"
  ON public.coopersmith_scores FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.psychologist_id = auth.uid()
    )
  );

CREATE TRIGGER trg_coopersmith_updated_at
  BEFORE UPDATE ON public.coopersmith_scores
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Añadir Coopersmith al catálogo
INSERT INTO public.test_catalog (id, name, full_name, country, description)
VALUES ('coopersmith', 'Coopersmith', 'Inventario de Autoestima de Coopersmith (Forma Escolar)', 'CL',
        'Evaluación de autoestima. 58 ítems. Adaptación chilena: Brinkmann et al. (1989).')
ON CONFLICT (id) DO NOTHING;
