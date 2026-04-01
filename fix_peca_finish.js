const fs = require('fs')
const path = 'app/dual-control/[dualSessionId]/peca.tsx'
let content = fs.readFileSync(path, 'utf8')

// Remove finish import
content = content.replace("import { finishEvaluation } from './finish'\n", '')

// Replace handleFinish function
const oldFinish = `  const handleFinish = async () => {
    if (!allDone) return
    setFinishing(true)
    await finishEvaluation({ dualSessionId, sessionId, responses, router })
  }`

const newFinish = `  const handleFinish = async () => {
    if (!allDone) return
    setFinishing(true)
    try {
      const { scorePeca } = await import('@/lib/peca/engine')
      const result = scorePeca(responses)
      const { supabase } = await import('@/lib/supabase/client')
      const { error } = await supabase
        .from('peca_scores')
        .upsert({ session_id: sessionId, responses, ...result }, { onConflict: 'session_id' })
      if (error) { alert('Error al guardar: ' + error.message); setFinishing(false); return }
      await supabase.from('sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', sessionId)
      router.push('/dashboard')
    } catch(e: any) {
      alert('Error: ' + e.message)
      setFinishing(false)
    }
  }`

content = content.replace(oldFinish, newFinish)
fs.writeFileSync(path, content, 'utf8')
console.log('Done')
