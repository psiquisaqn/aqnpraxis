import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, TableLayoutType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'
import type { ReportMeta } from '@/hooks/useReportPdf'

// Importar funciones de interpretación para todos los tests
import { getInterpretacionSeveridad, getInterpretacionDimension, getConclusionGeneral as getBdiConclusion } from '@/lib/interpretaciones/bdi2'
import { getInterpretacionSubescala, getConclusionGeneral as getCoopersmithConclusion } from '@/lib/interpretaciones/coopersmith'
import { getInterpretacionParticipacion, getInterpretacionDimension as getPecaDimension, getConclusionGeneral as getPecaConclusion } from '@/lib/interpretaciones/peca'
import { getClassification, getScaledClassification, getSubtestInterpretation, getInterpretacionIndice } from '@/lib/interpretaciones/wisc5'

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

// Estilos comunes para el documento
const STYLES = {
  font: 'Georgia, Times New Roman, serif',
  fontSize: 12,
  lineHeight: 1.5,
  color: '#333333',
  titleColor: '#1a1a1a',
  subtitleColor: '#2d2d2d',
  primaryColor: '#3B82F6',
  accentColor: '#4a4a4a',
  borderColor: '#cccccc',
}

export function useReportDocx() {
  const generateDocx = async (contentRef: React.RefObject<HTMLElement | null>, meta: ReportMeta, type: 'docx' | 'odt') => {
    try {
      const { patientName, content, testId } = meta
      const data = content as any
      const { indexes, scaledScores } = data || {}

      const isEntrevista = data?.type === 'entrevista'
      const e = isEntrevista ? (data as unknown as EntrevistaContent) : undefined

      const children: any[] = []

      // ============================================================
      // FUNCIÓN AUXILIAR PARA CREAR BORDE DE TABLA
      // ============================================================
      const tableBorder = {
        style: BorderStyle.SINGLE,
        size: 1,
        color: STYLES.borderColor,
      }

      // ============================================================
      // ENTREVISTA (sin cambios, pero con estilos mejorados)
      // ============================================================
      if (isEntrevista && e) {
        children.push(
          new Paragraph({
            text: 'Informe de Entrevista Psicológica',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            style: 'title',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true, size: 24 }),
              new TextRun({ text: patientName || 'No especificado', size: 24 }),
            ],
            spacing: { after: 100 },
          })
        )

        if (e.fecha) {
          const fechaFormateada = new Date(e.fecha).toLocaleDateString('es-CL')
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Fecha: ', bold: true, size: 24 }),
                new TextRun({ text: fechaFormateada, size: 24 }),
                new TextRun({ text: '     Hora: ', bold: true, size: 24 }),
                new TextRun({ text: e.hora || 'No registrada', size: 24 }),
              ],
              spacing: { after: 100 },
            })
          )
        }

        if (e.asistentes) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Asistentes: ', bold: true, size: 24 }),
                new TextRun({ text: e.asistentes, size: 24 }),
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
              style: 'subtitle',
            }),
            new Paragraph({ text: e.motivacion_principal, spacing: { after: 200 }, style: 'body' })
          )
        }

        if (e.info_relevante) {
          children.push(
            new Paragraph({
              text: 'Información Relevante',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
              style: 'subtitle',
            }),
            new Paragraph({ text: e.info_relevante, spacing: { after: 200 }, style: 'body' })
          )
        }

        if (e.sugerencias_acuerdos) {
          children.push(
            new Paragraph({
              text: 'Sugerencias y Acuerdos',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
              style: 'subtitle',
            }),
            new Paragraph({ text: e.sugerencias_acuerdos, spacing: { after: 200 }, style: 'body' })
          )
        }

        children.push(
          new Paragraph({
            text: '--- Fin del informe ---',
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            style: 'footer',
          })
        )
      }

      // ============================================================
      // BDI‑II (completo con interpretaciones)
      // ============================================================
      else if (testId === 'bdi2') {
        const totalScore = data.totalScore ?? 0
        const severity = data.severity ?? 'No clasificado'
        const cognitiveAffectiveScore = data.cognitiveAffectiveScore ?? 0
        const somaticMotivationalScore = data.somaticMotivationalScore ?? 0
        const suicidalIdeationScore = data.suicidalIdeationScore ?? 0

        const interpretacion = getInterpretacionSeveridad(totalScore)

        children.push(
          new Paragraph({
            text: 'Informe BDI-II - Inventario de Depresión',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            style: 'title',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true, size: 24 }),
              new TextRun({ text: patientName || 'No especificado', size: 24 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Fecha de informe: ', bold: true, size: 24 }),
              new TextRun({ text: new Date().toLocaleDateString('es-CL'), size: 24 }),
            ],
            spacing: { after: 200 },
          }),
          // Puntaje total
          new Paragraph({
            text: 'Puntaje Total',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            style: 'subtitle',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Puntaje: ${totalScore} (${interpretacion.nivel})`, bold: true, size: 24, color: STYLES.primaryColor }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: interpretacion.descripcion,
            spacing: { after: 50 },
            style: 'body',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Recomendación: ', bold: true, size: 24 }),
              new TextRun({ text: interpretacion.recomendacion, size: 24 }),
            ],
            spacing: { after: 200 },
            style: 'body',
          }),
          // Tabla de dimensiones
          new Paragraph({
            text: 'Perfil de Dimensiones',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            style: 'subtitle',
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Dimensión', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Puntaje', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Máximo', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Porcentaje', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Cognitivo-Afectivo', style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: String(cognitiveAffectiveScore), alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: '42', alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: `${Math.round((cognitiveAffectiveScore / 42) * 100)}%`, alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Somático-Motivacional', style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: String(somaticMotivationalScore), alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: '21', alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: `${Math.round((somaticMotivationalScore / 21) * 100)}%`, alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Ideación Suicida', style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: String(suicidalIdeationScore), alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: '6', alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: `${Math.round((suicidalIdeationScore / 6) * 100)}%`, alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            borders: { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder, insideHorizontal: tableBorder, insideVertical: tableBorder },
          }),
          // Interpretación de dimensiones
          new Paragraph({
            text: 'Interpretación de Dimensiones',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            style: 'subtitle',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Cognitivo-Afectivo: ', bold: true, size: 24 }),
              new TextRun({ text: getInterpretacionDimension('Cognitivo-Afectivo', cognitiveAffectiveScore, 42), size: 24 }),
            ],
            spacing: { after: 50 },
            style: 'body',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Somático-Motivacional: ', bold: true, size: 24 }),
              new TextRun({ text: getInterpretacionDimension('Somático-Motivacional', somaticMotivationalScore, 21), size: 24 }),
            ],
            spacing: { after: 50 },
            style: 'body',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Ideación Suicida: ', bold: true, size: 24 }),
              new TextRun({ text: getInterpretacionDimension('Ideación Suicida', suicidalIdeationScore, 6), size: 24 }),
            ],
            spacing: { after: 200 },
            style: 'body',
          }),
          // Conclusión
          new Paragraph({
            text: 'Conclusión y Recomendaciones',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            style: 'subtitle',
          }),
          new Paragraph({
            text: getBdiConclusion(totalScore, severity, patientName),
            spacing: { after: 200 },
            style: 'body',
          }),
        )
      }

      // ============================================================
      // COOPERSMITH (completo con interpretaciones)
      // ============================================================
      else if (testId === 'coopersmith') {
        const totalScore = data.totalScore ?? 0
        const level = data.level ?? ''
        const general = data.general ?? 0
        const social = data.social ?? 0
        const familiar = data.familiar ?? 0
        const academico = data.academico ?? 0

        const subscales = [
          { label: 'General', scaledScore: general, maxScaled: 26 },
          { label: 'Social', scaledScore: social, maxScaled: 8 },
          { label: 'Familiar', scaledScore: familiar, maxScaled: 8 },
          { label: 'Académico', scaledScore: academico, maxScaled: 8 },
        ]

        // Construimos un objeto para la conclusión
        const resultForConclusion = {
          totalScaled: totalScore,
          levelLabel: level,
          lieScaleInvalid: false,
          lieScaleRaw: 0,
          subscales: subscales.map(s => ({ code: s.label.toLowerCase(), label: s.label, scaledScore: s.scaledScore, maxScaled: s.maxScaled, pct: s.scaledScore / s.maxScaled })),
        }

        children.push(
          new Paragraph({
            text: 'Informe Coopersmith - Inventario de Autoestima',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            style: 'title',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true, size: 24 }),
              new TextRun({ text: patientName || 'No especificado', size: 24 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Fecha de informe: ', bold: true, size: 24 }),
              new TextRun({ text: new Date().toLocaleDateString('es-CL'), size: 24 }),
            ],
            spacing: { after: 200 },
          }),
          // Puntaje total
          new Paragraph({
            text: 'Puntaje Total',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            style: 'subtitle',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Puntaje: ${totalScore} (${level})`, bold: true, size: 24, color: STYLES.primaryColor }),
            ],
            spacing: { after: 50 },
          }),
          // Tabla de subescalas
          new Paragraph({
            text: 'Subescalas',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            style: 'subtitle',
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Área', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Puntaje', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Máximo', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Porcentaje', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                ],
              }),
              ...subscales.map(s => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: s.label, style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: String(s.scaledScore), alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: String(s.maxScaled), alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: `${Math.round((s.scaledScore / s.maxScaled) * 100)}%`, alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                ],
              })),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            borders: { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder, insideHorizontal: tableBorder, insideVertical: tableBorder },
          }),
          // Interpretación de subescalas
          new Paragraph({
            text: 'Interpretación de Subescalas',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            style: 'subtitle',
          }),
          ...subscales.map(s => new Paragraph({
            children: [
              new TextRun({ text: `${s.label}: `, bold: true, size: 24 }),
              new TextRun({ text: getInterpretacionSubescala(s.scaledScore, s.maxScaled, s.label), size: 24 }),
            ],
            spacing: { after: 50 },
            style: 'body',
          })),
          // Conclusión
          new Paragraph({
            text: 'Conclusión y Recomendaciones',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            style: 'subtitle',
          }),
          new Paragraph({
            text: getCoopersmithConclusion(resultForConclusion, patientName),
            spacing: { after: 200 },
            style: 'body',
          }),
        )
      }

      // ============================================================
      // PECA (completo con interpretaciones)
      // ============================================================
      else if (testId === 'peca') {
        const participationLevel = data.participationLevel ?? 0
        const dimensions = data.dimensions ?? []
        const aamrSets = data.aamrSets ?? []
        const participationText = data.participationText ?? ''
        const participationNeeds = data.participationNeeds ?? false

        const resultado = {
          participationLevel,
          dimensions,
          aamrSets,
          participationText,
          participationNeeds,
        }

        const interpretacion = getInterpretacionParticipacion(Math.round(participationLevel * 100))

        children.push(
          new Paragraph({
            text: 'Informe PECA - Prueba de Evaluación de Conducta Adaptativa',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            style: 'title',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true, size: 24 }),
              new TextRun({ text: patientName || 'No especificado', size: 24 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Fecha de informe: ', bold: true, size: 24 }),
              new TextRun({ text: new Date().toLocaleDateString('es-CL'), size: 24 }),
            ],
            spacing: { after: 200 },
          }),
          // Participación general
          new Paragraph({
            text: 'Participación General',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            style: 'subtitle',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Nivel: ${Math.round(participationLevel * 100)}% (${interpretacion.nivel})`, bold: true, size: 24, color: STYLES.primaryColor }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: interpretacion.descripcion,
            spacing: { after: 50 },
            style: 'body',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Recomendación: ', bold: true, size: 24 }),
              new TextRun({ text: interpretacion.recomendacion, size: 24 }),
            ],
            spacing: { after: 200 },
            style: 'body',
          }),
          // Dimensiones
          new Paragraph({
            text: 'Dimensiones Adaptativas',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            style: 'subtitle',
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Dimensión', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Puntaje', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Intensidad', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                ],
              }),
              ...dimensions.map((dim: any) => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: dim.label, style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: `${Math.round(dim.p2 * 100)}%`, alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                  new TableCell({ children: [new Paragraph({ text: dim.intensityLabel, alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                ],
              })),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            borders: { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder, insideHorizontal: tableBorder, insideVertical: tableBorder },
          }),
          // Interpretación de dimensiones
          new Paragraph({
            text: 'Interpretación de Dimensiones',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            style: 'subtitle',
          }),
          ...dimensions.map((dim: any) => new Paragraph({
            children: [
              new TextRun({ text: `${dim.label}: `, bold: true, size: 24 }),
              new TextRun({ text: getPecaDimension(dim.code, dim.p2, dim.intensityLabel), size: 24 }),
            ],
            spacing: { after: 50 },
            style: 'body',
          })),
          // Conjuntos AAMR (si existen)
          ...(aamrSets && aamrSets.length > 0 ? [
            new Paragraph({
              text: 'Conjuntos AAMR',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
              style: 'subtitle',
            }),
            ...aamrSets.map((set: any) => new Paragraph({
              children: [
                new TextRun({ text: `${set.label}: `, bold: true, size: 24 }),
                new TextRun({ text: `${set.descriptionText} (${set.demandLabel})`, size: 24 }),
              ],
              spacing: { after: 30 },
              style: 'body',
            })),
          ] : []),
          // Conclusión
          new Paragraph({
            text: 'Conclusión y Recomendaciones',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            style: 'subtitle',
          }),
          new Paragraph({
            text: getPecaConclusion(resultado, patientName),
            spacing: { after: 200 },
            style: 'body',
          }),
        )
      }

      // ============================================================
      // WISC‑V (completo con interpretaciones)
      // ============================================================
      else {
        // WISC-V (por defecto)
        children.push(
          new Paragraph({
            text: 'Informe WISC-V',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            style: 'title',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true, size: 24 }),
              new TextRun({ text: patientName || 'No especificado', size: 24 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Fecha de evaluación: ', bold: true, size: 24 }),
              new TextRun({ text: new Date().toLocaleDateString('es-CL'), size: 24 }),
            ],
            spacing: { after: 200 },
          }),
        )

        // Índices Compuestos
        if (indexes && typeof indexes === 'object') {
          children.push(
            new Paragraph({
              text: 'Índices Compuestos',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
              style: 'subtitle',
            })
          )
          const indexCodes = ['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT']
          const indexRows: TableRow[] = [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Índice', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                new TableCell({ children: [new Paragraph({ text: 'Puntaje', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                new TableCell({ children: [new Paragraph({ text: 'Clasificación', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
              ],
            }),
          ]
          for (const code of indexCodes) {
            const idx = (indexes as any)[code]
            if (idx && idx.score !== undefined) {
              const clasif = getClassification(idx.score)
              indexRows.push(
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: code, style: 'tableBody' })] }),
                    new TableCell({ children: [new Paragraph({ text: String(idx.score), alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                    new TableCell({ children: [new Paragraph({ text: clasif, alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                  ],
                })
              )
            }
          }
          children.push(
            new Table({
              rows: indexRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              borders: { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder, insideHorizontal: tableBorder, insideVertical: tableBorder },
            })
          )
          // Interpretación de índices
          children.push(
            new Paragraph({
              text: 'Interpretación de Índices',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
              style: 'subtitle',
            })
          )
          for (const code of indexCodes) {
            const idx = (indexes as any)[code]
            if (idx && idx.score !== undefined) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: `${code}: `, bold: true, size: 24 }),
                    new TextRun({ text: getInterpretacionIndice(code, idx.score), size: 24 }),
                  ],
                  spacing: { after: 30 },
                  style: 'body',
                })
              )
            }
          }
        }

        // Subpruebas
        if (scaledScores && typeof scaledScores === 'object') {
          children.push(
            new Paragraph({
              text: 'Puntajes por Subprueba',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
              style: 'subtitle',
            })
          )
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
          const subtestRows: TableRow[] = [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Subprueba', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                new TableCell({ children: [new Paragraph({ text: 'PE', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
                new TableCell({ children: [new Paragraph({ text: 'Clasificación', alignment: AlignmentType.CENTER, style: 'tableHeader' })] }),
              ],
            }),
          ]
          const entries = Object.entries(scaledScores).filter(([_, pe]) => pe !== null && pe !== undefined)
          for (const [code, pe] of entries) {
            const peNum = typeof pe === 'number' ? pe : Number(pe)
            if (!isNaN(peNum)) {
              const label = subtestLabels[code] || code
              const clasif = getScaledClassification(peNum)
              subtestRows.push(
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: label, style: 'tableBody' })] }),
                    new TableCell({ children: [new Paragraph({ text: String(peNum), alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                    new TableCell({ children: [new Paragraph({ text: clasif, alignment: AlignmentType.CENTER, style: 'tableBody' })] }),
                  ],
                })
              )
            }
          }
          children.push(
            new Table({
              rows: subtestRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              borders: { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder, insideHorizontal: tableBorder, insideVertical: tableBorder },
            })
          )
          // Interpretación de subpruebas
          children.push(
            new Paragraph({
              text: 'Interpretación de Subpruebas',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
              style: 'subtitle',
            })
          )
          for (const [code, pe] of entries) {
            const peNum = typeof pe === 'number' ? pe : Number(pe)
            if (!isNaN(peNum)) {
              const label = subtestLabels[code] || code
              const interp = getSubtestInterpretation(code, peNum)
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: `${label}: `, bold: true, size: 24 }),
                    new TextRun({ text: interp, size: 24 }),
                  ],
                  spacing: { after: 30 },
                  style: 'body',
                })
              )
            }
          }
          // Recomendaciones finales (genéricas)
          children.push(
            new Paragraph({
              text: 'Recomendaciones Finales',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
              style: 'subtitle',
            }),
            new Paragraph({
              text: 'Con base en los resultados obtenidos, se sugiere potenciar las áreas de fortaleza identificadas mediante actividades desafiantes que mantengan el interés y promuevan el desarrollo de habilidades superiores. En las áreas de debilidad, se deben implementar apoyos específicos según los índices más bajos. Se recomienda una reevaluación en 12 a 18 meses para monitorear la evolución del perfil cognitivo y ajustar las intervenciones según sea necesario. Los resultados deben interpretarse en el contexto de la historia personal, educativa y familiar del evaluado.',
              spacing: { after: 200 },
              style: 'body',
            })
          )
        }
      }

      // ============================================================
      // CREAR EL DOCUMENTO CON ESTILOS
      // ============================================================
      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Georgia',
                size: 24, // 12pt
                color: STYLES.color,
              },
              paragraph: {
                spacing: {
                  line: 300, // 1.5 interlineado
                },
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