import type { TimerMode, TimerSettings } from "./types.js"
import { assertNever } from "./types.js"

export const DEFAULT_TIMER_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
} as const satisfies TimerSettings

const MIN_WORK_MINUTES = 1
const MAX_WORK_MINUTES = 90
const MIN_SHORT_BREAK_MINUTES = 1
const MAX_SHORT_BREAK_MINUTES = 30
const MIN_LONG_BREAK_MINUTES = 1
const MAX_LONG_BREAK_MINUTES = 60
const MIN_LONG_BREAK_INTERVAL = 2
const MAX_LONG_BREAK_INTERVAL = 8

export function durationMsForMode(mode: TimerMode, settings: TimerSettings): number {
  switch (mode) {
    case "work":
      return minutesToMs(settings.workMinutes)
    case "shortBreak":
      return minutesToMs(settings.shortBreakMinutes)
    case "longBreak":
      return minutesToMs(settings.longBreakMinutes)
    default:
      return assertNever(mode)
  }
}

export function sanitizeTimerSettings(input: Partial<TimerSettings>): TimerSettings {
  return {
    workMinutes: boundedInteger(input.workMinutes, DEFAULT_TIMER_SETTINGS.workMinutes, MIN_WORK_MINUTES, MAX_WORK_MINUTES),
    shortBreakMinutes: boundedInteger(
      input.shortBreakMinutes,
      DEFAULT_TIMER_SETTINGS.shortBreakMinutes,
      MIN_SHORT_BREAK_MINUTES,
      MAX_SHORT_BREAK_MINUTES,
    ),
    longBreakMinutes: boundedInteger(
      input.longBreakMinutes,
      DEFAULT_TIMER_SETTINGS.longBreakMinutes,
      MIN_LONG_BREAK_MINUTES,
      MAX_LONG_BREAK_MINUTES,
    ),
    longBreakInterval: boundedInteger(
      input.longBreakInterval,
      DEFAULT_TIMER_SETTINGS.longBreakInterval,
      MIN_LONG_BREAK_INTERVAL,
      MAX_LONG_BREAK_INTERVAL,
    ),
  }
}

function minutesToMs(minutes: number): number {
  return minutes * 60_000
}

function boundedInteger(value: number | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || !Number.isInteger(value) || value < min || value > max) {
    return fallback
  }

  return value
}
