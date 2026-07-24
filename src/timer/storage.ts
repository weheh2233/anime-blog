import { createInitialTimerState, restoreTimerState, snapshotTimerState } from "./state.js"
import { DEFAULT_TIMER_SETTINGS, sanitizeTimerSettings } from "./settings.js"
import type { KeyValueStorage, RuntimeTimerSnapshot, TimerSettings, TimerState, TimerStatus } from "./types.js"

export const SETTINGS_STORAGE_KEY = "pomodoro.settings.v1"
export const RUNTIME_STORAGE_KEY = "pomodoro.runtime.v1"

export function loadTimerSettings(storage: KeyValueStorage): TimerSettings {
  const raw = storage.getItem(SETTINGS_STORAGE_KEY)

  if (raw === null) {
    return DEFAULT_TIMER_SETTINGS
  }

  const parsed = parseJson(raw)
  if (!isRecord(parsed)) {
    return DEFAULT_TIMER_SETTINGS
  }

  return sanitizeTimerSettings({
    workMinutes: readNumber(parsed, "workMinutes") ?? DEFAULT_TIMER_SETTINGS.workMinutes,
    shortBreakMinutes: readNumber(parsed, "shortBreakMinutes") ?? DEFAULT_TIMER_SETTINGS.shortBreakMinutes,
    longBreakMinutes: readNumber(parsed, "longBreakMinutes") ?? DEFAULT_TIMER_SETTINGS.longBreakMinutes,
    longBreakInterval: readNumber(parsed, "longBreakInterval") ?? DEFAULT_TIMER_SETTINGS.longBreakInterval,
  })
}

export function saveTimerSettings(storage: KeyValueStorage, settings: TimerSettings): void {
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeTimerSettings(settings)))
}

export function loadRuntimeTimerState(storage: KeyValueStorage, settings: TimerSettings, nowMs: number): TimerState {
  const raw = storage.getItem(RUNTIME_STORAGE_KEY)

  if (raw === null) {
    return createInitialTimerState(settings)
  }

  const snapshot = parseRuntimeSnapshot(parseJson(raw), settings)

  if (snapshot === null) {
    return createInitialTimerState(settings)
  }

  return restoreTimerState(snapshot, settings, nowMs)
}

export function saveRuntimeTimerState(storage: KeyValueStorage, state: TimerState, nowMs: number): void {
  storage.setItem(RUNTIME_STORAGE_KEY, JSON.stringify(snapshotTimerState(state, nowMs)))
}

export function clearRuntimeTimerState(storage: KeyValueStorage): void {
  storage.removeItem(RUNTIME_STORAGE_KEY)
}

function parseRuntimeSnapshot(value: unknown, settings: TimerSettings): RuntimeTimerSnapshot | null {
  if (!isRecord(value)) {
    return null
  }

  const mode = readTimerMode(value, "mode")
  const status = readTimerStatus(value, "status")
  const completedWorkSegments = readNumber(value, "completedWorkSegments")
  const remainingMs = readNumber(value, "remainingMs")
  const endsAtMs = readNumber(value, "endsAtMs")

  if (mode === null || status === null || completedWorkSegments === undefined || remainingMs === undefined) {
    return null
  }

  if (!Number.isInteger(completedWorkSegments) || completedWorkSegments < 0) {
    return null
  }

  const maxRemainingMs = Math.max(settings.workMinutes, settings.shortBreakMinutes, settings.longBreakMinutes) * 60_000
  if (!Number.isInteger(remainingMs) || remainingMs < 0 || remainingMs > maxRemainingMs) {
    return null
  }

  if (status !== "running") {
    return { mode, status, completedWorkSegments, remainingMs }
  }

  if (endsAtMs === undefined || !Number.isInteger(endsAtMs)) {
    return null
  }

  return { mode, status, completedWorkSegments, remainingMs, endsAtMs }
}

function parseJson(raw: string): unknown {
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null
    }

    throw error
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readNumber(record: Readonly<Record<string, unknown>>, key: string): number | undefined {
  const value = record[key]
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function readTimerMode(record: Readonly<Record<string, unknown>>, key: string): RuntimeTimerSnapshot["mode"] | null {
  const value = record[key]
  if (value === "work" || value === "shortBreak" || value === "longBreak") {
    return value
  }

  return null
}

function readTimerStatus(record: Readonly<Record<string, unknown>>, key: string): TimerStatus | null {
  const value = record[key]
  if (value === "idle" || value === "running" || value === "paused") {
    return value
  }

  return null
}
