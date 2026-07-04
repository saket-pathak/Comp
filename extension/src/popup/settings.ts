// settings.ts
// All settings read/write logic for the popup lives here.
// Popup.tsx imports from this file only — no direct chrome.storage calls in the component.

import { CompSettings, DEFAULT_SETTINGS, PersonaId } from '../shared/types'
import { getSettings, setSettings } from '../shared/storage'

// ─── Persona metadata ─────────────────────────────────────────────────────────
// Single source of truth for what personas exist and how they display.
// Adding a new persona means adding an entry here + a matching JSON file.

export interface PersonaMeta {
  id: PersonaId
  name: string
  emoji: string
  tagline: string
}

export const PERSONAS: PersonaMeta[] = [
  {
    id: 'friend',
    name: 'Friend',
    emoji: '🤝',
    tagline: 'Keeps it real. Never judges.'
  },
  {
    id: 'mom',
    name: 'Mom',
    emoji: '👩‍👦',
    tagline: 'Always worried. Always right.'
  },
  {
    id: 'dad',
    name: 'Dad',
    emoji: '👨‍👦',
    tagline: 'Few words. Means everything.'
  },
  {
    id: 'hater',
    name: 'Hater',
    emoji: '😒',
    tagline: 'Brutally honest. Lowkey rooting for you.'
  }
]

// ─── Load / save ──────────────────────────────────────────────────────────────

export async function loadSettings(): Promise<CompSettings> {
  return getSettings()
}

export async function savePersona(persona: PersonaId): Promise<void> {
  const updated = await setSettings({ activePersona: persona })
  broadcastSettingsChange(updated)
}

export async function savePaused(paused: boolean): Promise<void> {
  const updated = await setSettings({ paused })
  broadcastSettingsChange(updated)
}

export async function saveQuietHours(start: number, end: number): Promise<void> {
  const updated = await setSettings({ quietHoursStart: start, quietHoursEnd: end })
  broadcastSettingsChange(updated)
}

export async function saveAiPhrasing(enabled: boolean): Promise<void> {
  const updated = await setSettings({ aiPhrasingEnabled: enabled })
  broadcastSettingsChange(updated)
}

export async function resetSettings(): Promise<CompSettings> {
  await chrome.storage.local.set({ 'comp:settings': DEFAULT_SETTINGS })
  broadcastSettingsChange(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

// ─── Broadcast to widget ──────────────────────────────────────────────────────
// When settings change from the popup, push the new state to all open
// allowlisted tabs so the widget reflects the change immediately.

function broadcastSettingsChange(settings: CompSettings): void {
  chrome.tabs
    .query({ url: ['https://github.com/*', 'https://leetcode.com/*'] })
    .then((tabs) => {
      for (const tab of tabs) {
        if (tab.id !== undefined) {
          chrome.tabs
            .sendMessage(tab.id, { settingsChanged: settings })
            .catch(() => {})
        }
      }
    })
}

// ─── Quiet hours helpers ──────────────────────────────────────────────────────

export function isValidHour(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 23
}

export function formatHour(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:00 ${period}`
}
