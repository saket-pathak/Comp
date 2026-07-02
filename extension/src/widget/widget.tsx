import { useState, useEffect, useCallback, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { AsciiRenderer } from './AsciiRenderer'
import type { TriggerType, PersonaId, CompSettings } from '../shared/types'
import { DEFAULT_SETTINGS } from '../shared/types'
import { getSettings } from '../shared/storage'

// ─── Widget state ─────────────────────────────────────────────────────────────

interface WidgetState {
  visible: boolean
  trigger: TriggerType | null
  persona: PersonaId
  paused: boolean
  minimised: boolean
}

// ─── Widget root component ────────────────────────────────────────────────────

function Widget() {
  const [state, setState] = useState<WidgetState>({
    visible: false,
    trigger: null,
    persona: DEFAULT_SETTINGS.activePersona,
    paused: false,
    minimised: false
  })

  // Load settings on mount
  useEffect(() => {
    getSettings().then((s: CompSettings) => {
      setState((prev) => ({ ...prev, persona: s.activePersona, paused: s.paused }))
    })
  }, [])

  // Listen for trigger messages from the background service worker
  useEffect(() => {
    const handler = (message: { trigger?: TriggerType; settingsChanged?: Partial<CompSettings> }) => {
      if (message.settingsChanged) {
        setState((prev) => ({
          ...prev,
          persona: message.settingsChanged?.activePersona ?? prev.persona,
          paused: message.settingsChanged?.paused ?? prev.paused
        }))
        return
      }

      if (message.trigger && !state.paused) {
        setState((prev) => ({
          ...prev,
          visible: true,
          minimised: false,
          trigger: message.trigger ?? null
        }))
      }
    }

    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [state.paused])

  const handleDismiss = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false, trigger: null }))
  }, [])

  const handleMinimise = useCallback(() => {
    setState((prev) => ({ ...prev, minimised: true }))
  }, [])

  const handleExpand = useCallback(() => {
    setState((prev) => ({ ...prev, minimised: false }))
  }, [])

  // Don't render anything if paused with nothing to show
  if (state.paused && !state.visible) return null

  return (
    <div className="comp-widget-root" data-minimised={state.minimised}>

      {/* ── Minimised pill — always visible when not fully dismissed ── */}
      {state.minimised && (
        <button
          className="comp-pill"
          onClick={handleExpand}
          aria-label="Expand Comp companion"
        >
          ( •_•)
        </button>
      )}

      {/* ── Full reaction panel ── */}
      {!state.minimised && state.visible && state.trigger && (
        <div className="comp-panel" role="status" aria-live="polite">

          {/* header row */}
          <div className="comp-panel-header">
            <span className="comp-label">comp</span>
            <div className="comp-header-actions">
              <button
                className="comp-icon-btn"
                onClick={handleMinimise}
                aria-label="Minimise"
                title="Minimise"
              >
                –
              </button>
              <button
                className="comp-icon-btn"
                onClick={handleDismiss}
                aria-label="Dismiss"
                title="Dismiss"
              >
                ×
              </button>
            </div>
          </div>

          {/* ASCII art + text */}
          <AsciiRenderer
            trigger={state.trigger}
            persona={state.persona}
            onDismiss={handleDismiss}
          />

          {/* dismiss bar */}
          <div className="comp-progress-bar" aria-hidden="true">
            <div className="comp-progress-fill" />
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Shadow DOM mount ─────────────────────────────────────────────────────────
// We mount inside a shadow root so Comp's styles are completely isolated from
// the host page's CSS — no leakage in either direction. This is the same
// technique Grammarly and similar extensions use.

function mountWidget() {
  const existing = document.getElementById('comp-extension-root')
  if (existing) return // already mounted on this page

  const host = document.createElement('div')
  host.id = 'comp-extension-root'

  // Minimal host-side styles — only position, z-index, pointer-events
  // Everything else lives inside the shadow root and widget.css
  host.style.cssText = [
    'position: fixed',
    'bottom: 24px',
    'right: 24px',
    'z-index: 2147483647',   // max z-index — sit above everything
    'pointer-events: none',  // host itself is transparent to clicks
    'font-family: monospace'
  ].join('; ')

  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'closed' })

  // Inject widget.css into the shadow root
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = chrome.runtime.getURL('src/widget/widget.css')
  shadow.appendChild(link)

  const mountPoint = document.createElement('div')
  shadow.appendChild(mountPoint)

  const root = createRoot(mountPoint)
  root.render(<Widget />)
}

mountWidget()
