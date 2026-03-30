-- Al final del archivo, reemplaza las políticas actuales con:
ALTER TABLE peca_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "peca_scores: via session"
  ON peca_scores
  FOR ALL
  TO authenticated  -- <-- aquí estaba el bug
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = peca_scores.session_id
        AND s.psychologist_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = peca_scores.session_id
        AND s.psychologist_id = auth.uid()
    )
  );
