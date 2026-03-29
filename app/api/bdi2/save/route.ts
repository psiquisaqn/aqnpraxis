// app/api/bdi2/save/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@supabase/supabase-js';

// Cargar variables de entorno de forma segura
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL y Key no están configuradas en el entorno');
}

// Crear cliente Supabase
const supabase = supabase(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { sessionId, responses } = await req.json();

    // Construir payload con columnas item_1 ... item_21
    const payload: any = { session_id: sessionId };
    for (let i = 1; i <= 21; i++) {
      payload[`item_${i}`] = responses[i] ?? null;
    }

    // Insertar en la tabla bdi2_scores
    const { error } = await supabase
      .from('bdi2_scores')
      .insert([payload]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Resultados guardados correctamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}