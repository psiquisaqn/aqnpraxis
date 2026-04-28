'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

// ============================================================
// PÁGINA DE CONFIGURACIÓN DE REJILLA PARA CLAVES WISC-V
// URL: /dashboard/configuracion/wisc5-cla
// Sin enlace en la UI - solo accesible por URL directa
// ============================================================

interface GridConfig {
  template_a_row_positions: number[]
  template_a_row_height: number
  template_a_cell_widths: number[]
  template_b_row_positions: number[]
  template_b_row_height: number
  template_b_cell_widths: number[]
}

export default function Wisc5ClaConfigPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const [activeTemplate, setActiveTemplate] = useState<'A' | 'B'>('A')
  const [config, setConfig] = useState<GridConfig>({
    template_a_row_positions: [0.15, 0.38, 0.62, 0.85],
    template_a_row_height: 0.15,
    template_a_cell_widths: Array(8).fill(1/8),
    template_b_row_positions: [0.15, 0.38, 0.62, 0.85],
    template_b_row_height: 0.15,
    template_b_cell_widths: Array(15).fill(1/15),
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testImage, setTestImage] = useState<string | null>(null)
  const [overlayPosition, setOverlayPosition] = useState({ x: 50, y: 50 })
  const [overlayScale, setOverlayScale] = useState({ x: 1, y: 1 })
  const [showOverlay, setShowOverlay] = useState(true)
  const [showColumnAdjust, setShowColumnAdjust] = useState(false)

  // Cargar configuración guardada desde Supabase
  useEffect(() => {
    const loadConfig = async () => {
      const { data } = await supabase
        .from('wisc5_cla_grid_config')
        .select('*')
        .eq('id', 1)
        .single()
      
      if (data) {
        setConfig({
          template_a_row_positions: (data.template_a_row_positions as number[]) || [0.15, 0.38, 0.62, 0.85],
          template_a_row_height: data.template_a_row_height || 0.15,
          template_a_cell_widths: (data.template_a_cell_widths as number[]) || Array(8).fill(1/8),
          template_b_row_positions: (data.template_b_row_positions as number[]) || [0.15, 0.38, 0.62, 0.85],
          template_b_row_height: data.template_b_row_height || 0.15,
          template_b_cell_widths: (data.template_b_cell_widths as number[]) || Array(15).fill(1/15),
        })
      }
      setLoading(false)
    }
    loadConfig()
  }, [supabase])

  const getActivePositions = (): number[] => {
    return activeTemplate === 'A' 
      ? [...config.template_a_row_positions] 
      : [...config.template_b_row_positions]
  }

  const getActiveHeight = (): number => {
    return activeTemplate === 'A' 
      ? config.template_a_row_height 
      : config.template_b_row_height
  }

  const getActiveCellWidths = (): number[] => {
    return activeTemplate === 'A' 
      ? [...config.template_a_cell_widths]
      : [...config.template_b_cell_widths]
  }

  const updatePositions = (newPositions: number[]) => {
    if (activeTemplate === 'A') {
      setConfig({ ...config, template_a_row_positions: newPositions })
    } else {
      setConfig({ ...config, template_b_row_positions: newPositions })
    }
  }

  const updateHeight = (newHeight: number) => {
    if (activeTemplate === 'A') {
      setConfig({ ...config, template_a_row_height: newHeight })
    } else {
      setConfig({ ...config, template_b_row_height: newHeight })
    }
  }

  const updateCellWidths = (newWidths: number[]) => {
    if (activeTemplate === 'A') {
      setConfig({ ...config, template_a_cell_widths: newWidths })
    } else {
      setConfig({ ...config, template_b_cell_widths: newWidths })
    }
  }

  const saveConfig = async () => {
    const { error } = await supabase
      .from('wisc5_cla_grid_config')
      .upsert({
        id: 1,
        template_a_row_positions: config.template_a_row_positions,
        template_a_row_height: config.template_a_row_height,
        template_a_cell_widths: config.template_a_cell_widths,
        template_b_row_positions: config.template_b_row_positions,
        template_b_row_height: config.template_b_row_height,
        template_b_cell_widths: config.template_b_cell_widths,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      alert('Error al guardar: ' + error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const loadTestImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setTestImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Dibujar previsualización en canvas
  useEffect(() => {
    if (!testImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const baseImg = new Image()
    const overlayImg = new Image()
    let loadedCount = 0

    const drawCanvas = () => {
      loadedCount++
      if (loadedCount < 2) return

      canvas.width = baseImg.width
      canvas.height = baseImg.height
      
      // Dibujar imagen base
      ctx.drawImage(baseImg, 0, 0)
      
      // Dibujar overlay si está activo
      if (showOverlay) {
        ctx.save()
        ctx.translate(overlayPosition.x, overlayPosition.y)
        ctx.scale(overlayScale.x, overlayScale.y)
        ctx.globalAlpha = 0.7
        ctx.drawImage(overlayImg, 0, 0)
        ctx.globalAlpha = 1.0
        
        // Dibujar rejilla de previsualización
        const scaledWidth = overlayImg.width * overlayScale.x
        const scaledHeight = overlayImg.height * overlayScale.y
        const cellsPerRow = activeTemplate === 'A' ? 8 : 15
        const positions = getActivePositions()
        const rowH = getActiveHeight()
        const colWidths = getActiveCellWidths()
        
        let xOffset = 0
        for (let pair = 0; pair < 4; pair++) {
          xOffset = 0
          for (let col = 0; col < cellsPerRow; col++) {
            const w = colWidths[col] * scaledWidth
            const x = xOffset
            const y = positions[pair] * scaledHeight
            const h = rowH * scaledHeight
            xOffset += w
            
            ctx.strokeStyle = '#3B82F6'
            ctx.lineWidth = 2
            ctx.strokeRect(x, y, w, h)
            
            // Número de fila y columna
            ctx.fillStyle = '#3B82F6'
            ctx.font = 'bold 10px Arial'
            ctx.fillText(`F${pair + 1}`, x + 2, y + 12)
          }
        }
        
        ctx.restore()
      }
    }

    baseImg.onload = drawCanvas
    overlayImg.onload = drawCanvas
    
    baseImg.src = testImage
    overlayImg.src = `/wisc5/cla/plantilla-claves-${activeTemplate.toLowerCase()}.png`

  }, [testImage, activeTemplate, showOverlay, overlayPosition, overlayScale, config])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  const COLS = activeTemplate === 'A' ? 8 : 15

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div>
              <h1 className="text-xl font-bold text-gray-800">⚙️ Configuración de Rejilla - Claves WISC-V</h1>
              <p className="text-sm text-gray-500 mt-1">
                Página de calibración administrativa. Sin enlace en la interfaz de usuario.
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              ← Volver al Dashboard
            </button>
          </div>

          {/* Selector de plantilla */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTemplate('A')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTemplate === 'A' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Plantilla A (6-7 años)
            </button>
            <button
              onClick={() => setActiveTemplate('B')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTemplate === 'B' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Plantilla B (8-16 años)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Columna izquierda: Vista previa */}
            <div>
              {/* Plantilla PNG */}
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Plantilla PNG actual:</h2>
                <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center min-h-[120px]">
                  <img 
                    src={`/wisc5/cla/plantilla-claves-${activeTemplate.toLowerCase()}.png`}
                    alt={`Plantilla Claves ${activeTemplate}`}
                    className="max-h-48 object-contain"
                  />
                </div>
              </div>

              {/* Subir imagen de prueba */}
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Imagen de prueba:</h2>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={loadTestImage}
                  className="mb-2 text-sm w-full"
                />
                {testImage && (
                  <div className="flex gap-2 mb-2">
                    <label className="flex items-center gap-1 text-xs text-gray-600">
                      <input type="checkbox" checked={showOverlay} onChange={(e) => setShowOverlay(e.target.checked)} />
                      Mostrar plantilla superpuesta
                    </label>
                  </div>
                )}
              </div>

              {/* Canvas de previsualización */}
              {testImage && (
                <div className="border border-gray-200 rounded-lg overflow-auto bg-gray-100" style={{ maxHeight: '400px' }}>
                  <canvas ref={canvasRef} className="w-full h-auto" />
                </div>
              )}
              
              {!testImage && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
                  <p className="text-sm">Sube una imagen de prueba para previsualizar la rejilla</p>
                  <p className="text-xs mt-1">Foto de una hoja de respuestas de Claves</p>
                </div>
              )}

              {/* Controles de overlay */}
              {testImage && showOverlay && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Zoom X: {overlayScale.x.toFixed(2)}</label>
                    <input type="range" min="0.3" max="3.0" step="0.01" value={overlayScale.x}
                      onChange={(e) => setOverlayScale({ ...overlayScale, x: parseFloat(e.target.value) })} className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Zoom Y: {overlayScale.y.toFixed(2)}</label>
                    <input type="range" min="0.3" max="3.0" step="0.01" value={overlayScale.y}
                      onChange={(e) => setOverlayScale({ ...overlayScale, y: parseFloat(e.target.value) })} className="w-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha: Controles de ajuste */}
            <div className="space-y-4">
              
              {/* Ajuste de posición de filas */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h2 className="text-md font-semibold text-yellow-800 mb-3">
                  📍 Posición de filas - Plantilla {activeTemplate}
                </h2>
                
                <div className="space-y-3">
                  {getActivePositions().map((pos, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <label className="text-gray-700 font-medium">Fila {index + 1}</label>
                        <span className="text-blue-600 font-mono">{(pos * 100).toFixed(1)}%</span>
                      </div>
                      <input type="range" min="0.01" max="0.95" step="0.001" value={pos}
                        onChange={(e) => {
                          const newPositions = getActivePositions()
                          newPositions[index] = parseFloat(e.target.value)
                          updatePositions(newPositions)
                        }} className="w-full" />
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t border-yellow-300">
                    <div className="flex justify-between text-sm mb-1">
                      <label className="text-gray-700 font-medium">Altura de ventanas</label>
                      <span className="text-blue-600 font-mono">{(getActiveHeight() * 100).toFixed(1)}%</span>
                    </div>
                    <input type="range" min="0.02" max="0.30" step="0.001" value={getActiveHeight()}
                      onChange={(e) => updateHeight(parseFloat(e.target.value))} className="w-full" />
                  </div>

                  <button 
                    onClick={() => {
                      updatePositions([0.15, 0.38, 0.62, 0.85])
                      updateHeight(0.15)
                    }}
                    className="w-full py-2 bg-white text-yellow-700 rounded-lg text-sm hover:bg-yellow-100 border border-yellow-300 transition-colors"
                  >
                    ↻ Restaurar valores predeterminados
                  </button>
                </div>
              </div>

              {/* Ajuste de ancho de columnas */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-md font-semibold text-green-800">
                    📏 Ancho de columnas
                  </h2>
                  <button
                    onClick={() => setShowColumnAdjust(!showColumnAdjust)}
                    className="text-xs text-green-700 hover:underline"
                  >
                    {showColumnAdjust ? '▲ Ocultar' : '▼ Mostrar'}
                  </button>
                </div>
                
                {showColumnAdjust && (
                  <div className="space-y-2">
                    <p className="text-xs text-green-700 mb-2">
                      Ajusta cada columna individualmente. La suma ideal es 100%.
                    </p>
                    
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {getActiveCellWidths().map((width, index) => (
                        <div key={`col-${index}`} className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-6">C{index + 1}</span>
                          <input type="range" min="0.02" max="0.25" step="0.001" value={width}
                            onChange={(e) => {
                              const newWidths = getActiveCellWidths()
                              newWidths[index] = parseFloat(e.target.value)
                              updateCellWidths(newWidths)
                            }} className="flex-1" />
                          <span className="text-xs text-blue-600 font-mono w-10 text-right">{(width * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-green-300">
                      <span className={`text-xs font-medium ${
                        Math.abs(getActiveCellWidths().reduce((a, b) => a + b, 0) - 1) > 0.01 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        Suma: {(getActiveCellWidths().reduce((a, b) => a + b, 0) * 100).toFixed(1)}%
                        {Math.abs(getActiveCellWidths().reduce((a, b) => a + b, 0) - 1) > 0.01 && ' ⚠️'}
                      </span>
                      <button
                        onClick={() => updateCellWidths(Array(COLS).fill(1/COLS))}
                        className="text-xs text-green-700 hover:underline"
                      >
                        Distribuir uniformemente
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen de configuración */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-blue-800 mb-3">📋 Configuración actual</h2>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <h3 className="font-medium text-gray-700">Plantilla A (6-7 años)</h3>
                    <p className="text-gray-600 text-xs mt-1">
                      Filas: {config.template_a_row_positions.map(p => (p * 100).toFixed(1) + '%').join(', ')}
                    </p>
                    <p className="text-gray-600 text-xs">
                      Altura: {(config.template_a_row_height * 100).toFixed(1)}%
                    </p>
                    <p className="text-gray-600 text-xs">
                      Columnas: {config.template_a_cell_widths.length} cols
                    </p>
                  </div>
                  <div className="pt-2 border-t border-blue-200">
                    <h3 className="font-medium text-gray-700">Plantilla B (8-16 años)</h3>
                    <p className="text-gray-600 text-xs mt-1">
                      Filas: {config.template_b_row_positions.map(p => (p * 100).toFixed(1) + '%').join(', ')}
                    </p>
                    <p className="text-gray-600 text-xs">
                      Altura: {(config.template_b_row_height * 100).toFixed(1)}%
                    </p>
                    <p className="text-gray-600 text-xs">
                      Columnas: {config.template_b_cell_widths.length} cols
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de guardar */}
              <button
                onClick={saveConfig}
                className={`w-full py-4 rounded-lg font-bold text-white transition-all text-lg ${
                  saved 
                    ? 'bg-green-600 scale-95' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                }`}
              >
                {saved ? '✅ ¡Configuración guardada!' : '💾 Guardar configuración para todos los usuarios'}
              </button>
              
              {saved && (
                <p className="text-green-600 text-xs text-center">
                  La configuración se aplicará a todas las nuevas evaluaciones
                </p>
              )}
            </div>
          </div>

          {/* Instrucciones */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">📖 Instrucciones de calibración</h2>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Selecciona la plantilla a calibrar (A o B)</li>
              <li>Sube una foto de ejemplo de una hoja de respuestas de Claves</li>
              <li>Activa "Mostrar plantilla superpuesta" para ver el PNG sobre la foto</li>
              <li>Ajusta Zoom X/Y para que la plantilla coincida en tamaño con la hoja</li>
              <li>Usa los sliders de "Fila 1-4" para mover cada fila de ventanas a su posición correcta</li>
              <li>Ajusta "Altura de ventanas" para que coincida con la altura de las ventanas transparentes</li>
              <li>Expande "Ancho de columnas" para ajustar cada columna individualmente si es necesario</li>
              <li>Cuando la rejilla azul coincida perfectamente con las ventanas, guarda la configuración</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}