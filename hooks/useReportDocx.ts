import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, TableLayoutType } from 'docx'
import { saveAs } from 'file-saver'
import type { ReportMeta } from '@/hooks/useReportPdf'

interface EntrevistaContent {
  type: 'entrevista'
  id: string
  fecha: string
  hora: string
  asistentes: string | null
  motivacion_principal: string | null
  info_relevante: string | null
  sugerencias_acuerdos: string | null
  patient: {
    full_name: string
    rut: string | null
    birth_date: string | null
    school: string | null
  } | null
}

export function useReportDocx() {
  const generateDocx = async (contentRef: React.RefObject<HTMLElement | null>, meta: ReportMeta, type: 'docx' | 'odt') => {
    try {
      const { patientName, content, testId } = meta
      const data = content as any // Para evitar errores de TypeScript al acceder a propiedades dinámicas
      const { indexes, scaledScores } = data || {}

      const isEntrevista = data?.type === 'entrevista'
      const e = isEntrevista ? (data as unknown as EntrevistaContent) : undefined

      const children: any[] = []

      if (isEntrevista && e) {
        // --- Entrevista ---
        children.push(
          new Paragraph({
            text: 'Informe de Entrevista Psicológica',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true }),
              new TextRun({ text: patientName || 'No especificado' }),
            ],
            spacing: { after: 100 },
          })
        )

        if (e.fecha) {
          const fechaFormateada = new Date(e.fecha).toLocaleDateString('es-CL')
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Fecha: ', bold: true }),
                new TextRun({ text: fechaFormateada }),
                new TextRun({ text: '     Hora: ', bold: true }),
                new TextRun({ text: e.hora || 'No registrada' }),
              ],
              spacing: { after: 100 },
            })
          )
        }

        if (e.asistentes) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Asistentes: ', bold: true }),
                new TextRun({ text: e.asistentes }),
              ],
              spacing: { after: 100 },
            })
          )
        }

        children.push(new Paragraph({ text: '', spacing: { after: 200 } }))

        if (e.motivacion_principal) {
          children.push(
            new Paragraph({
              text: 'Motivación o Inquietud Principal',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({ text: e.motivacion_principal, spacing: { after: 200 } })
          )
        }

        if (e.info_relevante) {
          children.push(
            new Paragraph({
              text: 'Información Relevante',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({ text: e.info_relevante, spacing: { after: 200 } })
          )
        }

        if (e.sugerencias_acuerdos) {
          children.push(
            new Paragraph({
              text: 'Sugerencias y Acuerdos',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({ text: e.sugerencias_acuerdos, spacing: { after: 200 } })
          )
        }

        children.push(
          new Paragraph({
            text: '--- Fin del informe ---',
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
          })
        )

      } else if (testId === 'bdi2') {
        // --- BDI-II ---
        const totalScore = data.totalScore ?? 0
        const severity = data.severity ?? 'No clasificado'
        const cognitiveAffectiveScore = data.cognitiveAffectiveScore ?? 0
        const somaticMotivationalScore = data.somaticMotivationalScore ?? 0
        const suicidalIdeationScore = data.suicidalIdeationScore ?? 0

        children.push(
          new Paragraph({
            text: 'Informe BDI-II - Inventario de Depresión',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true }),
              new TextRun({ text: patientName || 'No especificado' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Fecha de informe: ', bold: true }),
              new TextRun({ text: new Date().toLocaleDateString('es-CL') }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({ text: 'Resultados', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: 'Puntaje total: ', bold: true }), new TextRun({ text: String(totalScore) })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: 'Severidad: ', bold: true }), new TextRun({ text: severity })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: 'Puntaje cognitivo-afectivo: ', bold: true }), new TextRun({ text: String(cognitiveAffectiveScore) })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: 'Puntaje somático-motivacional: ', bold: true }), new TextRun({ text: String(somaticMotivationalScore) })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: 'Ideación suicida: ', bold: true }), new TextRun({ text: String(suicidalIdeationScore) })], spacing: { after: 50 } }),
        )

      } else if (testId === 'coopersmith') {
        // --- Coopersmith ---
        const totalScore = data.totalScore ?? 0
        const general = data.general ?? 0
        const social = data.social ?? 0
        const familiar = data.familiar ?? 0
        const academico = data.academico ?? 0

        children.push(
          new Paragraph({
            text: 'Informe Coopersmith - Inventario de Autoestima',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true }),
              new TextRun({ text: patientName || 'No especificado' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Fecha de informe: ', bold: true }),
              new TextRun({ text: new Date().toLocaleDateString('es-CL') }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({ text: 'Resultados', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: 'Puntaje total: ', bold: true }), new TextRun({ text: String(totalScore) })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: 'Área general: ', bold: true }), new TextRun({ text: String(general) })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: 'Área social: ', bold: true }), new TextRun({ text: String(social) })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: 'Área familiar: ', bold: true }), new TextRun({ text: String(familiar) })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: 'Área académica: ', bold: true }), new TextRun({ text: String(academico) })], spacing: { after: 50 } }),
        )

      } else if (testId === 'peca') {
        // --- PECA ---
        const participationLevel = data.participationLevel ?? 0
        const participationText = data.participationText ?? ''
        const dims = data.dimensions

        children.push(
          new Paragraph({
            text: 'Informe PECA - Prueba de Evaluación de Conducta Adaptativa',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true }),
              new TextRun({ text: patientName || 'No especificado' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Fecha de informe: ', bold: true }),
              new TextRun({ text: new Date().toLocaleDateString('es-CL') }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({ text: 'Resultados', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: 'Participación general: ', bold: true }), new TextRun({ text: `${Math.round(participationLevel * 100)}%` })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: 'Texto: ', bold: true }), new TextRun({ text: String(participationText) })], spacing: { after: 50 } }),
        )
        if (Array.isArray(dims) && dims.length) {
          children.push(new Paragraph({ text: 'Dimensiones', heading: HeadingLevel.HEADING_3, spacing: { before: 100, after: 50 } }))
          for (const dim of dims) {
            const p2 = (dim as any).p2 ?? 0
            const intensityLabel = (dim as any).intensityLabel ?? ''
            children.push(new Paragraph({ children: [new TextRun({ text: `${(dim as any).label}: `, bold: true }), new TextRun({ text: `${Math.round(p2 * 100)}% (${intensityLabel})` })], spacing: { after: 20 } }))
          }
        }

      } else {
        // --- WISC-V ---
        children.push(
          new Paragraph({
            text: 'Informe WISC-V',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true }),
              new TextRun({ text: patientName || 'No especificado' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Fecha de evaluación: ', bold: true }),
              new TextRun({ text: new Date().toLocaleDateString('es-CL') }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Índices Compuestos',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        )

        if (indexes) {
          const indexRows: TableRow[] = [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Índice' })] }),
                new TableCell({ children: [new Paragraph({ text: 'Puntaje', alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: 'Percentil', alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: 'Clasificación', alignment: AlignmentType.CENTER })] }),
              ],
            }),
          ]
          const indexCodes = ['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT']
          for (const code of indexCodes) {
            const idx = (indexes as any)[code]
            if (idx) {
              indexRows.push(
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: code })] }),
                    new TableCell({ children: [new Paragraph({ text: String(idx.score), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: String(idx.percentile), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: idx.classification || '', alignment: AlignmentType.CENTER })] }),
                  ],
                })
              )
            }
          }
          children.push(new Table({ rows: indexRows, width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED }))
        }

        if (scaledScores && typeof scaledScores === 'object') {
          children.push(
            new Paragraph({
              text: 'Puntajes por Subprueba',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            })
          )
          const subtestRows: TableRow[] = [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Subprueba' })] }),
                new TableCell({ children: [new Paragraph({ text: 'PE', alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: 'Clasificación', alignment: AlignmentType.CENTER })] }),
              ],
            }),
          ]
          const subtestLabels: Record<string, string> = {
            CC: 'Construcción con Cubos',
            AN: 'Analogías',
            MR: 'Matrices de Razonamiento',
            RD: 'Retención de Dígitos',
            CLA: 'Claves',
            VOC: 'Vocabulario',
            BAL: 'Balanzas',
            RV: 'Rompecabezas Visuales',
            RI: 'Retención de Imágenes',
            BS: 'Búsqueda de Símbolos',
            IN: 'Información',
            SLN: 'Secuenciación de Letras y Números',
            CAN: 'Cancelación',
            COM: 'Comprensión',
            ARI: 'Aritmética',
          }
          for (const [code, pe] of Object.entries(scaledScores)) {
            // Convertir pe a número de forma segura
            const peNum = typeof pe === 'number' ? pe : Number(pe)
            if (!isNaN(peNum)) {
              const label = subtestLabels[code] || code
              const clasif = peNum >= 12 ? 'Alto' : peNum >= 8 ? 'Suficiente' : 'Bajo'
              subtestRows.push(
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: label })] }),
                    new TableCell({ children: [new Paragraph({ text: String(peNum), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: clasif, alignment: AlignmentType.CENTER })] }),
                  ],
                })
              )
            }
          }
          children.push(new Table({ rows: subtestRows, width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED }))
        }
      }

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: { width: 11906, height: 16838 },
                margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
              },
            },
            children,
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      const extension = type === 'docx' ? 'docx' : 'odt'

      let fileName = `Informe_${patientName || 'sin_paciente'}_${new Date().toISOString().slice(0, 10)}.${extension}`
      if (isEntrevista) {
        fileName = `Entrevista_${patientName || 'sin_paciente'}_${new Date().toISOString().slice(0, 10)}.${extension}`
      } else if (testId) {
        fileName = `${testId.toUpperCase()}_${patientName || 'sin_paciente'}_${new Date().toISOString().slice(0, 10)}.${extension}`
      }

      saveAs(blob, fileName)

      return { success: true, message: `Informe guardado como ${extension.toUpperCase()}` }
    } catch (error) {
      console.error('Error generando DOCX/ODT:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }

  return { generateDocx }
}