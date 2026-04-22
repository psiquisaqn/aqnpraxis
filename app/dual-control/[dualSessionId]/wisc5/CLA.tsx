'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

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
        <div className={`text-4xl font-mono font-bold mb-2 ${isTimeCritical ? 'text-red-600' : 'text-gray-800'}`}>
          {formatTime(0)}
        </div>
        <button 
          onClick={startTimer} 
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-medium"
        >
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
        <div 
          className={`h-full transition-all duration-1000 ${isTimeCritical ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${getProgressPercent()}%` }} 
        />
      </div>
      <div className="flex gap-2 justify-center">
        {isRunning ? (
          <button 
            onClick={onToggleRunning} 
            className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
          >
            Pausar
          </button>
        ) : (
          <button 
            onClick={onToggleRunning} 
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Reanudar
          </button>
        )}
        <button 
          onClick={() => { setSeconds(0); onTimeUpdate(0) }} 
          className="px-4 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
        >
          Reiniciar
        </button>
      </div>
      <div className="text-xs text-gray-400 mt-2">
        {seconds >= timeLimit ? '⏰ ¡Tiempo finalizado!' : `Restan ${formatTime(timeLimit - seconds)}`}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE DE CÁMARA - CORREGIDO (CANVAS SIEMPRE EN DOM)
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
  const [mirrorPreview, setMirrorPreview] = useState(true)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    const initCamera = async () => {
      try {
        console.log('📷 Iniciando cámara...')
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Tu navegador no soporta acceso a la cámara')
        }

        let mediaStream: MediaStream
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          })
          setIsFrontCamera(false)
          console.log('✅ Cámara trasera iniciada')
        } catch (backErr) {
          console.log('⚠️ Cámara trasera no disponible, usando frontal')
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'user',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          })
          setIsFrontCamera(true)
          console.log('✅ Cámara frontal iniciada')
        }
        
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true)
            console.log('✅ Video listo para capturar')
            console.log('canvasRef.current:', canvasRef.current)
          }
        }
      } catch (err: any) {
        console.error('❌ Error accediendo a la cámara:', err)
        setError(`No se pudo acceder a la cámara: ${err.message}`)
      }
    }

    initCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const capturePhoto = (applyMirror: boolean) => {
    console.log('📸 Intentando capturar foto... applyMirror:', applyMirror)
    console.log('videoRef.current:', videoRef.current)
    console.log('canvasRef.current:', canvasRef.current)
    console.log('cameraReady:', cameraReady)
    
    setCapturing(true)
    
    // Pequeño delay para asegurar que el DOM está listo
    setTimeout(() => {
      try {
        if (!videoRef.current) {
          throw new Error('Video no disponible')
        }
        if (!canvasRef.current) {
          throw new Error('Canvas no disponible - intenta de nuevo')
        }
        
        const video = videoRef.current
        const canvas = canvasRef.current
        
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          throw new Error('El video no tiene dimensiones válidas. Espera un momento.')
        }
        
        console.log(`Video dimensiones: ${video.videoWidth}x${video.videoHeight}`)
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        const context = canvas.getContext('2d')
        if (!context) {
          throw new Error('No se pudo obtener contexto del canvas')
        }
        
        if (applyMirror) {
          context.translate(canvas.width, 0)
          context.scale(-1, 1)
        }
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        if (applyMirror) {
          context.setTransform(1, 0, 0, 1, 0, 0)
        }
        
        const imageData = canvas.toDataURL('image/jpeg', 0.85)
        console.log('✅ Foto capturada, tamaño:', Math.round(imageData.length / 1024), 'KB')
        
        setCapturedImage(imageData)
        setShowPreview(true)
        setCapturing(false)
        
      } catch (err: any) {
        console.error('❌ Error al capturar foto:', err)
        setError(`Error al capturar: ${err.message}`)
        setCapturing(false)
      }
    }, 100)
  }

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage)
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setShowPreview(false)
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={onClose} 
            className="w-full py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 max-w-lg w-full">
        <h3 className="text-lg font-semibold mb-3">Capturar hoja de respuestas</h3>
        
        {!showPreview ? (
          <>
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-auto"
                style={{ 
                  transform: mirrorPreview && isFrontCamera ? 'scaleX(-1)' : 'none' 
                }}
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-white text-sm">Iniciando cámara...</div>
                </div>
              )}
            </div>
            
            {/* CANVAS SIEMPRE PRESENTE EN EL DOM (oculto con CSS) */}
            <canvas 
              ref={canvasRef} 
              style={{ display: 'none' }}
              width="640"
              height="480"
            />
            
            {isFrontCamera && (
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mirrorPreview"
                  checked={mirrorPreview}
                  onChange={(e) => setMirrorPreview(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="mirrorPreview" className="text-sm text-gray-600">
                  Vista previa en espejo
                </label>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mb-3">
              Estado: {cameraReady ? '✅ Cámara lista' : '⏳ Iniciando...'}
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex gap-3">
                <button
                  onClick={() => capturePhoto(false)}
                  disabled={!cameraReady || capturing}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    !cameraReady || capturing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {capturing ? 'Capturando...' : '📸 Capturar (orientación normal)'}
                </button>
                {isFrontCamera && (
                  <button
                    onClick={() => capturePhoto(true)}
                    disabled={!cameraReady || capturing}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      !cameraReady || capturing
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    🔄 Capturar con espejo
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              {isFrontCamera 
                ? 'Cámara frontal. Si el texto se ve al revés, usa "Capturar (orientación normal)".'
                : 'Asegúrate de que la hoja esté bien iluminada y enfocada.'}
            </p>
          </>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Vista previa de la foto:</p>
              <img 
                src={capturedImage!} 
                alt="Vista previa" 
                className="max-h-64 mx-auto rounded-lg border border-gray-200"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmCapture}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                ✓ Usar esta foto
              </button>
              <button
                onClick={retakePhoto}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Volver a capturar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE DE PLANTILLA DE CORRECCIÓN (REJILLA INTERACTIVA)
// ============================================================

interface ScoringGridProps {
  imageData: string
  onScoreCalculated: (score: number, markedCells: boolean[]) => void
  onClose: () => void
}

function ScoringGrid({ imageData, onScoreCalculated, onClose }: ScoringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [gridPosition, setGridPosition] = useState({ x: 50, y: 50 })
  const [markedCells, setMarkedCells] = useState<boolean[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [cellSize, setCellSize] = useState({ width: 30, height: 35 })

  // Configuración de la rejilla - Valores típicos para Claves
  const COLS = 15
  const ROWS = 8

  // Cargar imagen
  useEffect(() => {
    const img = new Image()
    img.src = imageData
    img.onload = () => {
      setImage(img)
      setMarkedCells(new Array(COLS * ROWS).fill(false))
    }
  }, [imageData])

  // Dibujar canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = image.width
    canvas.height = image.height
    
    // Dibujar imagen
    ctx.drawImage(image, 0, 0)
    
    // Calcular tamaño de celda basado en escala
    const baseCellWidth = cellSize.width
    const baseCellHeight = cellSize.height
    const scaledCellWidth = baseCellWidth * scale
    const scaledCellHeight = baseCellHeight * scale
    
    // Dibujar rejilla
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = gridPosition.x + col * scaledCellWidth
        const y = gridPosition.y + row * scaledCellHeight
        const index = row * COLS + col
        
        // Dibujar celda
        if (markedCells[index]) {
          // Celda marcada como correcta - fondo verde semitransparente
          ctx.fillStyle = 'rgba(34, 197, 94, 0.35)'
          ctx.fillRect(x, y, scaledCellWidth, scaledCellHeight)
          ctx.strokeStyle = '#22C55E'
          ctx.lineWidth = 2.5
        } else {
          // Celda no marcada - solo borde
          ctx.strokeStyle = '#3B82F6'
          ctx.lineWidth = 2
        }
        ctx.strokeRect(x, y, scaledCellWidth, scaledCellHeight)
      }
    }
    
    // Dibujar números de fila/columna
    ctx.font = 'bold 12px Arial'
    ctx.fillStyle = '#374151'
    ctx.shadowColor = 'white'
    ctx.shadowBlur = 4
    for (let col = 0; col < COLS; col++) {
      ctx.fillText(
        (col + 1).toString(), 
        gridPosition.x + col * scaledCellWidth + 5, 
        gridPosition.y - 8
      )
    }
    for (let row = 0; row < ROWS; row++) {
      ctx.fillText(
        (row + 1).toString(), 
        gridPosition.x - 25, 
        gridPosition.y + row * scaledCellHeight + 20
      )
    }
    ctx.shadowBlur = 0
  }, [image, gridPosition, scale, markedCells, cellSize])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY
    
    const scaledCellWidth = cellSize.width * scale
    const scaledCellHeight = cellSize.height * scale
    
    // Encontrar celda clickeada
    const col = Math.floor((canvasX - gridPosition.x) / scaledCellWidth)
    const row = Math.floor((canvasY - gridPosition.y) / scaledCellHeight)
    
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      const index = row * COLS + col
      const newMarkedCells = [...markedCells]
      newMarkedCells[index] = !newMarkedCells[index]
      setMarkedCells(newMarkedCells)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.shiftKey) {
      setIsDragging(true)
      setDragStart({ 
        x: e.clientX - gridPosition.x, 
        y: e.clientY - gridPosition.y 
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setGridPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const calculateScore = () => {
    const score = markedCells.filter(marked => marked).length
    onScoreCalculated(score, markedCells)
  }

  const toggleAll = () => {
    const allMarked = markedCells.every(m => m)
    setMarkedCells(new Array(COLS * ROWS).fill(!allMarked))
  }

  const clearAll = () => {
    setMarkedCells(new Array(COLS * ROWS).fill(false))
  }

  const markedCount = markedCells.filter(m => m).length
  const maxScore = COLS * ROWS

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 max-w-6xl w-full max-h-screen overflow-auto">
        <h3 className="text-lg font-semibold mb-3">Plantilla de corrección - Claves</h3>
        
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <p className="text-xs text-blue-700">
            <strong>Instrucciones:</strong> Haz clic en cada casilla para marcarla como correcta (verde).<br />
            <strong>Shift + Arrastrar</strong> para mover la rejilla. Usa los controles para ajustar el tamaño.
          </p>
        </div>
        
        {/* Canvas para la imagen con rejilla */}
        <div className="overflow-auto border border-gray-200 rounded-lg mb-3 bg-gray-100" style={{ maxHeight: '55vh' }}>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
        
        {/* Controles */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Zoom: {scale.toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Ancho celda: {cellSize.width}px</label>
              <input
                type="range"
                min="15"
                max="60"
                step="1"
                value={cellSize.width}
                onChange={(e) => setCellSize({ ...cellSize, width: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Alto celda: {cellSize.height}px</label>
            <input
              type="range"
              min="15"
              max="60"
              step="1"
              value={cellSize.height}
              onChange={(e) => setCellSize({ ...cellSize, height: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setGridPosition({ x: 50, y: 50 })}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              ↻ Reiniciar posición
            </button>
            <button
              onClick={toggleAll}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              {markedCells.every(m => m) ? '◻ Desmarcar todas' : '☑ Marcar todas'}
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100"
            >
              ✕ Limpiar todas
            </button>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <p className="text-sm">
                <strong>Progreso:</strong> {markedCount} de {maxScore} casillas
              </p>
              <p className="text-lg font-bold text-blue-700">
                Puntaje: {markedCount}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${(markedCount / maxScore) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={calculateScore}
              className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Aplicar puntaje ({markedCount})
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
            >
              Cancelar
            </button>
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

  const onCompleteRef = useRef(onComplete)
  const onUpdatePatientRef = useRef(onUpdatePatient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onUpdatePatientRef.current = onUpdatePatient
  }, [onComplete, onUpdatePatient])

  // Enviar instrucción al display
  useEffect(() => {
    onUpdatePatientRef.current({
      type: 'wisc5_cla',
      instruction: 'Copia los símbolos en las casillas correspondientes. Trabaja lo más rápido que puedas. Tienes 2 minutos.',
      isRunning,
      timeRemaining: isRunning ? 120 - elapsedTime : 120
    })
  }, [isRunning, elapsedTime])

  const handleTimeUpdate = useCallback((seconds: number) => {
    setElapsedTime(seconds)
  }, [])

  const handleTimeEnd = useCallback(() => {
    setTimeEnded(true)
    setIsRunning(false)
  }, [])

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => !prev)
  }, [])

  const handleCapture = (imageData: string) => {
    console.log('📸 Imagen capturada y guardada')
    setCapturedImage(imageData)
    setShowCamera(false)
  }

  const flipImageHorizontally = () => {
    if (!capturedImage) return
    
    const img = new Image()
    img.src = capturedImage
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(img, 0, 0)
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.85))
        console.log('🔄 Imagen invertida horizontalmente')
      }
    }
  }

  const handleScoreCalculated = (score: number, markedCells: boolean[]) => {
    setRawScore(score.toString())
    setShowScoringGrid(false)
    console.log('✅ Puntaje calculado con plantilla:', score, 'casillas marcadas:', markedCells.filter(m => m).length)
  }

  const handleComplete = () => {
    const score = parseInt(rawScore, 10)
    if (isNaN(score) || score < 0) {
      alert('Por favor, ingresa un puntaje válido')
      return
    }

    const maxScore = 120
    if (score > maxScore) {
      alert(`El puntaje máximo es ${maxScore}`)
      return
    }

    const scores = { CLA: score }
    setIsCompleted(true)
    onCompleteRef.current(scores, score)
  }

  const applyManualCount = () => {
    const count = parseInt(manualCount, 10)
    if (!isNaN(count) && count >= 0) {
      setRawScore(count.toString())
    }
  }

  if (isCompleted) {
    return (
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">Subprueba completada</p>
        <p className="text-sm text-green-600 mt-1">
          Puntaje total: {rawScore} / 120
        </p>
        {capturedImage && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Foto de respaldo guardada</p>
            <img src={capturedImage} alt="Hoja de respuestas" className="mx-auto max-h-32 rounded border" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de progreso e instrucciones */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Claves</span>
          <span className="text-gray-800 font-medium">Tiempo límite: 2 minutos</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all" 
            style={{ width: `${(elapsedTime / 120) * 100}%` }} 
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          El paciente debe copiar los símbolos en las casillas correspondientes
        </p>
      </div>

      {/* Cronómetro */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Stopwatch
          timeLimit={120}
          onTimeUpdate={handleTimeUpdate}
          onTimeEnd={handleTimeEnd}
          isRunning={isRunning}
          onToggleRunning={toggleRunning}
        />
      </div>

      {/* Aviso de tiempo finalizado */}
      {timeEnded && (
        <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
          <p className="text-yellow-700 text-sm">⏰ ¡Tiempo finalizado! Ingresa el puntaje obtenido.</p>
        </div>
      )}

      {/* Ingreso de puntaje bruto */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Puntaje bruto total (símbolos correctos)
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            value={rawScore}
            onChange={(e) => setRawScore(e.target.value)}
            min="0"
            max="120"
            placeholder="0-120"
            className="flex-1 px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleComplete}
            disabled={!rawScore || !timeEnded}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              rawScore && timeEnded
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Completar
          </button>
        </div>
        {!timeEnded && (
          <p className="text-xs text-gray-400 mt-2">
            Debes esperar a que termine el tiempo (o pausar el cronómetro) para completar
          </p>
        )}
      </div>

      {/* Verificación por foto (opcional) */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">
          📸 Verificación por foto (opcional)
        </p>
        
        {!capturedImage ? (
          <button
            onClick={() => setShowCamera(true)}
            className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            📷 Capturar foto de la hoja de respuestas
          </button>
        ) : (
          <div>
            <div className="mb-3">
              <img 
                src={capturedImage} 
                alt="Hoja capturada" 
                className="max-h-48 mx-auto rounded-lg border border-gray-200"
              />
            </div>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setShowCamera(true)}
                className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs"
              >
                Volver a capturar
              </button>
              <button
                onClick={() => setCapturedImage(null)}
                className="flex-1 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs"
              >
                Eliminar
              </button>
            </div>
            <button
              onClick={flipImageHorizontally}
              className="w-full py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 text-xs mb-2"
            >
              🔄 Invertir horizontalmente (corregir espejo)
            </button>
            <button
              onClick={() => setShowScoringGrid(true)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              🔲 Usar plantilla de corrección
            </button>
            
            {/* Ayuda para conteo manual desde la foto */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">O ingresa el conteo manualmente:</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={manualCount}
                  onChange={(e) => setManualCount(e.target.value)}
                  min="0"
                  max="120"
                  placeholder="Cantidad"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded"
                />
                <button
                  onClick={applyManualCount}
                  className="px-4 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de cámara */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Modal de plantilla de corrección */}
      {showScoringGrid && capturedImage && (
        <ScoringGrid
          imageData={capturedImage}
          onScoreCalculated={handleScoreCalculated}
          onClose={() => setShowScoringGrid(false)}
        />
      )}

      {/* Instrucciones para el evaluador */}
      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          <strong>Instrucciones para el evaluador:</strong> Entrega la hoja de respuestas al paciente. 
          Di: &quot;Copia los símbolos en las casillas correspondientes. Trabaja lo más rápido que puedas. 
          Tienes 2 minutos. Comienza ahora.&quot;
        </p>
      </div>
    </div>
  )
})