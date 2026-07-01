// leetcode_sensor.ts
// Watches LeetCode for submission results and reports them as SensorEvents
// to the background service worker.
//
// Events this sensor can emit:
//   - leetcode_solved : user's submission was accepted
//
// Strategy: LeetCode is a React SPA. The submission result doesn't cause a
// full page reload — it appears as a DOM update inside the editor panel.
// We use a MutationObserver to catch when the result toast/panel appears,
// then read the verdict text.
//
// Two places LeetCode shows results (they've changed the UI a few times):
//   1. A result banner at the top of the page ("Accepted", "Wrong Answer"…)
//   2. A toast notification that appears briefly
// We watch both so this stays robust across LeetCode UI updates.

import type { SensorEvent } from '../shared/types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function send(type: SensorEvent['type'], context?: SensorEvent['context']) {
  const event: SensorEvent = {
    type,
    source: 'leetcode',
    timestamp: Date.now(),
    context
  }
  chrome.runtime.sendMessage(event).catch(() => {})
}

// Accepted verdict strings LeetCode uses (they vary slightly by locale/version)
const ACCEPTED_STRINGS = ['accepted', 'success']

function isAccepted(text: string): boolean {
  return ACCEPTED_STRINGS.some((s) => text.toLowerCase().includes(s))
}

// ─── prevent duplicate fires ─────────────────────────────────────────────────
// LeetCode's DOM can re-render the same result multiple times during the same
// submission. We track the last fired timestamp to gate duplicate triggers.

const DEDUPE_WINDOW_MS = 10_000
let lastFiredAt = 0

function tryFire(context?: SensorEvent['context']) {
  const now = Date.now()
  if (now - lastFiredAt < DEDUPE_WINDOW_MS) return
  lastFiredAt = now
  send('leetcode_solved', context)
}

// ─── result extraction ────────────────────────────────────────────────────────

function readProblemSlug(): string {
  // URL pattern: leetcode.com/problems/<slug>/
  const match = window.location.pathname.match(/\/problems\/([^/]+)/)
  return match ? match[1] : 'unknown'
}

function checkNode(node: Element) {
  const text = node.textContent?.trim() ?? ''
  if (!text) return
  if (isAccepted(text)) {
    tryFire({ problem: readProblemSlug() })
  }
}

// ─── MutationObserver watching for result elements ───────────────────────────
//
// We look for nodes that are likely to carry the result text based on
// attributes/class patterns LeetCode has used. We intentionally avoid
// hardcoding specific class names (they're obfuscated/hashed in LeetCode's
// build) and instead scan text content of newly added nodes.

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue
      const el = node as Element

      // Check the node itself
      checkNode(el)

      // Check children — result text is often nested a few levels deep
      el.querySelectorAll<HTMLElement>('[class*="result"], [class*="status"], [data-e2e-locator]')
        .forEach(checkNode)
    }
  }
})

// ─── also poll the result panel once after a submit button click ──────────────
// Some LeetCode versions render the result panel lazily. Listening for the
// submit button and polling a few seconds later is a reliable backup strategy.

function attachSubmitListener() {
  const submitBtn = document.querySelector<HTMLElement>(
    'button[data-e2e-locator="console-submit-button"], button[data-cy="submit-code-btn"]'
  )
  if (!submitBtn || submitBtn.dataset.compListening === 'true') return
  submitBtn.dataset.compListening = 'true'

  submitBtn.addEventListener('click', () => {
    // Poll up to 15s after submit for the result to appear
    let attempts = 0
    const poll = setInterval(() => {
      attempts++
      if (attempts > 15) {
        clearInterval(poll)
        return
      }

      // Check for common result container patterns
      const resultEl = document.querySelector<HTMLElement>(
        '[class*="result-container"], [class*="submission-result"], [data-e2e-locator="submission-result"]'
      )
      if (!resultEl) return

      const text = resultEl.textContent?.trim() ?? ''
      if (isAccepted(text)) {
        clearInterval(poll)
        tryFire({ problem: readProblemSlug(), detected_via: 'poll' })
      } else if (text.length > 0) {
        // A non-empty, non-accepted result means it failed — stop polling
        clearInterval(poll)
      }
    }, 1000)
  })
}

// ─── re-attach on SPA navigation ─────────────────────────────────────────────

let lastUrl = window.location.href

const navObserver = new MutationObserver(() => {
  const currentUrl = window.location.href
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl
    setTimeout(attachSubmitListener, 1000)
  }
})

navObserver.observe(document.body, { childList: true, subtree: true })

// ─── initial setup ────────────────────────────────────────────────────────────

observer.observe(document.body, { childList: true, subtree: true })
attachSubmitListener()

export {}
