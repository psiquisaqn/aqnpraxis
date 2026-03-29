// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

// Inicializa el cliente con tus variables de entorno
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)