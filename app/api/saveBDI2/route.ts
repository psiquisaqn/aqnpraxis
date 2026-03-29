// app/api/saveBDI2/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export async function POST(req: Request) {
  const { session_id, respuestas } = await req.json();

  // Paso 1: Insertar ítems
  const payload: any = {
    session_id,
    item_1: respuestas[0],
    item_2: respuestas[1],
    item_3: respuestas[2],
    // ...
    item_21: respuestas[20],
  };

  const { error } = await supabase
    .from('bdi2_scores')
    .insert([payload]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Paso 2: Calcular índices (ajusta según tu lógica clínica)
  const indices = {
    i01: payload.item_1 + payload.item_2,
    i02: payload.item_3 + payload.item_4,
    i03: payload.item_5 + payload.item_6,
    i04: payload.item_7 + payload.item_8,
    i05: payload.item_9 + payload.item_10,
    i06: payload.item_11 + payload.item_12,
    i07: payload.item_13 + payload.item_14,
    i08: payload.item_15 + payload.item_16,
    i09: payload.item_17 + payload.item_18 + payload.item_19 + payload.item_20 + payload.item_21,
  };

  await supabase
    .from('bdi2_scores')
    .update(indices)
    .eq('session_id', session_id);

  return NextResponse.json({ message: 'Resultados guardados correctamente' });
}