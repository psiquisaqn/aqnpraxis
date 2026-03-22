-- ============================================================
-- AQN Praxis — Storage bucket para informes PDF
-- Migración: 008_storage_reports.sql
-- Ejecutar en el SQL editor de Supabase
-- ============================================================

-- Crear bucket privado para informes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,                          -- privado: solo acceso autenticado
  10485760,                       -- 10 MB máximo por archivo
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Política: el psicólogo puede subir sus propios informes
CREATE POLICY "reports: upload own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: el psicólogo puede leer sus propios informes
CREATE POLICY "reports: read own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: el psicólogo puede eliminar sus propios informes
CREATE POLICY "reports: delete own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
