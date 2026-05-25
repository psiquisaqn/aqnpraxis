'use client'

import { useState } from 'react'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx'

interface ReportData {
  patientName: string
  patientAge: string
  evalDate: string
  reportType: string
  scaledScores: Record<string, number>
  indexes: Record<string, any>
  interpretations: string[]
  recommendations: string[]
  subtestLabels: Record<string, string>
  indexLabels: Record<string, { name: string; subtests: string[] }>
}

function getClassification(score: number): string {
  if (score >= 130) return 'Muy superior'
  if (score >= 120) return 'Superior'
  if (score >= 110) return 'Promedio alto'
  if (score >= 90) return 'Promedio'
  if (score >= 80) return 'Promedio bajo'
  if (score >= 70) return 'Limítrofe'
  return 'Extremadamente bajo'
}

export function useReportDownload() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateDocx = async (data: ReportData): Promise<Blob> => {
    const { patientName, patientAge, evalDate, reportType, scaledScores, indexes, interpretations, recommendations, subtestLabels, indexLabels } = data

    const children: any[] = []

    // Título
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Informe de Evaluación WISC-V', bold: true, size: 48 })],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    )

    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Escala Wechsler de Inteligencia para Niños - Quinta Edición (Versión Chilena)', size: 24, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    )

    // Datos del evaluado
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Datos del Evaluado', bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 200 }
      })
    )
    children.push(new Paragraph({ children: [new TextRun({ text: `Nombre: ${patientName}` })] }))
    children.push(new Paragraph({ children: [new TextRun({ text: `Edad: ${patientAge}` })] }))
    children.push(new Paragraph({ children: [new TextRun({ text: `Fecha de evaluación: ${evalDate}` })] }))
    children.push(new Paragraph({ children: [new TextRun({ text: `Tipo de informe: ${reportType === 'brief' ? 'Breve (7 subpruebas)' : 'Extendido (15 subpruebas)'}` })] }))

    // Tabla de subpruebas
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Puntajes por Subprueba', bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )

    const primaryCodes = ['CC', 'AN', 'MR', 'RD', 'CLA', 'VOC', 'BAL']
    const tableRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Subprueba', bold: true })] })], width: { size: 35, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Código', bold: true })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'PE', bold: true })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Clasificación', bold: true })], alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } })
        ]
      })
    ]

    for (const code of primaryCodes) {
      const pe = scaledScores[code]
      if (pe !== undefined && pe !== null) {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun(subtestLabels[code] || code)] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun(code)], alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun(String(pe))], alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun(getClassification(pe))], alignment: AlignmentType.CENTER })] })
            ]
          })
        )
      }
    }

    children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }))

    // Índices compuestos
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Índices Compuestos', bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )

    const indexCodes = ['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT']
    const indexRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Índice', bold: true })] })], width: { size: 35, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Puntaje', bold: true })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Percentil', bold: true })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Clasificación', bold: true })], alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } })
        ]
      })
    ]

    for (const code of indexCodes) {
      const idx = indexes[code]
      if (idx) {
        indexRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun(`${indexLabels[code]?.name || code} (${code})`)] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun(String(idx.score))], alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun(idx.percentile)], alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun(getClassification(idx.score))], alignment: AlignmentType.CENTER })] })
            ]
          })
        )
      }
    }

    children.push(new Table({ rows: indexRows, width: { size: 100, type: WidthType.PERCENTAGE } }))

    // Interpretación
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Interpretación de Resultados', bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )
    for (const text of interpretations) {
      children.push(new Paragraph({ children: [new TextRun(text)], spacing: { after: 120 } }))
    }

    // Recomendaciones
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Recomendaciones', bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )
    for (const text of recommendations) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${text}` })],
          spacing: { after: 100 }
        })
      )
    }

    // Nota
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Nota: Este informe ha sido generado automáticamente por AQN Praxis. Los resultados deben ser interpretados por un profesional calificado en el contexto de una evaluación integral.', italics: true, size: 18 })],
        spacing: { before: 400 }
      })
    )

    const doc = new Document({ sections: [{ children }] })
    return await Packer.toBlob(doc)
  }

  const generateOdt = (data: ReportData): Blob => {
    const { patientName, patientAge, evalDate, reportType, scaledScores, indexes, interpretations, recommendations, subtestLabels, indexLabels } = data

    let content = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0">
  <office:body>
    <office:text>
      <text:h text:style-name="Title">Informe de Evaluacion WISC-V</text:h>
      <text:p text:style-name="Subtitle">Escala Wechsler de Inteligencia para Ninos - Quinta Edicion (Version Chilena)</text:p>
      <text:p/>
      <text:h text:style-name="Heading_20_1">Datos del Evaluado</text:h>
      <text:p>Nombre: ${patientName}</text:p>
      <text:p>Edad: ${patientAge}</text:p>
      <text:p>Fecha de evaluacion: ${evalDate}</text:p>
      <text:p>Tipo de informe: ${reportType === 'brief' ? 'Breve (7 subpruebas)' : 'Extendido (15 subpruebas)'}</text:p>
      <text:p/>
      <text:h text:style-name="Heading_20_1">Puntajes por Subprueba</text:h>`

    const primaryCodes = ['CC', 'AN', 'MR', 'RD', 'CLA', 'VOC', 'BAL']
    for (const code of primaryCodes) {
      const pe = scaledScores[code]
      if (pe !== undefined && pe !== null) {
        content += `<text:p>${subtestLabels[code] || code} (${code}): ${pe} - ${getClassification(pe)}</text:p>`
      }
    }

    content += `<text:p/><text:h text:style-name="Heading_20_1">Indices Compuestos</text:h>`
    const indexCodes = ['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT']
    for (const code of indexCodes) {
      const idx = indexes[code]
      if (idx) {
        content += `<text:p>${indexLabels[code]?.name || code} (${code}): ${idx.score} (Percentil ${idx.percentile}) - ${getClassification(idx.score)}</text:p>`
      }
    }

    content += `<text:p/><text:h text:style-name="Heading_20_1">Interpretacion de Resultados</text:h>`
    for (const text of interpretations) {
      content += `<text:p>${text}</text:p>`
    }

    content += `<text:p/><text:h text:style-name="Heading_20_1">Recomendaciones</text:h>`
    for (const text of recommendations) {
      content += `<text:p>- ${text}</text:p>`
    }

    content += `<text:p/><text:p text:style-name="Italic">Nota: Este informe ha sido generado automaticamente por AQN Praxis.</text:p>
    </office:text>
  </office:body>
</office:document-content>`

    return new Blob([content], { type: 'application/vnd.oasis.opendocument.text' })
  }

  const downloadDocx = async (data: ReportData, filename: string) => {
    setGenerating(true)
    setError(null)
    try {
      const blob = await generateDocx(data)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename.endsWith('.docx') ? filename : filename + '.docx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Error al generar DOCX')
    } finally {
      setGenerating(false)
    }
  }

  const downloadOdt = (data: ReportData, filename: string) => {
    setGenerating(true)
    setError(null)
    try {
      const blob = generateOdt(data)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename.endsWith('.odt') ? filename : filename + '.odt'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Error al generar ODT')
    } finally {
      setGenerating(false)
    }
  }

  return { generating, error, downloadDocx, downloadOdt }
}