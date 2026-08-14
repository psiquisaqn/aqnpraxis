// app/api/generate-docx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import htmlToDocx from 'html-to-docx'

export const runtime = 'nodejs' // Asegura que se ejecute en Node.js, no en Edge

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json()

    if (!html) {
      return NextResponse.json({ error: 'Falta el contenido HTML' }, { status: 400 })
    }

    // Opciones (puedes añadir estilos adicionales si es necesario)
    const options = {
      // Puedes añadir opciones como: { styles: ['body { font-family: Georgia; }'] }
    }

    // Generar el DOCX (devuelve un Buffer)
    const docxBuffer = await htmlToDocx(html, null, options)

    // Devolver el Buffer como respuesta con el tipo MIME adecuado
    return new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="informe.docx"',
      },
    })
  } catch (error) {
    console.error('Error generando DOCX:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar el DOCX' },
      { status: 500 }
    )
  }
}