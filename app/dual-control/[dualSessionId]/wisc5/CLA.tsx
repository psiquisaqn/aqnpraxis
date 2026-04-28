'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const PLANTILLA_CONFIG = {
  A: { cols: 10, pairs: 8, firstPairCols: 5, maxScore: 75 },
  B: { cols: 18, pairs: 7, firstPairCols: 9, maxScore: 117 }
}

// ============================================================
// CRONÓMETRO
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
          if (newSeconds >= timeLimit) { onToggleRunning(); onTimeEnd(); return timeLimit }
          return newSeconds
        })
      }, 1000)
    } else if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, timeLimit, onTimeUpdate, onTimeEnd, onToggleRunning])

  const startTimer = () => { setSeconds(0); onToggleRunning(); onStart?.() }
  const formatTime = (t: number) => `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`
  const pct = Math.min((seconds / timeLimit) * 100, 100)
  const critical = seconds >= timeLimit - 10

  if (!isRunning && seconds === 0) {
    return (
      <div className="text-center">
        <div className="text-4xl font-mono font-bold mb-2 text-gray-800">{formatTime(0)}</div>
        <button onClick={startTimer} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-medium">Iniciar prueba (120 segundos)</button>
        <div className="text-xs text-gray-400 mt-2">Tiempo limite: 2 minutos</div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className={`text-5xl font-mono font-bold mb-2 transition-colors ${critical ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>{formatTime(seconds)}</div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2"><div className={`h-full transition-all duration-1000 ${critical ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} /></div>
      <div className="flex gap-2 justify-center">
        {isRunning ? <button onClick={onToggleRunning} className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm">Pausar</button> : <button onClick={onToggleRunning} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Reanudar</button>}
        <button onClick={() => { setSeconds(0); onTimeUpdate(0) }} className="px-4 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm">Reiniciar</button>
      </div>
      <div className="text-xs text-gray-400 mt-2">{seconds >= timeLimit ? 'Tiempo finalizado' : `Restan ${formatTime(timeLimit - seconds)}`}</div>
    </div>
  )
}

// ============================================================
// MODAL ESCANEO
// ============================================================
function ScanModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Escanear hoja de respuestas</h3>
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <ol className="text-xs text-blue-600 space-y-2 list-decimal list-inside">
            <li>Usa el software de tu escaner para escanear la hoja</li>
            <li>Guarda la imagen como JPG o PNG en tu equipo</li>
            <li>Luego usa la opcion Subir desde el equipo para cargarla</li>
          </ol>
        </div>
        <button onClick={onClose} className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300">Entendido</button>
      </div>
    </div>
  )
}

// ============================================================
// CÁMARA (con detección correcta)
// ============================================================
interface CameraCaptureProps { onCapture: (data: string) => void; onClose: () => void }

