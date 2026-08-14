import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, TableLayoutType, BorderStyle, ImageRun } from 'docx'
import { saveAs } from 'file-saver'
import type { ReportMeta } from '@/hooks/useReportPdf'

// Importar funciones de interpretación para todos los tests
import { getInterpretacionSeveridad, getInterpretacionDimension, getConclusionGeneral as getBdiConclusion } from '@/lib/interpretaciones/bdi2'
import { getInterpretacionSubescala, getConclusionGeneral as getCoopersmithConclusion } from '@/lib/interpretaciones/coopersmith'
import { getInterpretacionParticipacion, getInterpretacionDimension as getPecaDimension, getConclusionGeneral as getPecaConclusion } from '@/lib/interpretaciones/peca'
import { getClassification, getScaledClassification, getSubtestInterpretation, getInterpretacionIndice } from '@/lib/interpretaciones/wisc5'

// Extender ReportMeta para incluir datos del paciente y evaluación
interface ExtendedReportMeta extends ReportMeta {
  patientRut?: string
  patientBirthDate?: string
  patientAge?: number
  patientSchool?: string
  evalDate?: string
}

// Función auxiliar para obtener solo dos primeras palabras
function getShortName(fullName: string): string {
  if (!fullName) return 'El evaluado'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 2) return fullName
  return parts.slice(0, 2).join(' ')
}

// Estilos comunes para el documento
const STYLES = {
  font: 'Georgia',
  fontSize: 12,
  lineHeight: 1.5,
  color: '#333333',
  titleColor: '#1a1a1a',
  subtitleColor: '#2d2d2d',
  primaryColor: '#3B82F6',
  borderColor: '#cccccc',
}

// Función para crear bordes de tabla
const tableBorder = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: STYLES.borderColor,
}

