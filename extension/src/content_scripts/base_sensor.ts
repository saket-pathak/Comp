// Shared by every content script. Tracks idle/active state on the page and
// reports it to the background service worker. Site-specific sensors
// (github_sensor.ts, leetcode_sensor.ts) import nothing from here directly —
// they just send their own SensorEvent messages independently — this file's
// job is only the generic idle-return signal.

const IDLE_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes of no interaction = "away"

let lastInteractionAt = Date.now()
let wasIdle = false

function markActive() {
  const now = Date.now()
  if (wasIdle) {
    chrome.runtime.sendMessage({
      type: 'idle_return',
      source: 'idle',
      timestamp: now
    })
  }
  wasIdle = false
  lastInteractionAt = now
}

;['mousemove', 'keydown', 'scroll', 'click'].forEach((evt) =>
  window.addEventListener(evt, markActive, { passive: true })
)

setInterval(() => {
  if (!wasIdle && Date.now() - lastInteractionAt >= IDLE_THRESHOLD_MS) {
    wasIdle = true
  }
}, 30 * 1000)

export {} // keep this a module
