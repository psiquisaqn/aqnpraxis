'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// ============================================================
// COMPONENTE DE CRONÓMETRO (120 SEGUNDOS)
// ============================================================

interface StopwatchProps {
  timeLimit: number
  onTimeUpdate: (seconds: number) => void
  onTimeEnd: () => void
  onStart?: () => void
  isRunning: boolean
  onToggleRunning: () => void
}

function Stopwatch({ timeLimit, onTimeUpdate, onTimeEnd, onStart, isRunning, onToggleRunning }: StopwatchProps) {
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1
          onTimeUpdate(newSeconds)
          if (newSeconds >= timeLimit) {
            onToggleRunning()
            onTimeEnd()
            return timeLimit
          }
          return newSeconds
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLimit, onTimeUpdate, onTimeEnd, onToggleRunning])

  const startTimer = () => {
    setSeconds(0)
    onToggleRunning()
    onStart?.()
  }

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercent = (): number => Math.min((seconds / timeLimit) * 100, 100)
  const isTimeCritical = seconds >= timeLimit - 10

  if (!isRunning && seconds === 0) {
    return (
      <div className="text-center">
        <div className="text-4xl font-mono font-bold mb-2 text-gray-800">{formatTime(0)}</div>
        <button onClick={startTimer} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-medium">
          Iniciar prueba (120 segundos)
        </button>
        <div className="text-xs text-gray-400 mt-2">Tiempo límite: 2 minutos</div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className={`text-5xl font-mono font-bold mb-2 transition-colors ${isTimeCritical ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
        {formatTime(seconds)}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div className={`h-full transition-all duration-1000 ${isTimeCritical ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${getProgressPercent()}%` }} />
      </div>
      <div className="flex gap-2 justify-center">
        {isRunning ? (
          <button onClick={onToggleRunning} className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm">Pausar</button>
        ) : (
          <button onClick={onToggleRunning} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Reanudar</button>
        )}
        <button onClick={() => { setSeconds(0); onTimeUpdate(0) }} className="px-4 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm">Reiniciar</button>
      </div>
      <div className="text-xs text-gray-400 mt-2">
        {seconds >= timeLimit ? '⏰ ¡Tiempo finalizado!' : `Restan ${formatTime(timeLimit - seconds)}`}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE DE CÁMARA (ESPEJO AUTOMÁTICO PARA LAPTOP)
// ============================================================

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onClose: () => void
}

function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isFrontCamera, setIsFrontCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    const initCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Tu navegador no soporta acceso a la cámara')
        }

        let mediaStream: MediaStream
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
          })
          setIsFrontCamera(false)
        } catch {
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } } 
          })
          setIsFrontCamera(true)
        }
        
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.onloadedmetadata = () => setCameraReady(true)
        }
      } catch (err: any) {
        setError(`No se pudo acceder a la cámara: ${err.message}`)
      }
    }

    initCamera()
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()) }
  }, [])

  const capturePhoto = () => {
    setCapturing(true)
    setTimeout(() => {
      try {
        if (!videoRef.current || !canvasRef.current) throw new Error('Referencias no disponibles')
        const video = videoRef.current
        const canvas = canvasRef.current
        
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          throw new Error('El video no tiene dimensiones válidas')
        }
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        const context = canvas.getContext('2d')
        if (!context) throw new Error('No se pudo obtener contexto')
        
        // Aplicar espejo para cámara frontal (laptop) automáticamente
        if (isFrontCamera) {
          context.translate(canvas.width, 0)
          context.scale(-1, 1)
        }
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        if (isFrontCamera) context.setTransform(1, 0, 0, 1, 0, 0)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.85)
        setCapturedImage(imageData)
        setShowPreview(true)
        setCapturing(false)
      } catch (err: any) {
        setError(`Error al capturar: ${err.message}`)
        setCapturing(false)
      }
    }, 100)
  }

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage)
      if (stream) stream.getTracks().forEach(track => track.stop())
    }
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={onClose} className="w-full py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cerrar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 max-w-lg w-full">
        <h3 className="text-lg font-semibold mb-3">
          Capturar hoja de respuestas
          {isFrontCamera && <span className="ml-2 text-sm font-normal text-orange-600">🖥️ Cámara frontal</span>}
        </h3>
        
        {!showPreview ? (
          <>
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video ref={videoRef} autoPlay playsInline className="w-full h-auto"
                style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none' }} />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-white text-sm">Iniciando cámara...</div>
                </div>
              )}
            </div>
            
            <canvas ref={canvasRef} style={{ display: 'none' }} width="640" height="480" />
            
            {isFrontCamera ? (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700"><strong>🖥️ Cámara frontal detectada</strong></p>
                <p className="text-xs text-blue-600 mt-1">
                  La vista previa se muestra en espejo para tu comodidad, pero la foto se guardará 
                  con la orientación correcta para que la hoja sea legible.
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700"><strong>📱 Cámara trasera detectada</strong></p>
                <p className="text-xs text-green-600 mt-1">
                  La imagen se capturará tal como se ve en pantalla.
                </p>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mb-3">Estado: {cameraReady ? '✅ Cámara lista' : '⏳ Iniciando...'}</div>
            
            <div className="flex flex-col gap-2">
              <button onClick={capturePhoto} disabled={!cameraReady || capturing}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  !cameraReady || capturing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                {capturing ? '⏳ Capturando...' : '📸 Capturar foto'}
              </button>
              <button onClick={onClose} className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300">Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Vista previa {isFrontCamera && '(ya corregida, sin espejo)'}:</p>
              <img src={capturedImage!} alt="Vista previa" className="max-h-64 mx-auto rounded-lg border border-gray-200" />
              {isFrontCamera && <p className="text-xs text-green-600 mt-2 text-center">✅ La imagen está en orientación normal (legible)</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={confirmCapture} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">✓ Usar esta foto</button>
              <button onClick={() => { setCapturedImage(null); setShowPreview(false) }} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300">Volver a capturar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================
// PLANTILLA DE CORRECCIÓN (CARGA CONFIG DESDE SUPABASE)
// ============================================================

interface ScoringGridProps {
  imageData: string
  patientAge: number
  onScoreCalculated: (score: number, markedCells: boolean[]) => void
  onClose: () => void
}

function ScoringGrid({ imageData, patientAge, onScoreCalculated, onClose }: ScoringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null)
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(null)
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 })
  const [overlayScale, setOverlayScale] = useState({ x: 1, y: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [markedCells, setMarkedCells] = useState<boolean[]>([])
  const [showGrid, setShowGrid] = useState(true)

  const useTemplateA = patientAge <= 7
  const templatePath = useTemplateA ? '/wisc5/cla/plantilla-claves-a.png' : '/wisc5/cla/plantilla-claves-b.png'
  const COLS = useTemplateA ? 8 : 15
  const TOTAL_PAIRS = 4
  const TOTAL_SCORABLE = TOTAL_PAIRS * COLS

  const [rowPositions, setRowPositions] = useState<number[]>([0.15, 0.38, 0.62, 0.85])
  const [rowHeight, setRowHeight] = useState<number>(0.15)
  const [cellWidths, setCellWidths] = useState<number[]>(Array(COLS).fill(1/COLS))
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    const loadGridConfig = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await supabase.from('wisc5_cla_grid_config').select('*').eq('id', 1).single()
      
      if (data) {
        if (useTemplateA) {
          setRowPositions(data.template_a_row_positions as number[])
          setRowHeight(data.template_a_row_height as number)
          setCellWidths((data.template_a_cell_widths as number[]) || Array(8).fill(1/8))
        } else {
          setRowPositions(data.template_b_row_positions as number[])
          setRowHeight(data.template_b_row_height as number)
          setCellWidths((data.template_b_cell_widths as number[]) || Array(15).fill(1/15))
        }
      }
      setConfigLoaded(true)
    }
    loadGridConfig()
  }, [useTemplateA])

  useEffect(() => {
    setMarkedCells(new Array(TOTAL_SCORABLE).fill(false))
    const base = new Image()
    base.src = imageData
    base.onload = () => {
      setBaseImage(base)
      setOverlayPosition({ x: (base.width * 0.15), y: (base.height * 0.15) })
    }
    const overlay = new Image()
    overlay.src = templatePath
    overlay.onload = () => setOverlayImage(overlay)
  }, [imageData, templatePath])

  useEffect(() => {
    if (!baseImage || !overlayImage || !canvasRef.current || !configLoaded) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = baseImage.width
    canvas.height = baseImage.height
    ctx.drawImage(baseImage, 0, 0)
    
    ctx.save()
    ctx.translate(overlayPosition.x, overlayPosition.y)
    ctx.scale(overlayScale.x, overlayScale.y)
    ctx.globalAlpha = 0.85
    ctx.drawImage(overlayImage, 0, 0)
    ctx.globalAlpha = 1.0
    ctx.restore()
    
    if (showGrid && overlayImage) {
      const scaledWidth = overlayImage.width * overlayScale.x
      const scaledHeight = overlayImage.height * overlayScale.y
      
      let cellIndex = 0
      let xOffset = 0
      
      for (let pair = 0; pair < TOTAL_PAIRS; pair++) {
        xOffset = 0
        for (let col = 0; col < COLS; col++) {
          const w = cellWidths[col] * scaledWidth
          const x = overlayPosition.x + xOffset
          const y = overlayPosition.y + rowPositions[pair] * scaledHeight
          const h = rowHeight * scaledHeight
          xOffset += w
          
          if (markedCells[cellIndex]) {
            ctx.fillStyle = 'rgba(34, 197, 94, 0.35)'
            ctx.fillRect(x, y, w, h)
            ctx.strokeStyle = '#22C55E'
            ctx.lineWidth = 2.5
          } else {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'
            ctx.lineWidth = 2
          }
          ctx.strokeRect(x, y, w, h)
          
          if (markedCells[cellIndex]) {
            ctx.font = 'bold 12px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = '#16A34A'
            ctx.fillText('✓', x + w / 2, y + h / 2)
          }
          cellIndex++
        }
      }
    }
  }, [baseImage, overlayImage, overlayPosition, overlayScale, markedCells, showGrid, rowPositions, rowHeight, cellWidths, configLoaded])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !overlayImage) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY
    const scaledWidth = overlayImage.width * overlayScale.x
    const scaledHeight = overlayImage.height * overlayScale.y
    
    let cellIndex = 0
    let xOffset = 0
    
    for (let pair = 0; pair < TOTAL_PAIRS; pair++) {
      xOffset = 0
      for (let col = 0; col < COLS; col++) {
        const w = cellWidths[col] * scaledWidth
        const cellX = overlayPosition.x + xOffset
        const cellY = overlayPosition.y + rowPositions[pair] * scaledHeight
        const cellH = rowHeight * scaledHeight
        xOffset += w
        
        if (canvasX >= cellX && canvasX <= cellX + w && canvasY >= cellY && canvasY <= cellY + cellH) {
          const newMarkedCells = [...markedCells]
          newMarkedCells[cellIndex] = !newMarkedCells[cellIndex]
          setMarkedCells(newMarkedCells)
          return
        }
        cellIndex++
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.shiftKey) { setIsDragging(true); setDragStart({ x: e.clientX - overlayPosition.x, y: e.clientY - overlayPosition.y }) }
  }
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) setOverlayPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  const handleMouseUp = () => setIsDragging(false)

  const calculateScore = () => { onScoreCalculated(markedCells.filter(m => m).length, markedCells) }
  const toggleAll = () => setMarkedCells(new Array(markedCells.length).fill(!markedCells.every(m => m)))
  const clearAll = () => setMarkedCells(new Array(markedCells.length).fill(false))
  const markedCount = markedCells.filter(m => m).length

  if (!configLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Cargando configuración de rejilla...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 max-w-6xl w-full max-h-screen overflow-auto">
        <h3 className="text-lg font-semibold mb-3">Plantilla de corrección - Claves {useTemplateA ? 'A' : 'B'} <span className="text-sm text-gray-500 ml-2">({useTemplateA ? '6-7' : '8-16'} años)</span></h3>
        
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <p className="text-xs text-blue-700"><strong>Instrucciones:</strong> Haz clic en cada ventana azul para marcarla ✓.<br /><strong>Shift + Arrastrar</strong> para mover la plantilla. Ajusta el zoom para alinear.</p>
        </div>
        
        <div className="overflow-auto border border-gray-200 rounded-lg mb-3 bg-gray-100" style={{ maxHeight: '55vh' }}>
          <canvas ref={canvasRef} onClick={handleCanvasClick} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="cursor-crosshair" style={{ width: '100%', height: 'auto' }} />
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-600 block mb-1">Zoom X: {overlayScale.x.toFixed(2)}</label><input type="range" min="0.3" max="3.0" step="0.01" value={overlayScale.x} onChange={(e) => setOverlayScale({ ...overlayScale, x: parseFloat(e.target.value) })} className="w-full" /></div>
            <div><label className="text-xs text-gray-600 block mb-1">Zoom Y: {overlayScale.y.toFixed(2)}</label><input type="range" min="0.3" max="3.0" step="0.01" value={overlayScale.y} onChange={(e) => setOverlayScale({ ...overlayScale, y: parseFloat(e.target.value) })} className="w-full" /></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setOverlayScale({ x: 1, y: 1 })} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">↻ Reset Zoom</button>
            <button onClick={() => setOverlayPosition({ x: 50, y: 50 })} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">↻ Reset Posición</button>
            <button onClick={() => setShowGrid(!showGrid)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">{showGrid ? '👁 Ocultar rejilla' : '👁 Mostrar rejilla'}</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={toggleAll} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">{markedCells.every(m => m) ? '◻ Desmarcar todas' : '☑ Marcar todas'}</button>
            <button onClick={clearAll} className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100">✕ Limpiar todas</button>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex justify-between items-center"><p className="text-sm"><strong>Progreso:</strong> {markedCount} de {TOTAL_SCORABLE} ventanas</p><p className="text-lg font-bold text-blue-700">Puntaje: {markedCount}</p></div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${(markedCount / TOTAL_SCORABLE) * 100}%` }} /></div>
          </div>
          <div className="flex gap-3">
            <button onClick={calculateScore} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Aplicar puntaje ({markedCount})</button>
            <button onClick={onClose} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL CLAVES (CLA)
// ============================================================

interface CLAInterfaceProps {
  onComplete: (scores: Record<string, number>, rawTotal: number) => void
  onUpdatePatient: (content: any) => void
  patientAge: number
}

export const CLAInterface = React.memo(function CLAInterface({ onComplete, onUpdatePatient, patientAge }: CLAInterfaceProps) {
  const [rawScore, setRawScore] = useState<string>('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [timeEnded, setTimeEnded] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [manualCount, setManualCount] = useState<string>('')
  const [showScoringGrid, setShowScoringGrid] = useState(false)
  const [reviewLater, setReviewLater] = useState(false)

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => { onCompleteRef.current = onComplete; onUpdatePatientRef.current = onUpdatePatient }, [onComplete, onUpdatePatient])

  useEffect(() => {
    onUpdatePatientRef.current({
      type: 'wisc5_cla',
      instruction: 'Copia los símbolos en las casillas correspondientes. Trabaja lo más rápido que puedas. Tienes 2 minutos.',
      isRunning, timeRemaining: isRunning ? 120 - elapsedTime : 120
    })
  }, [isRunning, elapsedTime])

  const handleTimeUpdate = useCallback((seconds: number) => setElapsedTime(seconds), [])
  const handleTimeEnd = useCallback(() => { setTimeEnded(true); setIsRunning(false) }, [])
  const toggleRunning = useCallback(() => setIsRunning(prev => !prev), [])

  const handleCapture = (imageData: string) => { setCapturedImage(imageData); setShowCamera(false) }

  const flipImageHorizontally = () => {
    if (!capturedImage) return
    const img = new Image(); img.src = capturedImage
    img.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0) }
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.85))
    }
  }

  const handleScoreCalculated = (score: number) => { setRawScore(score.toString()); setShowScoringGrid(false) }

  const handleComplete = () => {
    const score = parseInt(rawScore, 10)
    if (isNaN(score) || score < 0) { alert('Por favor, ingresa un puntaje válido'); return }
    const maxScore = patientAge <= 7 ? 64 : 120
    if (score > maxScore) { alert(`El puntaje máximo es ${maxScore}`); return }
    setIsCompleted(true)
    onCompleteRef.current({ CLA: score }, score)
  }

  const handleReviewLater = () => {
    setReviewLater(true)
    setIsCompleted(true)
    onCompleteRef.current({ CLA: -1 }, -1)
  }

  const applyManualCount = () => {
    const count = parseInt(manualCount, 10)
    if (!isNaN(count) && count >= 0) setRawScore(count.toString())
  }

  if (isCompleted) {
    const isPending = reviewLater || rawScore === '' || parseInt(rawScore) === -1
    return (
      <div className={`rounded-lg p-4 text-center ${isPending ? 'bg-orange-50' : 'bg-green-50'}`}>
        <p className={`font-medium ${isPending ? 'text-orange-700' : 'text-green-700'}`}>
          {isPending ? '⏳ Pendiente de revisión' : 'Subprueba completada'}
        </p>
        {!isPending && <p className="text-sm text-green-600 mt-1">Puntaje total: {rawScore} / {patientAge <= 7 ? 64 : 120}</p>}
        {isPending && <p className="text-sm text-orange-600 mt-1">Podrás completar la revisión desde el panel de WISC-V</p>}
        {capturedImage && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Foto de respaldo guardada</p>
            <img src={capturedImage} alt="Hoja" className="mx-auto max-h-32 rounded border" />
          </div>
        )}
      </div>
    )
  }

  const maxScore = patientAge <= 7 ? 64 : 120

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Claves {patientAge <= 7 ? 'A' : 'B'}</span>
          <span className="text-gray-800 font-medium">Tiempo límite: 2 minutos</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(elapsedTime / 120) * 100}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">El paciente debe copiar los símbolos en las casillas correspondientes</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Stopwatch timeLimit={120} onTimeUpdate={handleTimeUpdate} onTimeEnd={handleTimeEnd} isRunning={isRunning} onToggleRunning={toggleRunning} />
      </div>

      {timeEnded && (
        <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
          <p className="text-yellow-700 text-sm">⏰ ¡Tiempo finalizado! Ingresa el puntaje obtenido.</p>
        </div>
      )}

      {/* Ingreso de puntaje */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Puntaje bruto total (símbolos correctos)</label>
        <div className="flex gap-3">
          <input type="number" value={rawScore} onChange={(e) => setRawScore(e.target.value)} min="0" max={maxScore} placeholder={`0-${maxScore}`}
            className="flex-1 px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={reviewLater} />
          <button onClick={handleComplete} disabled={!rawScore || reviewLater}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${rawScore && !reviewLater ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
            Completar
          </button>
        </div>
        
        {/* Opción revisar después */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          {!reviewLater ? (
            <button onClick={handleReviewLater}
              className="w-full py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium border border-orange-200">
              ⏳ Dejar para revisar después
            </button>
          ) : (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">⏳ Pendiente de revisión</p>
                  <p className="text-xs text-orange-600 mt-1">Podrás completar esta evaluación desde el panel de WISC-V</p>
                </div>
                <button onClick={() => setReviewLater(false)}
                  className="px-3 py-1.5 bg-white text-orange-700 rounded-lg text-xs hover:bg-orange-50 border border-orange-300">
                  Revisar ahora
                </button>
              </div>
            </div>
          )}
        </div>
        
        {!timeEnded && !reviewLater && <p className="text-xs text-gray-400 mt-2">Debes esperar a que termine el tiempo para completar</p>}
      </div>

      {/* Verificación por foto */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">📸 Verificación por foto (opcional)</p>
        {!capturedImage ? (
          <button onClick={() => setShowCamera(true)} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">📷 Capturar foto de la hoja</button>
        ) : (
          <div>
            <div className="mb-3"><img src={capturedImage} alt="Hoja" className="max-h-48 mx-auto rounded-lg border border-gray-200" /></div>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setShowCamera(true)} className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs">Volver a capturar</button>
              <button onClick={() => setCapturedImage(null)} className="flex-1 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs">Eliminar</button>
            </div>
            <button onClick={flipImageHorizontally} className="w-full py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 text-xs mb-2">🔄 Invertir horizontalmente</button>
            <button onClick={() => setShowScoringGrid(true)} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">🔲 Usar plantilla de corrección</button>
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">O ingresa el conteo manualmente:</p>
              <div className="flex gap-2">
                <input type="number" value={manualCount} onChange={(e) => setManualCount(e.target.value)} min="0" max={maxScore} placeholder="Cantidad" className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded" />
                <button onClick={applyManualCount} className="px-4 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">Aplicar</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCamera && <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />}
      {showScoringGrid && capturedImage && <ScoringGrid imageData={capturedImage} patientAge={patientAge} onScoreCalculated={handleScoreCalculated} onClose={() => setShowScoringGrid(false)} />}

      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          <strong>Instrucciones:</strong> Entrega la hoja de respuestas al paciente. 
          Di: &quot;Copia los símbolos en las casillas. Trabaja lo más rápido que puedas. Tienes 2 minutos.&quot;
        </p>
      </div>
    </div>
  )
})