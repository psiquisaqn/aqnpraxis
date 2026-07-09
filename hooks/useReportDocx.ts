import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, TableLayoutType } from 'docx'
import { saveAs } from 'file-saver'
import type { ReportMeta } from '@/hooks/useReportPdf'

export function useReportDocx() {
  const generateDocx = async (contentRef: React.RefObject<HTMLElement | null>, meta: ReportMeta, type: 'docx' | 'odt') => {
    try {
      const { patientName, content } = meta
      const { indexes, scaledScores } = content || {}

      // Construir el array de children para la sección
      const children: any[] = [
        // Título
        new Paragraph({
          text: 'Informe WISC-V',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        // Datos del paciente
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
        // Título de índices
        new Paragraph({
          text: 'Índices Compuestos',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
      ]

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

        // Agregar la tabla a children
        children.push(table)
      }

      // === Construir tabla de subpruebas ===
      if (scaledScores) {
        // Espacio antes de la tabla
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

      // Crear el documento con todos los children en la sección
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: {
                  width: 11906, // A4 en twips
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

      // Generar el blob y descargar
      const blob = await Packer.toBlob(doc)
      const extension = type === 'docx' ? 'docx' : 'odt'
      const fileName = `WISC-V_${patientName || 'informe'}_${new Date().toISOString().slice(0, 10)}.${extension}`

      saveAs(blob, fileName)

      return { success: true, message: `Informe guardado como ${extension.toUpperCase()}` }
    } catch (error) {
      console.error('Error generando DOCX/ODT:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }

  return { generateDocx }
}