function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isFront, setIsFront] = useState(false)
  const [label, setLabel] = useState('')
  const [img, setImg] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const [ready, setReady] = useState(false)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        let ms: MediaStream
        try { ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } }) }
        catch { ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } } }) }
        const devices = await navigator.mediaDevices.enumerateDevices()
        const vdevs = devices.filter(d => d.kind === 'videoinput')
        const track = ms.getVideoTracks()[0]
        const dev = vdevs.find(d => d.deviceId === track.getSettings().deviceId)
        const lab = (dev?.label || track.label || '').toLowerCase()
        console.log('📷 Camara detectada:', { label: dev?.label || track.label, isFront: lab.includes('front') || lab.includes('user') })
        setIsFront(lab.includes('front') || lab.includes('user'))
        setLabel(dev?.label || track.label || 'Camara')
        setStream(ms)
        if (videoRef.current) { videoRef.current.srcObject = ms; videoRef.current.onloadedmetadata = () => setReady(true) }
      } catch (e: any) { setError(e.message) }
    })()
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()) }
  }, [])

  const capture = () => {
    setCapturing(true)
    setTimeout(() => {
      try {
        const v = videoRef.current; const c = canvasRef.current
        if (!v || !c) throw new Error('Refs no disponibles')
        c.width = v.videoWidth; c.height = v.videoHeight
        const ctx = c.getContext('2d')
        if (!ctx) throw new Error('Sin contexto')
        if (isFront) { ctx.translate(c.width, 0); ctx.scale(-1, 1) }
        ctx.drawImage(v, 0, 0)
        if (isFront) ctx.setTransform(1, 0, 0, 1, 0, 0)
        setImg(c.toDataURL('image/jpeg', 0.85))
        setPreview(true)
        setCapturing(false)
      } catch (e: any) { setError(e.message); setCapturing(false) }
    }, 100)
  }

  if (error) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl p-6 max-w-md w-full"><p className="text-red-600 mb-4">{error}</p><button onClick={onClose} className="w-full py-2 bg-gray-200 rounded-lg">Cerrar</button></div></div>

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 max-w-lg w-full">
        <h3 className="text-lg font-semibold mb-3">Capturar hoja ({label}) {isFront ? 'Frontal' : 'Trasera'}</h3>
        {!preview ? (
          <>
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video ref={videoRef} autoPlay playsInline className="w-full h-auto" style={{ transform: isFront ? 'scaleX(-1)' : 'none' }} />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} width="640" height="480" />
            <div className="text-xs text-gray-500 mb-3">{ready ? 'Lista' : 'Iniciando...'}</div>
            <button onClick={capture} disabled={!ready || capturing} className={`w-full py-3 rounded-lg font-medium ${!ready||capturing ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{capturing ? 'Capturando...' : 'Capturar foto'}</button>
            <button onClick={onClose} className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-medium mt-2">Cancelar</button>
          </>
        ) : (
          <>
            <img src={img!} alt="Preview" className="max-h-64 mx-auto rounded-lg border mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { onCapture(img!); if (stream) stream.getTracks().forEach(t => t.stop()) }} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium">Usar esta foto</button>
              <button onClick={() => { setImg(null); setPreview(false) }} className="flex-1 py-3 bg-gray-200 rounded-lg">Volver</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================
// PLANTILLA DE CORRECCIÓN (CON LOGS)
// ============================================================
interface ScoringGridProps { imageData: string; patientAge: number; onScoreCalculated: (s: number, m: boolean[]) => void; onClose: () => void }

function ScoringGrid({ imageData, patientAge, onScoreCalculated, onClose }: ScoringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [base, setBase] = useState<HTMLImageElement | null>(null)
  const [overlay, setOverlay] = useState<HTMLImageElement | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState({ x: 1, y: 1 })
  const [drag, setDrag] = useState(false)
  const [start, setStart] = useState({ x: 0, y: 0 })
  const [marks, setMarks] = useState<boolean[]>([])
  const [show, setShow] = useState(true)

  const isA = patientAge <= 7
  const tpl = isA ? '/wisc5/cla/plantilla-claves-a.png' : '/wisc5/cla/plantilla-claves-b.png'
  const CFG = isA ? PLANTILLA_CONFIG.A : PLANTILLA_CONFIG.B
  const PAIRS = CFG.pairs; const COLS = CFG.cols
  const total = CFG.firstPairCols + (PAIRS - 1) * COLS

  const colsFor = (p: number) => p === 0 ? CFG.firstPairCols : COLS
  const offFor = (p: number) => p === 0 ? COLS - CFG.firstPairCols : 0

  const [rows, setRows] = useState<number[]>(Array(PAIRS).fill(0.1).map((_,i) => 0.06 + i * 0.12))
  const [rh, setRh] = useState(0.10)
  const [cws, setCws] = useState<number[]>(Array(COLS).fill(1/COLS))
  const [loaded, setLoaded] = useState(false)

  // Cargar configuración desde Supabase CON LOGS
  useEffect(() => {
    console.log(`📥 [SCORING GRID] Cargando configuración para plantilla ${isA ? 'A' : 'B'}...`)
    
    const loadGridConfig = async () => {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      
      console.log('🔍 Consultando wisc5_cla_grid_config...')
      const { data, error } = await sb.from('wisc5_cla_grid_config').select('*').eq('id', 1).single()
      
      console.log('📦 Respuesta de Supabase:', { data, error })
      
      if (error) {
        console.error('❌ Error al cargar configuración:', error)
      }
      
      if (data) {
        console.log('✅ Datos recibidos correctamente')
        console.log('  - template_a_row_positions:', data.template_a_row_positions)
        console.log('  - template_a_cell_widths:', data.template_a_cell_widths)
        console.log('  - template_b_row_positions:', data.template_b_row_positions)
        console.log('  - template_b_cell_widths:', data.template_b_cell_widths)
        
        if (isA) {
          const newRows = (data.template_a_row_positions as number[]) || rows
          const newRh = data.template_a_row_height || 0.10
          const newCws = (data.template_a_cell_widths as number[]) || cws
          console.log('🅰️ Aplicando Plantilla A:', { rows: newRows.length, rh: newRh, cws: newCws.length })
          setRows(newRows)
          setRh(newRh)
          setCws(newCws)
        } else {
          const newRows = (data.template_b_row_positions as number[]) || rows
          const newRh = data.template_b_row_height || 0.10
          const newCws = (data.template_b_cell_widths as number[]) || cws
          console.log('🅱️ Aplicando Plantilla B:', { rows: newRows.length, rh: newRh, cws: newCws.length })
          setRows(newRows)
          setRh(newRh)
          setCws(newCws)
        }
      } else {
        console.warn('⚠️ No se encontró configuración en Supabase, usando valores por defecto')
      }
      setLoaded(true)
    }
    
    loadGridConfig()
  }, [isA])

  useEffect(() => {
    setMarks(new Array(total).fill(false))
    const b = new Image(); b.src = imageData; b.onload = () => { setBase(b); setPos({ x: b.width * 0.1, y: b.height * 0.1 }) }
    const o = new Image(); o.src = tpl; o.onload = () => setOverlay(o)
  }, [imageData, tpl])

  useEffect(() => {
    if (!base || !overlay || !canvasRef.current || !loaded) return
    const c = canvasRef.current; const ctx = c.getContext('2d')
    if (!ctx) return
    c.width = base.width; c.height = base.height
    ctx.drawImage(base, 0, 0)
    ctx.save(); ctx.translate(pos.x, pos.y); ctx.scale(scale.x, scale.y); ctx.globalAlpha = 0.85; ctx.drawImage(overlay, 0, 0); ctx.globalAlpha = 1; ctx.restore()
    if (show && overlay) {
      const sw = overlay.width * scale.x; const sh = overlay.height * scale.y
      let idx = 0
      for (let p = 0; p < PAIRS; p++) {
        const cp = colsFor(p); const off = offFor(p)
        for (let col = 0; col < cp; col++) {
          const ac = col + off; const w = cws[ac] * sw
          let ax = 0; for (let cc = 0; cc < ac; cc++) ax += cws[cc] * sw
          const x = pos.x + ax; const y = pos.y + rows[p] * sh; const h = rh * sh
          if (marks[idx]) { ctx.fillStyle = 'rgba(34,197,94,0.35)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#22C55E'; ctx.lineWidth = 2.5 }
          else { ctx.strokeStyle = 'rgba(59,130,246,0.8)'; ctx.lineWidth = 2 }
          ctx.strokeRect(x, y, w, h)
          if (marks[idx]) { ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#16A34A'; ctx.fillText('✓', x + w/2, y + h/2) }
          idx++
        }
      }
    }
  }, [base, overlay, pos, scale, marks, show, rows, rh, cws, loaded])

  const click = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !overlay) return
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = canvasRef.current.width / rect.width; const sy = canvasRef.current.height / rect.height
    const cx = (e.clientX - rect.left) * sx; const cy = (e.clientY - rect.top) * sy
    const sw = overlay.width * scale.x; const sh = overlay.height * scale.y
    let idx = 0
    for (let p = 0; p < PAIRS; p++) {
      const cp = colsFor(p); const off = offFor(p)
      for (let col = 0; col < cp; col++) {
        const ac = col + off; const w = cws[ac] * sw
        let ax = 0; for (let cc = 0; cc < ac; cc++) ax += cws[cc] * sw
        const x = pos.x + ax; const y = pos.y + rows[p] * sh; const h = rh * sh
        if (cx >= x && cx <= x + w && cy >= y && cy <= y + h) { const nm = [...marks]; nm[idx] = !nm[idx]; setMarks(nm); return }
        idx++
      }
    }
  }

  const down = (e: React.MouseEvent) => { if (e.shiftKey) { setDrag(true); setStart({ x: e.clientX - pos.x, y: e.clientY - pos.y }) } }
  const move = (e: React.MouseEvent) => { if (drag) setPos({ x: e.clientX - start.x, y: e.clientY - start.y }) }
  const up = () => setDrag(false)

  if (!loaded) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-xl p-6">Cargando configuracion...</div></div>

  const cnt = marks.filter(m => m).length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 max-w-6xl w-full max-h-screen overflow-auto">
        <h3 className="text-lg font-semibold mb-3">Plantilla Claves {isA ? 'A' : 'B'} ({isA ? '6-7' : '8-16'} anos) | Max: {CFG.maxScore}</h3>
        <div className="bg-blue-50 rounded-lg p-3 mb-3"><p className="text-xs text-blue-700">Clic en ventana azul = marcar ✓. Shift+Arrastrar = mover todo.</p></div>
        <div className="overflow-auto border rounded-lg mb-3 bg-gray-100" style={{ maxHeight: '55vh' }}>
          <canvas ref={canvasRef} onClick={click} onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up} className="cursor-crosshair" style={{ width: '100%', height: 'auto' }} />
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs">Zoom X: {scale.x.toFixed(2)}</label><input type="range" min="0.3" max="3" step="0.01" value={scale.x} onChange={e => setScale({...scale, x: +e.target.value})} className="w-full" /></div>
            <div><label className="text-xs">Zoom Y: {scale.y.toFixed(2)}</label><input type="range" min="0.3" max="3" step="0.01" value={scale.y} onChange={e => setScale({...scale, y: +e.target.value})} className="w-full" /></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setScale({x:1,y:1})} className="px-3 py-1.5 bg-gray-100 rounded text-sm">Reset Zoom</button>
            <button onClick={() => setPos({x:50,y:50})} className="px-3 py-1.5 bg-gray-100 rounded text-sm">Reset Pos</button>
            <button onClick={() => setShow(!show)} className="px-3 py-1.5 bg-gray-100 rounded text-sm">{show ? 'Ocultar' : 'Mostrar'} rejilla</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMarks(new Array(total).fill(!marks.every(m=>m)))} className="px-3 py-1.5 bg-gray-100 rounded text-sm">{marks.every(m=>m) ? 'Desmarcar' : 'Marcar'} todas</button>
            <button onClick={() => setMarks(new Array(total).fill(false))} className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-sm">Limpiar</button>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex justify-between"><span>Progreso: {cnt} de {total}</span><span className="text-lg font-bold text-blue-700">{cnt}</span></div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(cnt/total)*100}%` }} /></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onScoreCalculated(cnt, marks)} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium">Aplicar puntaje ({cnt})</button>
            <button onClick={onClose} className="flex-1 py-3 bg-gray-200 rounded-lg">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL CLA
