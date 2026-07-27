import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, TableLayoutType } from 'docx'
import { saveAs } from 'file-saver'
import type { ReportMeta } from '@/hooks/useReportPdf'

// Definir el tipo para el contenido de la entrevista
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
      const { patientName, content } = meta
      const { indexes, scaledScores } = content || {}

      // Detectar si es informe de entrevista
      const isEntrevista = content?.type === 'entrevista'
      // Conversión segura usando doble aserción
      const e = isEntrevista ? (content as unknown as EntrevistaContent) : undefined

      // Construir el array de children para la sección
      const children: any[] = []

      if (isEntrevista && e) {
        // --- INFORME DE ENTREVISTA ---

        // Título
        children.push(
          new Paragraph({
            text: 'Informe de Entrevista Psicológica',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        )

        // Datos del paciente
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true }),
              new TextRun({ text: patientName || 'No especificado' }),
            ],
            spacing: { after: 100 },
          })
        )

        // Fecha y hora
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

        // Asistentes
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

        // Separador
        children.push(new Paragraph({ text: '', spacing: { after: 200 } }))

        // Motivación principal
        if (e.motivacion_principal) {
          children.push(
            new Paragraph({
              text: 'Motivación o Inquietud Principal',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: e.motivacion_principal,
              spacing: { after: 200 },
            })
          )
        }

        // Información relevante
        if (e.info_relevante) {
          children.push(
            new Paragraph({
              text: 'Información Relevante',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: e.info_relevante,
              spacing: { after: 200 },
            })
          )
        }

        // Sugerencias y acuerdos
        if (e.sugerencias_acuerdos) {
          children.push(
            new Paragraph({
              text: 'Sugerencias y Acuerdos',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: e.sugerencias_acuerdos,
              spacing: { after: 200 },
            })
          )
        }

        // Pie de página
        children.push(
          new Paragraph({
            text: '--- Fin del informe ---',
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
          })
        )

      } else {
        // --- INFORME WISC-V (comportamiento original) ---

        // Título
        children.push(
          new Paragraph({
            text: 'Informe WISC-V',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        )

        // Datos del paciente
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true }),
              new TextRun({ text: patientName || 'No especificado' }),
            ],
            spacing: { after: 100 },
          })
        )

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Fecha de evaluación: ', bold: true }),
              new TextRun({ text: new Date().toLocaleDateString('es-CL') }),
            ],
            spacing: { after: 200 },
          })
        )

        // Título de índices
        children.push(
          new Paragraph({
            text: 'Índices Compuestos',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        )

        // === Construir tabla de índices ===
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
            const idx = indexes[code]
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

          const table = new Table({
            rows: indexRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
          })

          children.push(table)
        }

        // === Construir tabla de subpruebas ===
        if (scaledScores) {
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
            if (pe != null) {
              const label = subtestLabels[code] || code
              const clasif = pe >= 12 ? 'Alto' : pe >= 8 ? 'Suficiente' : 'Bajo'
              subtestRows.push(
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: label })] }),
                    new TableCell({ children: [new Paragraph({ text: String(pe), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: clasif, alignment: AlignmentType.CENTER })] }),
                  ],
                })
              )
            }
          }

          const subtestTable = new Table({
            rows: subtestRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
          })

          children.push(subtestTable)
        }
      }

      // Crear el documento
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: {
                  width: 11906,
                  height: 16838,
                },
                margin: {
                  top: 1440,
                  bottom: 1440,
                  left: 1440,
                  right: 1440,
                },
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
      } else {
        fileName = `WISC-V_${patientName || 'informe'}_${new Date().toISOString().slice(0, 10)}.${extension}`
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