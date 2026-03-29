// app/api/bdi2/save/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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