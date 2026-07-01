import { CompSettings, DEFAULT_SETTINGS } from './types'

const SETTINGS_KEY = 'comp:settings'

export async function getSettings(): Promise<CompSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] ?? {}) }
}

export async function setSettings(partial: Partial<CompSettings>): Promise<CompSettings> {
  const current = await getSettings()
  const next = { ...current, ...partial }
  await chrome.storage.local.set({ [SETTINGS_KEY]: next })
  return next
}

export async function getValue<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key)
  return key in result ? (result[key] as T) : fallback
}

export async function setValue<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value })
}
