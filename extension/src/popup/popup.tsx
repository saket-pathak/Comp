import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  PERSONAS,
  loadSettings,
  savePersona,
  savePaused,
  saveQuietHours,
  saveAiPhrasing,
  resetSettings,
  formatHour,
  type PersonaMeta
} from './settings'
import type { CompSettings, PersonaId } from '../shared/types'

// ─── Persona card ─────────────────────────────────────────────────────────────

function PersonaCard({
  persona,
  active,
  onSelect
}: {
  persona: PersonaMeta
  active: boolean
  onSelect: (id: PersonaId) => void
}) {
  return (
    <button
      className={`persona-card ${active ? 'persona-card--active' : ''}`}
      onClick={() => onSelect(persona.id)}
      aria-pressed={active}
      title={persona.tagline}
    >
      <span className="persona-emoji">{persona.emoji}</span>
      <span className="persona-name">{persona.name}</span>
      {active && <span className="persona-active-dot" aria-hidden="true" />}
    </button>
  )
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  id
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  id: string
}) {
  return (
    <label className="toggle-row" htmlFor={id}>
      <span className="toggle-label">{label}</span>
      <span className={`toggle-switch ${checked ? 'toggle-switch--on' : ''}`}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="toggle-input"
          aria-checked={checked}
        />
        <span className="toggle-thumb" aria-hidden="true" />
      </span>
    </label>
  )
}

// ─── Hour select ──────────────────────────────────────────────────────────────

function HourSelect({
  value,
  onChange,
  label,
  id
}: {
  value: number
  onChange: (v: number) => void
  label: string
  id: string
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  return (
    <div className="hour-select-row">
      <label className="hour-select-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="hour-select"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {hours.map((h) => (
          <option key={h} value={h}>
            {formatHour(h)}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── Main Popup ───────────────────────────────────────────────────────────────

function Popup() {
  const [settings, setSettings] = useState<CompSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [section, setSection] = useState<'persona' | 'preferences'>('persona')

  useEffect(() => {
    loadSettings().then(setSettings)
  }, [])

  function flash() {
    setSaved(true)
    setTimeout(() => setSaved(false), 1400)
  }

  async function handlePersonaSelect(id: PersonaId) {
    if (!settings) return
    const next = { ...settings, activePersona: id }
    setSettings(next)
    await savePersona(id)
    flash()
  }

  async function handlePaused(paused: boolean) {
    if (!settings) return
    const next = { ...settings, paused }
    setSettings(next)
    await savePaused(paused)
  }

  async function handleQuietHoursStart(start: number) {
    if (!settings) return
    const next = { ...settings, quietHoursStart: start }
    setSettings(next)
    await saveQuietHours(start, settings.quietHoursEnd)
    flash()
  }

  async function handleQuietHoursEnd(end: number) {
    if (!settings) return
    const next = { ...settings, quietHoursEnd: end }
    setSettings(next)
    await saveQuietHours(settings.quietHoursStart, end)
    flash()
  }

  async function handleAiPhrasing(enabled: boolean) {
    if (!settings) return
    const next = { ...settings, aiPhrasingEnabled: enabled }
    setSettings(next)
    await saveAiPhrasing(enabled)
  }

  async function handleReset() {
    const defaults = await resetSettings()
    setSettings(defaults)
    flash()
  }

  if (!settings) {
    return (
      <div className="popup-root">
        <div className="loading">( •_•) loading...</div>
      </div>
    )
  }

  return (
    <div className="popup-root">

      <header className="popup-header">
        <div className="popup-title">
          <span className="popup-logo">( •_•)</span>
          <span className="popup-name">comp</span>
        </div>
        <Toggle
          id="paused-toggle"
          label={settings.paused ? 'Paused' : 'Active'}
          checked={!settings.paused}
          onChange={(v) => handlePaused(!v)}
        />
      </header>

      <nav className="popup-nav" role="tablist">
        <button
          role="tab"
          aria-selected={section === 'persona'}
          className={`nav-tab ${section === 'persona' ? 'nav-tab--active' : ''}`}
          onClick={() => setSection('persona')}
        >
          Companion
        </button>
        <button
          role="tab"
          aria-selected={section === 'preferences'}
          className={`nav-tab ${section === 'preferences' ? 'nav-tab--active' : ''}`}
          onClick={() => setSection('preferences')}
        >
          Preferences
        </button>
      </nav>

      {section === 'persona' && (
        <section className="popup-section" aria-label="Choose companion">
          <p className="section-hint">Who is keeping you company?</p>
          <div className="persona-grid">
            {PERSONAS.map((p) => (
              <PersonaCard
                key={p.id}
                persona={p}
                active={settings.activePersona === p.id}
                onSelect={handlePersonaSelect}
              />
            ))}
          </div>
          {settings.activePersona && (
            <p className="persona-tagline">
              {PERSONAS.find((p) => p.id === settings.activePersona)?.tagline}
            </p>
          )}
        </section>
      )}

      {section === 'preferences' && (
        <section className="popup-section" aria-label="Preferences">

          <div className="pref-group">
            <p className="pref-group-label">Quiet hours</p>
            <p className="pref-group-hint">
              Comp stays silent between these hours.
            </p>
            <HourSelect
              id="quiet-start"
              label="From"
              value={settings.quietHoursStart}
              onChange={handleQuietHoursStart}
            />
            <HourSelect
              id="quiet-end"
              label="Until"
              value={settings.quietHoursEnd}
              onChange={handleQuietHoursEnd}
            />
          </div>

          <div className="pref-divider" />

          <div className="pref-group">
            <p className="pref-group-label">AI responses</p>
            <p className="pref-group-hint">
              Uses Claude to generate fresh messages instead of templates.
              Requires a backend connection. No raw activity leaves your device.
            </p>
            <Toggle
              id="ai-toggle"
              label="AI phrasing"
              checked={settings.aiPhrasingEnabled}
              onChange={handleAiPhrasing}
            />
          </div>

          <div className="pref-divider" />

          <div className="pref-group">
            <button className="reset-btn" onClick={handleReset}>
              Reset to defaults
            </button>
          </div>

        </section>
      )}

      <footer className="popup-footer">
        {saved
          ? <span className="footer-saved">saved</span>
          : <span className="footer-version">comp v0.1.0</span>
        }
      </footer>

    </div>
  )
}

const root = document.getElementById('root')
if (root) createRoot(root).render(<Popup />)
