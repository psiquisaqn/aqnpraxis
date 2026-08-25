// lib/activities/types.ts
export interface PdpiActivity {
  step: string
  label: string
  instruction: string
  display?: {
    type: 'text' | 'image_prompt' | 'breathing_timer' | 'hands_guide' | 'meditation'
    content: string
    duration_sec?: number
  }
  psychologist_note?: string
}

export interface PdpiSession {
  id: number
  area: string
  element: string
  objective: string
  activities: PdpiActivity[]
  achievement_domains: string[]
  completed_by_aqn?: boolean
}