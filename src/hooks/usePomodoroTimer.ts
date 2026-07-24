import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  applyTimerSettings,
  loadRuntimeTimerState,
  loadTimerSettings,
  pauseTimer,
  resetTimer,
  saveRuntimeTimerState,
  saveTimerSettings,
  sanitizeTimerSettings,
  skipCurrentSegment,
  startTimer,
  tickTimer,
} from "../timer/index.js"
import type { KeyValueStorage, TimerMode, TimerSettings, TimerState, TimerStatus } from "../timer/index.js"

export type PomodoroTimerEvent =
  | { readonly kind: "workCompleted"; readonly workMinutes: number }
  | { readonly kind: "modeChanged"; readonly from: TimerMode; readonly to: TimerMode; readonly status: TimerStatus }

export type PomodoroTimerEnvironment = {
  readonly localStorage: KeyValueStorage
  readonly sessionStorage: KeyValueStorage
  readonly onEvent: (event: PomodoroTimerEvent) => void
}

export type PomodoroTimerModel = {
  readonly settings: TimerSettings
  readonly state: TimerState
  readonly displayRemainingMs: number
  readonly applySettings: (settings: TimerSettings) => void
  readonly reset: () => void
  readonly skip: () => void
  readonly startPause: () => void
}

export function usePomodoroTimer(environment: PomodoroTimerEnvironment): PomodoroTimerModel {
  const [initial] = useState(() => {
    const settings = loadTimerSettings(environment.localStorage)
    return {
      settings,
      state: loadRuntimeTimerState(environment.sessionStorage, settings, Date.now()),
    }
  })
  const [settings, setSettings] = useState<TimerSettings>(initial.settings)
  const [timerState, setTimerState] = useState<TimerState>(initial.state)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const settingsRef = useRef(settings)
  const completedWorkSegmentsRef = useRef(timerState.completedWorkSegments)
  const modeRef = useRef(timerState.mode)

  useEffect(() => {
    settingsRef.current = settings
    saveTimerSettings(environment.localStorage, settings)
  }, [environment.localStorage, settings])

  useEffect(() => {
    saveRuntimeTimerState(environment.sessionStorage, timerState, Date.now())
  }, [environment.sessionStorage, timerState])

  useEffect(() => {
    if (timerState.status !== "running") {
      return
    }

    const intervalId = window.setInterval(() => {
      const currentNowMs = Date.now()
      setNowMs(currentNowMs)
      setTimerState((current) => tickTimer(current, settingsRef.current, currentNowMs))
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [timerState.status])

  useEffect(() => {
    const completedDelta = timerState.completedWorkSegments - completedWorkSegmentsRef.current
    if (completedDelta > 0) {
      for (let index = 0; index < completedDelta; index += 1) {
        environment.onEvent({ kind: "workCompleted", workMinutes: settingsRef.current.workMinutes })
      }
    }

    completedWorkSegmentsRef.current = timerState.completedWorkSegments
  }, [environment, timerState.completedWorkSegments])

  useEffect(() => {
    const previousMode = modeRef.current
    if (timerState.mode !== previousMode) {
      environment.onEvent({ kind: "modeChanged", from: previousMode, to: timerState.mode, status: timerState.status })
    }

    modeRef.current = timerState.mode
  }, [environment, timerState.mode, timerState.status])

  const displayRemainingMs = useMemo(() => {
    if (timerState.status === "running" && timerState.endsAtMs !== undefined) {
      return Math.max(0, timerState.endsAtMs - nowMs)
    }

    return timerState.remainingMs
  }, [nowMs, timerState])

  const applySettings = useCallback((nextSettings: TimerSettings) => {
    const sanitized = sanitizeTimerSettings(nextSettings)
    setSettings(sanitized)
    setTimerState((current) => applyTimerSettings(current, sanitized))
    setNowMs(Date.now())
  }, [])

  const reset = useCallback(() => {
    setTimerState((current) => resetTimer(current, settingsRef.current))
    setNowMs(Date.now())
  }, [])

  const skip = useCallback(() => {
    const currentNowMs = Date.now()
    setTimerState((current) => skipCurrentSegment(current, settingsRef.current, currentNowMs))
    setNowMs(currentNowMs)
  }, [])

  const startPause = useCallback(() => {
    const currentNowMs = Date.now()
    setTimerState((current) => (current.status === "running" ? pauseTimer(current, currentNowMs) : startTimer(current, currentNowMs)))
    setNowMs(currentNowMs)
  }, [])

  return {
    settings,
    state: timerState,
    displayRemainingMs,
    applySettings,
    reset,
    skip,
    startPause,
  }
}
