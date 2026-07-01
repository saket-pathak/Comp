// github_sensor.ts
// Watches GitHub pages for meaningful developer activity and reports them
// as SensorEvents to the background service worker.
//
// Strategy: GitHub is a SPA (uses Turbo/PJAX for navigation), so we can't
// rely on page load events alone. We use a MutationObserver on document.body
// to catch DOM changes after navigation, then re-run page-specific checks.
//
// Events this sensor can emit:
//   - github_commit  : user just pushed / viewed their own commit confirmation
//   - github_star    : user just starred a repository
//   - github_pr      : user's PR was merged (stretch, Phase 2)

import type { SensorEvent } from '../shared/types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function send(type: SensorEvent['type'], context?: SensorEvent['context']) {
  const event: SensorEvent = {
    type,
    source: 'github',
    timestamp: Date.now(),
    context
  }
  chrome.runtime.sendMessage(event).catch(() => {
    // tab may be navigating away; safe to swallow
  })
}

function getCurrentUsername(): string | null {
  // GitHub puts the logged-in username in a meta tag
  const meta = document.querySelector<HTMLMetaElement>('meta[name="user-login"]')
  return meta?.content?.trim() || null
}

// ─── commit detection ─────────────────────────────────────────────────────────
// Fires when the user lands on their own commit page:
//   github.com/<user>/<repo>/commit/<sha>
// We check that the commit author matches the logged-in user so we don't
// react to other people's commits the user is just browsing.

function checkCommitPage() {
  const path = window.location.pathname
  // /username/repo/commit/sha
  const commitPattern = /^\/[^/]+\/[^/]+\/commit\/[0-9a-f]{7,40}$/
  if (!commitPattern.test(path)) return

  const username = getCurrentUsername()
  if (!username) return

  // Author avatar alt text contains the username on commit pages
  const authorEl = document.querySelector<HTMLElement>(
    '.commit-author, [data-hovercard-type="user"]'
  )
  if (!authorEl) return

  const authorName =
    authorEl.getAttribute('href')?.replace('/', '').trim() ??
    authorEl.textContent?.trim()

  if (authorName && authorName.toLowerCase() === username.toLowerCase()) {
    send('github_commit', { path: 'commit_page' })
  }
}

// ─── star detection ───────────────────────────────────────────────────────────
// GitHub's star button toggles between "Star" and "Unstar".
// We listen for a click that transitions from "Star" → "Unstar", meaning
// the user just starred something.

function attachStarListener() {
  // star buttons are inside .starring-container elements
  document.querySelectorAll<HTMLElement>('.starring-container').forEach((container) => {
    if (container.dataset.compListening === 'true') return
    container.dataset.compListening = 'true'

    container.addEventListener('click', () => {
      // After the click, GitHub updates the class — use a short delay to
      // let the DOM settle before reading the new state
      setTimeout(() => {
        const isNowStarred = container.querySelector<HTMLElement>('.unstar-btn') !== null
        if (isNowStarred) {
          send('github_star', { page: window.location.pathname.slice(0, 60) })
        }
      }, 600)
    })
  })
}

// ─── MutationObserver — re-run checks after SPA navigations ──────────────────

let lastUrl = window.location.href
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const observer = new MutationObserver(() => {
  const currentUrl = window.location.href

  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      checkCommitPage()
      attachStarListener()
    }, 800) // wait for GitHub's turbo-frame to finish rendering
  } else {
    // same URL but DOM changed — re-attach star listeners for dynamically
    // loaded star buttons (e.g. on the explore / trending page)
    attachStarListener()
  }
})

observer.observe(document.body, { childList: true, subtree: true })

// ─── initial run on page load ────────────────────────────────────────────────

checkCommitPage()
attachStarListener()

export {}
