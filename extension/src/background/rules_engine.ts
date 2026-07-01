import { SensorEvent, TriggerType } from '../shared/types'

interface SessionState {
  lastActiveAt: number
  sessionStartedAt: number
  lastBreakAt: number
  lastTriggerFired: Partial<Record<TriggerType, number>>
}

// Cooldown so the same trigger doesn't fire every few seconds once
// conditions are met — this is the simplest, cheapest guard against
// becoming the nagware the README explicitly wants to avoid.
const COOLDOWN_MS: Record<TriggerType, number> = {
  late_night: 30 * 60 * 1000,
  long_session: 60 * 60 * 1000,
  no_break: 60 * 60 * 1000,
  github_commit: 0,
  github_star: 0,
  leetcode_solved: 0,
  idle_return: 5 * 60 * 1000
}

const LONG_SESSION_MS = 3 * 60 * 60 * 1000
const NO_BREAK_MS = 2 * 60 * 60 * 1000

export class RulesEngine {
  private state: SessionState

  constructor() {
    const now = Date.now()
    this.state = {
      lastActiveAt: now,
      sessionStartedAt: now,
      lastBreakAt: now,
      lastTriggerFired: {}
    }
  }

  /** Feed a sensor event in, get back zero or more triggers that should fire now. */
  evaluate(event: SensorEvent): TriggerType[] {
    const now = event.timestamp
    const fired: TriggerType[] = []

    if (event.type === 'idle_return') {
      this.state.lastBreakAt = now
      this.state.sessionStartedAt = now
      if (this.canFire('idle_return', now)) fired.push('idle_return')
    }

    if (event.type === 'github_commit' && this.canFire('github_commit', now)) {
      fired.push('github_commit')
    }
    if (event.type === 'github_star' && this.canFire('github_star', now)) {
      fired.push('github_star')
    }
    if (event.type === 'leetcode_solved' && this.canFire('leetcode_solved', now)) {
      fired.push('leetcode_solved')
    }

    this.state.lastActiveAt = now

    const hour = new Date(now).getHours()
    const isLateNight = hour >= 1 && hour < 5
    if (isLateNight && this.canFire('late_night', now)) {
      fired.push('late_night')
    }

    if (now - this.state.sessionStartedAt >= LONG_SESSION_MS && this.canFire('long_session', now)) {
      fired.push('long_session')
    }

    if (now - this.state.lastBreakAt >= NO_BREAK_MS && this.canFire('no_break', now)) {
      fired.push('no_break')
    }

    for (const trigger of fired) {
      this.state.lastTriggerFired[trigger] = now
    }

    return fired
  }

  private canFire(trigger: TriggerType, now: number): boolean {
    const last = this.state.lastTriggerFired[trigger]
    if (last === undefined) return true
    return now - last >= COOLDOWN_MS[trigger]
  }
}
