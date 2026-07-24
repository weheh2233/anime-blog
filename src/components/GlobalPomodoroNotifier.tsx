import { useEffect, useRef, useState } from "react"
import { createBrowserStorage } from "../lib/browserStorage.js"
import { loadPomodoroPreferences } from "../lib/pomodoroStorage.js"
import {
  loadRuntimeTimerState,
  loadTimerSettings,
  RUNTIME_STORAGE_KEY,
  saveRuntimeTimerState,
} from "../timer/index.js"
import type { TimerState } from "../timer/index.js"
import { playCompletionChime, sendDesktopNotification } from "../lib/notifications.js"
import "../styles/pomodoro-global.css"

type AlertKind = "workCompleted" | "breakCompleted"

type AlertMessage = {
  readonly title: string
  readonly body: string
}

const ALERT_CLAIM_KEY = "pomodoro.global-alert.v1"

const ALERT_MESSAGES: Record<AlertKind, AlertMessage> = {
  workCompleted: {
    title: "专注结束",
    body: "休息已自动开始。",
  },
  breakCompleted: {
    title: "休息结束",
    body: "下一轮专注已准备好，点击开始继续。",
  },
}

export function GlobalPomodoroNotifier() {
  const [alert, setAlert] = useState<AlertMessage | null>(null)
  const lastStateRef = useRef<Pick<TimerState, "mode" | "status" | "completedWorkSegments"> | null>(null)
  const clearAlertTimerRef = useRef<number>()

  useEffect(() => {
    const localStorageArea = createBrowserStorage(window.localStorage)
    const sessionStorageArea = createBrowserStorage(window.sessionStorage)

    const publishAlert = (kind: AlertKind, completedWorkSegments: number) => {
      const signature = `${kind}:${completedWorkSegments}`
      if (sessionStorageArea.getItem(ALERT_CLAIM_KEY) === signature) return

      sessionStorageArea.setItem(ALERT_CLAIM_KEY, signature)
      const message = ALERT_MESSAGES[kind]
      const preferences = loadPomodoroPreferences(localStorageArea)

      if (!preferences.soundMuted) {
        playCompletionChime()
      }

      if (preferences.notificationEnabled) {
        sendDesktopNotification(message.title, message.body)
      }

      setAlert(message)
      if (clearAlertTimerRef.current !== undefined) {
        window.clearTimeout(clearAlertTimerRef.current)
      }
      clearAlertTimerRef.current = window.setTimeout(() => {
        setAlert(null)
        clearAlertTimerRef.current = undefined
      }, 5_000)
    }

    const readState = (): Pick<TimerState, "mode" | "status" | "completedWorkSegments"> => {
      const settings = loadTimerSettings(localStorageArea)
      const state = loadRuntimeTimerState(sessionStorageArea, settings, Date.now())
      return {
        mode: state.mode,
        status: state.status,
        completedWorkSegments: state.completedWorkSegments,
      }
    }

    const sync = () => {
      if (sessionStorageArea.getItem(RUNTIME_STORAGE_KEY) === null) return

      const nextState = readState()
      if (nextState.status === "running") {
        const settings = loadTimerSettings(localStorageArea)
        const runningState = loadRuntimeTimerState(sessionStorageArea, settings, Date.now())
        saveRuntimeTimerState(sessionStorageArea, runningState, Date.now())
      }
      const previousState = lastStateRef.current
      lastStateRef.current = nextState

      if (previousState === null || window.location.pathname.replace(/\/+$/, "") === "/pomodoro") {
        return
      }

      if (nextState.completedWorkSegments > previousState.completedWorkSegments) {
        publishAlert("workCompleted", nextState.completedWorkSegments)
        return
      }

      if (nextState.mode !== previousState.mode && nextState.mode === "work") {
        publishAlert("breakCompleted", nextState.completedWorkSegments)
      }
    }

    sync()
    const intervalId = window.setInterval(sync, 250)

    return () => {
      window.clearInterval(intervalId)
      if (clearAlertTimerRef.current !== undefined) {
        window.clearTimeout(clearAlertTimerRef.current)
      }
    }
  }, [])

  if (alert === null) return null

  return (
    <div className="pomodoro-global-alert" role="status" aria-live="assertive">
      <strong>{alert.title}</strong>
      <span>{alert.body}</span>
    </div>
  )
}

export default GlobalPomodoroNotifier