export function useReportDocx() {
  const generateDocx = async (contentRef: React.RefObject<HTMLElement | null>, meta: ExtendedReportMeta, type: 'docx' | 'odt') => {
    try {
      const { patientName, content, testId, patientRut, patientBirthDate, patientAge, patientSchool, evalDate } = meta
      const data = content as any
      const { indexes, scaledScores } = data || {}

      const isEntrevista = data?.type === 'entrevista'
      const e = isEntrevista ? (data as any) : undefined

      const children: any[] = []

      // ============================================================
      // 0. CARGAR LOGO COMO IMAGEN (desde URL pública)
      // ============================================================
      let logoImageBuffer: Buffer | undefined = undefined
      try {
        const response = await fetch('/isotipoaqnpraxis.png')
        if (response.ok) {
          const blob = await response.blob()
          const arrayBuffer = await blob.arrayBuffer()
          logoImageBuffer = Buffer.from(arrayBuffer)
        }
      } catch (error) {
        console.warn('No se pudo cargar el logo para el DOCX:', error)
      }

      // ============================================================
      // 1. HEADER (logo + título + datos del paciente)
      // ============================================================
      const testTitleMap: Record<string, string> = {
        bdi2: 'BDI-II - Inventario de Depresión',
        coopersmith: 'Coopersmith SEI - Inventario de Autoestima',
        peca: 'PECA - Prueba de Evaluación de Conducta Adaptativa',
        wisc5: 'WISC-V - Escala de Inteligencia',
        entrevista: 'Informe de Entrevista Psicológica',
      }
      const titleText = isEntrevista ? 'Informe de Entrevista Psicológica' : (testTitleMap[testId || ''] || 'Informe de Evaluación')

      const headerChildren: any[] = []

      // Logo a la izquierda (si se pudo cargar)
      if (logoImageBuffer) {
        headerChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: logoImageBuffer,        // <-- CORREGIDO: data en lugar de image
                transformation: { width: 80, height: 80 },
                type: 'png',
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 50 },
          })
        )
      }

      // Título centrado
      headerChildren.push(
        new Paragraph({
          text: titleText,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          style: 'title',
        })
      )

      // Datos del paciente
      headerChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Paciente: ', bold: true, size: 24 }),
            new TextRun({ text: patientName || 'No especificado', size: 24 }),
          ],
          spacing: { after: 50 },
        })
      )

      // Detalles adicionales del paciente
      const details: string[] = []
      if (patientRut) details.push(`RUT: ${patientRut}`)
      if (patientBirthDate) details.push(`Nac.: ${patientBirthDate}`)
      if (patientAge !== undefined && patientAge > 0) details.push(`Edad: ${patientAge} años`)
      if (patientSchool) details.push(`Colegio: ${patientSchool}`)
      if (details.length > 0) {
        headerChildren.push(
          new Paragraph({
            children: details.map((d, i) => {
              return new TextRun({ text: (i > 0 ? ' | ' : '') + d, size: 22, color: '#555555' })
            }),
            spacing: { after: 50 },
          })
        )
      }

      // Fecha de evaluación
      const evalDateStr = evalDate || new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
      headerChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Fecha de evaluación: ', bold: true, size: 22 }),
            new TextRun({ text: evalDateStr, size: 22, color: '#555555' }),
          ],
          spacing: { after: 100 },
        })
      )

      // Línea separadora
      headerChildren.push(
        new Paragraph({
          children: [new TextRun({ text: '________________________________________', color: '#cccccc' })],
          spacing: { after: 200 },
          alignment: AlignmentType.CENTER,
        })
      )

      children.push(...headerChildren)

      // ============================================================
      // 2. CUERPO DEL INFORME (según test)
      // ============================================================
      if (isEntrevista && e) {
        // --- Entrevista ---
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Motivación o Inquietud Principal: ', bold: true, size: 24 }),
              new TextRun({ text: e.motivacion_principal || 'No registrada', size: 24 }),
            ],
            spacing: { after: 100 },
            style: 'body',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Información Relevante: ', bold: true, size: 24 }),
              new TextRun({ text: e.info_relevante || 'No registrada', size: 24 }),
            ],
            spacing: { after: 100 },
            style: 'body',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Sugerencias y Acuerdos: ', bold: true, size: 24 }),
              new TextRun({ text: e.sugerencias_acuerdos || 'No registrados', size: 24 }),
            ],
            spacing: { after: 100 },
            style: 'body',
          })
        )
      } 
      else if (testId === 'bdi2') {
        // --- BDI-II (código completo, ya lo tienes, lo omito por brevedad pero aquí iría) ---
        // (Asegúrate de tener la sección completa de BDI-II con tablas e interpretaciones)
        // ...
      } 
      else if (testId === 'coopersmith') {
        // --- Coopersmith (código completo, similar) ---
        // ...
      } 
      else if (testId === 'peca') {
        // --- PECA (código completo) ---
        // ...
      } 
      else {
        // --- WISC-V (código completo) ---
        // ...
      }

      // ============================================================
      // 3. FOOTER (logo + firma + texto institucional)
      // ============================================================
      const footerChildren: any[] = []

      // Línea separadora
      footerChildren.push(
        new Paragraph({
          children: [new TextRun({ text: '________________________________________', color: '#cccccc' })],
          spacing: { before: 200, after: 100 },
          alignment: AlignmentType.CENTER,
        })
      )

      // Logo en el footer (si se pudo cargar)
      if (logoImageBuffer) {
        footerChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: logoImageBuffer,          // <-- CORREGIDO: data en lugar de image
                transformation: { width: 50, height: 50 },
                type: 'png',
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 50 },
          })
        )
      }

      // Espacio para firma
      footerChildren.push(
        new Paragraph({
          text: 'Firma profesional',
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
          style: 'footer',
        }),
        new Paragraph({
          text: '________________________________________',
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),
        // Texto institucional
        new Paragraph({
          children: [
            new TextRun({ text: 'Desarrollado por AQN Praxis', size: 18, color: '#999999' }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          style: 'footer',
        })
      )

      children.push(...footerChildren)

      // ============================================================
      // 4. CREAR EL DOCUMENTO CON ESTILOS
      // ============================================================
      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Georgia',
                size: 24,
                color: STYLES.color,
              },
              paragraph: {
                spacing: { line: 300 },
              },
            },
          },
          paragraphStyles: [
            {
              id: 'title',
              name: 'Title',
              basedOn: 'Normal',
              next: 'Normal',
              run: {
                font: 'Georgia',
                size: 32,
                bold: true,
                color: STYLES.titleColor,
              },
              paragraph: {
                spacing: { before: 200, after: 200 },
                alignment: AlignmentType.CENTER,
              },
            },
            {
              id: 'subtitle',
              name: 'Subtitle',
              basedOn: 'Normal',
              next: 'Normal',
              run: {
                font: 'Georgia',
                size: 28,
                bold: true,
                color: STYLES.subtitleColor,
              },
              paragraph: {
                spacing: { before: 200, after: 100 },
              },
            },
            {
              id: 'body',
              name: 'Body',
              basedOn: 'Normal',
              next: 'Normal',
              run: {
                font: 'Georgia',
                size: 24,
                color: STYLES.color,
              },
              paragraph: {
                spacing: { line: 300 },
                alignment: AlignmentType.JUSTIFIED,
              },
            },
            {
              id: 'tableHeader',
              name: 'TableHeader',
              basedOn: 'Normal',
              run: {
                font: 'Georgia',
                size: 22,
                bold: true,
                color: STYLES.titleColor,
              },
              paragraph: {
                alignment: AlignmentType.CENTER,
              },
            },
            {
              id: 'tableBody',
              name: 'TableBody',
              basedOn: 'Normal',
              run: {
                font: 'Georgia',
                size: 22,
                color: STYLES.color,
              },
              paragraph: {
                alignment: AlignmentType.LEFT,
              },
            },
            {
              id: 'footer',
              name: 'Footer',
              basedOn: 'Normal',
              run: {
                font: 'Georgia',
                size: 20,
                color: '#999999',
                italics: true,
              },
              paragraph: {
                alignment: AlignmentType.CENTER,
              },
            },
          ],
        },
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