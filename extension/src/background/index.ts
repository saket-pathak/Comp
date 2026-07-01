import { RulesEngine } from './rules_engine'
import { getSettings } from '../shared/storage'
import { SensorEvent, TriggerType } from '../shared/types'

const engine = new RulesEngine()

// Sensor events arrive here from content scripts via chrome.runtime.sendMessage.
chrome.runtime.onMessage.addListener((message: SensorEvent, sender, sendResponse) => {
  if (!message?.type) return

  handleEvent(message, sender.tab?.id)
  sendResponse({ received: true })
  return true
})

// time_sensor equivalent: periodic alarm checks late-night / long-session /
// no-break conditions even when no DOM event has fired recently.
chrome.alarms.create('comp:heartbeat', { periodInMinutes: 5 })
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'comp:heartbeat') {
    handleEvent({ type: 'idle_return', source: 'time', timestamp: Date.now() }, undefined, true)
  }
})

async function handleEvent(event: SensorEvent, tabId: number | undefined, heartbeatOnly = false) {
  const settings = await getSettings()
  if (settings.paused) return

  const triggers = engine.evaluate(event)
  const real = heartbeatOnly ? triggers.filter((t) => t !== 'idle_return') : triggers
  if (real.length === 0) return

  if (isQuietHours(settings.quietHoursStart, settings.quietHoursEnd)) return

  for (const trigger of real) {
    await dispatchToWidget(trigger, tabId)
  }
}

function isQuietHours(start: number, end: number): boolean {
  const hour = new Date().getHours()
  if (start < end) return hour >= start && hour < end
  // wraps past midnight, e.g. 23 -> 7
  return hour >= start || hour < end
}

async function dispatchToWidget(trigger: TriggerType, tabId: number | undefined) {
  if (tabId === undefined) {
    // heartbeat-driven trigger with no active tab context — broadcast to all
    // allowlisted tabs instead of a single one
    const tabs = await chrome.tabs.query({ url: ['https://github.com/*', 'https://leetcode.com/*'] })
    for (const tab of tabs) {
      if (tab.id !== undefined) chrome.tabs.sendMessage(tab.id, { trigger }).catch(() => {})
    }
    return
  }
  chrome.tabs.sendMessage(tabId, { trigger }).catch(() => {})
}
