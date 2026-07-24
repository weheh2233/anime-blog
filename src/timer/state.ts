import { DEFAULT_TIMER_SETTINGS, durationMsForMode, sanitizeTimerSettings } from "./settings.js"
import type { RuntimeTimerSnapshot, TimerMode, TimerSettings, TimerState } from "./types.js"

export function createInitialTimerState(settings: TimerSettings = DEFAULT_TIMER_SETTINGS): TimerState {
  return {
    mode: "work",
    status: "idle",
    completedWorkSegments: 0,
    remainingMs: durationMsForMode("work", settings),
  }
}

export function startTimer(state: TimerState, nowMs: number): TimerState {
  if (state.status === "running") {
    return state
  }

  return {
    mode: state.mode,
    status: "running",
    completedWorkSegments: state.completedWorkSegments,
    remainingMs: state.remainingMs,
    startedAtMs: nowMs,
    endsAtMs: nowMs + state.remainingMs,
  }
}

export function pauseTimer(state: TimerState, nowMs: number): TimerState {
  if (state.status !== "running" || state.endsAtMs === undefined) {
    return state
  }

  return {
    mode: state.mode,
    status: "paused",
    completedWorkSegments: state.completedWorkSegments,
    remainingMs: Math.max(0, state.endsAtMs - nowMs),
  }
}

export function resetTimer(state: TimerState, settings: TimerSettings = DEFAULT_TIMER_SETTINGS): TimerState {
  return {
    mode: state.mode,
    status: "idle",
    completedWorkSegments: state.completedWorkSegments,
    remainingMs: durationMsForMode(state.mode, settings),
  }
}

export function skipCurrentSegment(state: TimerState, settings: TimerSettings, nowMs: number): TimerState {
  return completeCurrentSegment(state, settings, nowMs)
}

export function applyTimerSettings(state: TimerState, settings: Partial<TimerSettings>): TimerState {
  const nextSettings = sanitizeTimerSettings(settings)

  return {
    mode: state.mode,
    status: "idle",
    completedWorkSegments: state.completedWorkSegments,
    remainingMs: durationMsForMode(state.mode, nextSettings),
  }
}

export function completeCurrentSegment(state: TimerState, settings: TimerSettings, nowMs: number): TimerState {
  if (state.mode === "work") {
    const completedWorkSegments = state.completedWorkSegments + 1
    const mode = nextBreakMode(completedWorkSegments, settings.longBreakInterval)
    const remainingMs = durationMsForMode(mode, settings)

    return {
      mode,
      status: "running",
      completedWorkSegments,
      remainingMs,
      startedAtMs: nowMs,
      endsAtMs: nowMs + remainingMs,
    }
  }

  return {
    mode: "work",
    status: "paused",
    completedWorkSegments: state.completedWorkSegments,
    remainingMs: durationMsForMode("work", settings),
  }
}

export function tickTimer(state: TimerState, settings: TimerSettings, nowMs: number): TimerState {
  if (state.status !== "running" || state.endsAtMs === undefined || nowMs < state.endsAtMs) {
    return state
  }

  return completeCurrentSegment(state, settings, nowMs)
}

export function snapshotTimerState(state: TimerState, nowMs: number): RuntimeTimerSnapshot {
  if (state.status !== "running" || state.endsAtMs === undefined) {
    return {
      mode: state.mode,
      status: state.status,
      completedWorkSegments: state.completedWorkSegments,
      remainingMs: state.remainingMs,
    }
  }

  return {
    mode: state.mode,
    status: state.status,
    completedWorkSegments: state.completedWorkSegments,
    remainingMs: Math.max(0, state.endsAtMs - nowMs),
    endsAtMs: state.endsAtMs,
  }
}

export function restoreTimerState(snapshot: RuntimeTimerSnapshot, settings: TimerSettings, nowMs: number): TimerState {
  if (snapshot.status === "running" && snapshot.endsAtMs !== undefined) {
    const restored: TimerState = {
      mode: snapshot.mode,
      status: "running",
      completedWorkSegments: snapshot.completedWorkSegments,
      remainingMs: Math.max(0, snapshot.endsAtMs - nowMs),
      startedAtMs: nowMs,
      endsAtMs: snapshot.endsAtMs,
    }

    return tickTimer(restored, settings, nowMs)
  }

  return {
    mode: snapshot.mode,
    status: snapshot.status,
    completedWorkSegments: snapshot.completedWorkSegments,
    remainingMs: snapshot.remainingMs,
  }
}

function nextBreakMode(completedWorkSegments: number, longBreakInterval: number): TimerMode {
  return completedWorkSegments % longBreakInterval === 0 ? "longBreak" : "shortBreak"
}
