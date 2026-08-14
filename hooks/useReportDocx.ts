import { saveAs } from 'file-saver'
import type { ReportMeta } from '@/hooks/useReportPdf'

interface ExtendedReportMeta extends ReportMeta {
  patientRut?: string
  patientBirthDate?: string
  patientAge?: number
  patientSchool?: string
  evalDate?: string
}

export function useReportDocx() {
  const generateDocx = async (
    contentRef: React.RefObject<HTMLElement | null>,
    meta: ExtendedReportMeta,
    type: 'docx' | 'odt'
  ) => {
    try {
      const element = contentRef.current
      if (!element) {
        throw new Error('No se encontró el contenido del informe.')
      }

      // Clonar el elemento para no alterar el DOM
      const clone = element.cloneNode(true) as HTMLElement

      // Obtener el HTML completo (incluye estilos en línea y clases)
      // Para asegurar que los estilos se preserven, podemos copiar el estilo del documento
      // o confiar en que el HTML tiene clases de Tailwind y estilos globales.
      const htmlContent = clone.outerHTML // Usamos outerHTML para incluir el contenedor principal

      // Llamar a la API de Next.js
      const response = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlContent }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al generar el DOCX')
      }

      // Obtener el blob
      const blob = await response.blob()

      // Generar nombre de archivo
      const extension = type === 'docx' ? 'docx' : 'odt' // ODT no es soportado, pero mantenemos la extensión
      let fileName = `Informe_${meta.patientName || 'sin_paciente'}_${new Date().toISOString().slice(0, 10)}.${extension}`
      if (meta.testId) {
        fileName = `${meta.testId.toUpperCase()}_${meta.patientName || 'sin_paciente'}_${new Date().toISOString().slice(0, 10)}.${extension}`
      }

      // Descargar
      saveAs(blob, fileName)

      return { success: true, message: `Informe guardado como ${extension.toUpperCase()}` }
    } catch (error) {
      console.error('Error generando DOCX/ODT:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }

  return { generateDocx }
}