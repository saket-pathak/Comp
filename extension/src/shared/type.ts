// Shared contracts so background, content scripts, and widget never drift
//Out of sync on what an "event" or "trigger" looks like.

export type TriggerType =
  | 'late_night'
  | 'long_session'
  | 'no_break'
  | 'github_commit'
  | 'github_star'
  | 'leetcode_solved'
  | 'idle_return'

export interface SensorEvent {
  type: TriggerType
  source: 'github' | 'leetcode' | 'time' | 'idle'
  timestamp: number
  // coarse, non-sensitive context only — never raw page content,
  // file paths, or full window titles. See security/redact in backend.
  context?: Record<string, string | number | boolean>
}

export type PersonaId = 'mom' | 'friend' | 'teacher' | 'drill_sergeant'

export interface PersonaResponse {
  asciiKey: string
  text: string
}

export interface CompSettings {
  activePersona: PersonaId
  paused: boolean
  quietHoursStart: number // 24h, e.g. 23
  quietHoursEnd: number   // 24h, e.g. 7
  aiPhrasingEnabled: boolean
}

export const DEFAULT_SETTINGS: CompSettings = {
  activePersona: 'friend',
  paused: false,
  quietHoursStart: 23,
  quietHoursEnd: 7,
  aiPhrasingEnabled: false
}
