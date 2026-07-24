export const TIMER_MODES = ["work", "shortBreak", "longBreak"] as const

export type TimerMode = (typeof TIMER_MODES)[number]

export const TIMER_STATUSES = ["idle", "running", "paused"] as const

export type TimerStatus = (typeof TIMER_STATUSES)[number]

export type TimerSettings = {
  readonly workMinutes: number
  readonly shortBreakMinutes: number
  readonly longBreakMinutes: number
  readonly longBreakInterval: number
}

export type TimerState = {
  readonly mode: TimerMode
  readonly status: TimerStatus
  readonly completedWorkSegments: number
  readonly remainingMs: number
  readonly startedAtMs?: number
  readonly endsAtMs?: number
}

export type RuntimeTimerSnapshot = {
  readonly mode: TimerMode
  readonly status: TimerStatus
  readonly completedWorkSegments: number
  readonly remainingMs: number
  readonly endsAtMs?: number
}

export type KeyValueStorage = {
  readonly getItem: (key: string) => string | null
  readonly setItem: (key: string, value: string) => void
  readonly removeItem: (key: string) => void
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled timer variant: ${String(value)}`)
}
