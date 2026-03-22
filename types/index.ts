export type UserRole = 'psychologist' | 'admin'
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type Gender = 'M' | 'F' | 'NB' | 'NS'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  rut?: string
  specialty?: string
  institution?: string
  avatar_url?: string
  plan: 'free' | 'pro' | 'enterprise'
  plan_expires_at?: string
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  psychologist_id: string
  full_name: string
  rut?: string
  birth_date: string
  gender?: Gender
  school?: string
  grade?: string
  city?: string
  notes?: string
  is_archived: boolean
  created_at: string
  updated_at: string
  // computed / joined
  age_years?: number
  age_months?: number
  latest_session?: PatientSession | null
  session_count?: number
}

export interface PatientSession {
  id: string
  test_id: string
  status: SessionStatus
  scheduled_at?: string
  completed_at?: string
  created_at: string
}

export interface Session {
  id: string
  psychologist_id: string
  patient_id: string
  test_id: string
  status: SessionStatus
  scheduled_at?: string
  started_at?: string
  completed_at?: string
  age_years?: number
  age_months?: number
  age_days?: number
  age_group?: string
  realtime_channel?: string
  settings: Record<string, unknown>
  notes?: string
  created_at: string
  updated_at: string
}

export const TEST_LABELS: Record<string, string> = {
  wisc5_cl:    'WISC-V',
  beck_bdi2:   'BDI-II',
  coopersmith: 'Coopersmith',
  peca:        'PECA',
  stai:        'STAI',
}

export const GENDER_LABELS: Record<Gender, string> = {
  M:  'Masculino',
  F:  'Femenino',
  NB: 'No binario',
  NS: 'No especifica',
}

export const STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled:   'Programada',
  in_progress: 'En curso',
  completed:   'Completada',
  cancelled:   'Cancelada',
}