// ============================================================
interface CLAInterfaceProps { onComplete: (s: Record<string,number>, t: number) => void; onUpdatePatient: (c: any) => void; patientAge: number }

export const CLAInterface = React.memo(function CLAInterface({ onComplete, onUpdatePatient, patientAge }: CLAInterfaceProps) {
  const [raw, setRaw] = useState('')
  const [done, setDone] = useState(false)
  const [secs, setSecs] = useState(0)
  const [run, setRun] = useState(false)
  const [ended, setEnded] = useState(false)
  const [cam, setCam] = useState(false)
  const [scan, setScan] = useState(false)
  const [img, setImg] = useState<string | null>(null)
  const [mcnt, setMcnt] = useState('')
  const [grid, setGrid] = useState(false)
  const [later, setLater] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const CFG = patientAge <= 7 ? PLANTILLA_CONFIG.A : PLANTILLA_CONFIG.B
  const max = CFG.maxScore
  const oc = useRef(onComplete); const op = useRef(onUpdatePatient)
  useEffect(() => { oc.current = onComplete; op.current = onUpdatePatient }, [onComplete, onUpdatePatient])
  useEffect(() => { op.current({ type: 'wisc5_cla', instruction: 'Copia los simbolos. Tienes 2 minutos.', isRunning: run, timeRemaining: run ? 120 - secs : 120 }) }, [run, secs])

  const tu = useCallback((s: number) => setSecs(s), [])
  const te = useCallback(() => { setEnded(true); setRun(false) }, [])
  const tog = useCallback(() => setRun(p => !p), [])

  const fileUp = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = ev => setImg(ev.target?.result as string); r.readAsDataURL(f)
  }

  const flip = () => {
    if (!img) return
    const i = new Image(); i.src = img
    i.onload = () => {
      const c = document.createElement('canvas'); c.width = i.width; c.height = i.height
      const x = c.getContext('2d'); if (x) { x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(i, 0, 0) }
      setImg(c.toDataURL('image/jpeg', 0.85))
    }
  }

  const complete = () => {
    const s = parseInt(raw, 10)
    if (isNaN(s) || s < 0) { alert('Puntaje invalido'); return }
    if (s > max) { alert(`Maximo es ${max}`); return }
    setDone(true); oc.current({ CLA: s }, s)
  }

  const reviewLater = () => { setLater(true); setDone(true); oc.current({ CLA: -1 }, -1) }
  const applyManual = () => { const c = parseInt(mcnt, 10); if (!isNaN(c) && c >= 0 && c <= max) setRaw(c.toString()) }

  if (done) {
    const pend = later
    return (
      <div className={`rounded-lg p-4 text-center ${pend ? 'bg-orange-50' : 'bg-green-50'}`}>
        <p className={`font-medium ${pend ? 'text-orange-700' : 'text-green-700'}`}>{pend ? 'Pendiente de revision' : 'Completada'}</p>
        {!pend && <p className="text-sm text-green-600 mt-1">Puntaje: {raw} / {max}</p>}
        {pend && <p className="text-sm text-orange-600 mt-1">Podras revisar desde el panel WISC-V</p>}
        {img && <div className="mt-4"><img src={img} alt="Hoja" className="mx-auto max-h-32 rounded border" /></div>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Claves {patientAge <= 7 ? 'A' : 'B'}</span><span className="text-gray-800 font-medium">Tiempo limite: 2 min</span></div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(secs/120)*100}%` }} /></div>
        <p className="text-xs text-gray-500 mt-2">{CFG.pairs} pares x {CFG.cols} cols | Max: {max}</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6"><Stopwatch timeLimit={120} onTimeUpdate={tu} onTimeEnd={te} isRunning={run} onToggleRunning={tog} /></div>
      {ended && <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200"><p className="text-yellow-700 text-sm">Tiempo finalizado. Ingresa el puntaje.</p></div>}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Puntaje bruto total</label>
        <div className="flex gap-3">
          <input type="number" value={raw} onChange={e => setRaw(e.target.value)} min="0" max={max} placeholder={`0-${max}`} className="flex-1 px-4 py-2 text-lg border rounded-lg" disabled={later} />
          <button onClick={complete} disabled={!raw || later} className={`px-6 py-2 rounded-lg font-medium ${raw && !later ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}>Completar</button>
        </div>
        <div className="mt-4 pt-3 border-t">
          {!later ? (
            <button onClick={reviewLater} className="w-full py-2 bg-orange-50 text-orange-700 rounded-lg text-sm border border-orange-200">Dejar para revisar despues</button>
          ) : (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="flex justify-between items-center"><div><p className="text-sm font-medium text-orange-700">Pendiente</p><p className="text-xs text-orange-600">Revisable desde el panel</p></div><button onClick={() => setLater(false)} className="px-3 py-1.5 bg-white text-orange-700 rounded text-xs border">Revisar ahora</button></div>
            </div>
          )}
        </div>
        {!ended && !later && <p className="text-xs text-gray-400 mt-2">Espera a que termine el tiempo</p>}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Verificacion por foto (opcional)</p>
        {!img ? (
          <div className="space-y-2">
            <button onClick={() => setCam(true)} className="w-full py-2 bg-gray-100 rounded-lg text-sm">📷 Usar camara</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={fileUp} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="w-full py-2 bg-gray-100 rounded-lg text-sm">📁 Subir desde el equipo</button>
            <button onClick={() => setScan(true)} className="w-full py-2 bg-gray-100 rounded-lg text-sm">🖨️ Escanear hoja</button>
          </div>
        ) : (
          <div>
            <div className="mb-3"><img src={img} alt="Hoja" className="max-h-48 mx-auto rounded border" /></div>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setCam(true)} className="flex-1 py-1.5 bg-gray-100 rounded text-xs">Camara</button>
              <button onClick={() => fileRef.current?.click()} className="flex-1 py-1.5 bg-gray-100 rounded text-xs">Subir</button>
              <button onClick={() => setImg(null)} className="flex-1 py-1.5 bg-red-50 text-red-600 rounded text-xs">Eliminar</button>
            </div>
            <button onClick={flip} className="w-full py-1.5 bg-yellow-50 text-yellow-700 rounded text-xs mb-2">Invertir horizontalmente</button>
            <button onClick={() => setGrid(true)} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm">Usar plantilla de correccion</button>
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs text-gray-600 mb-2">Conteo manual:</p>
              <div className="flex gap-2"><input type="number" value={mcnt} onChange={e => setMcnt(e.target.value)} min="0" max={max} placeholder="Cantidad" className="flex-1 px-3 py-1.5 text-sm border rounded" /><button onClick={applyManual} className="px-4 py-1.5 bg-gray-600 text-white text-sm rounded">Aplicar</button></div>
            </div>
          </div>
        )}
      </div>

      {cam && <CameraCapture onCapture={d => { setImg(d); setCam(false) }} onClose={() => setCam(false)} />}
      {scan && <ScanModal onClose={() => setScan(false)} />}
      {grid && img && <ScoringGrid imageData={img} patientAge={patientAge} onScoreCalculated={s => { setRaw(s.toString()); setGrid(false) }} onClose={() => setGrid(false)} />}

      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-700">Entrega la hoja al paciente. Di: Copia los simbolos en las casillas. Tienes 2 minutos.</p>
      </div>
    </div>
  )
})