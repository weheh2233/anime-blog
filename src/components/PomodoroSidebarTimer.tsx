import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createBrowserStorage } from "../lib/browserStorage.js"
import {
  loadRuntimeTimerState,
  loadTimerSettings,
  saveRuntimeTimerState,
  startTimer,
  pauseTimer,
  tickTimer,
} from "../timer/index.js"
import type { TimerMode, TimerSettings, TimerState } from "../timer/index.js"
import { FlipDigit } from "./FlipDigit.js"

const MODE_LABELS: Record<TimerMode, string> = {
  work: "专注",
  shortBreak: "短休息",
  longBreak: "长休息",
}

function formatRemainingMs(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1_000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

/**
 * 侧边栏番茄钟计时器。
 *
 * 通过 sessionStorage 与完整番茄钟页面共享计时状态：
 *   - 挂载时从 sessionStorage 加载
 *   - 运行中每 250ms 本地 tick（流畅倒计时）
 *   - 每 3 秒从 storage 重新读取，检测外部状态变更
 *   - 用户操作（开始/暂停）写入 storage
 */
export function PomodoroSidebarTimer() {
  const sessionStorage = useMemo(() => createBrowserStorage(
    typeof window === "undefined" ? null : window.sessionStorage,
  ), [])

  const localStorage_ = useMemo(() => createBrowserStorage(
    typeof window === "undefined" ? null : window.localStorage,
  ), [])

  // 从 storage 加载初始状态
  const [settings, setSettings] = useState<TimerSettings>(() =>
    loadTimerSettings(localStorage_),
  )
  const [timerState, setTimerState] = useState<TimerState>(() =>
    loadRuntimeTimerState(sessionStorage, loadTimerSettings(localStorage_), Date.now()),
  )
  const [nowMs, setNowMs] = useState(Date.now())

  const settingsRef = useRef(settings)
  settingsRef.current = settings

  // 运行中：每 250ms tick
  useEffect(() => {
    if (timerState.status !== "running") return

    const intervalId = window.setInterval(() => {
      const currentNowMs = Date.now()
      setNowMs(currentNowMs)
      setTimerState((prev) => {
        const next = tickTimer(prev, settingsRef.current, currentNowMs)
        return next
      })
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [timerState.status])

  // 将本地计时状态写入 storage（仅在运行或暂停时）
  useEffect(() => {
    if (timerState.status !== "idle") {
      saveRuntimeTimerState(sessionStorage, timerState, Date.now())
    }
  }, [sessionStorage, timerState])

  // 定期从 storage 同步外部状态变更（完整页面的 start/pause/reset）
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const syncedSettings = loadTimerSettings(localStorage_)
      setSettings(syncedSettings)

      setTimerState((prev) => {
        const synced = loadRuntimeTimerState(
          sessionStorage,
          syncedSettings,
          Date.now(),
        )

        // 仅在 status / mode 发生变化时同步，避免本地 tick 被 storage 覆盖
        if (synced.status !== prev.status || synced.mode !== prev.mode) {
          return synced
        }
        return prev
      })
    }, 3_000)

    return () => window.clearInterval(intervalId)
  }, [localStorage_, sessionStorage])

  // 计算实际剩余毫秒数
  const remainingMs: number =
    timerState.status === "running" && timerState.endsAtMs !== undefined
      ? Math.max(0, timerState.endsAtMs - nowMs)
      : timerState.remainingMs

  // 格式化："MM:SS"
  const timeStr = formatRemainingMs(remainingMs)

  // 提取四个独立数字
  const digits = [
    Number(timeStr[0]),
    Number(timeStr[1]),
    Number(timeStr[3]),
    Number(timeStr[4]),
  ]

  const handleStartPause = useCallback(() => {
    const currentNowMs = Date.now()
    setTimerState((prev) => {
      const next =
        prev.status === "running"
          ? pauseTimer(prev, currentNowMs)
          : startTimer(prev, currentNowMs)
      saveRuntimeTimerState(sessionStorage, next, currentNowMs)
      return next
    })
    setNowMs(Date.now())
  }, [sessionStorage])

  const isRunning = timerState.status === "running"
  const isIdle = timerState.status === "idle"

  return (
    <div className="pomodoro-widget">
      <a
        className="pomodoro-widget__main"
        href="/pomodoro"
        aria-label="打开番茄钟完整页面"
      >
        <span className="pomodoro-sidebar-card__eyebrow">Focus timer</span>
        <div className="pomodoro-widget__content">
          <h3>番茄钟</h3>
          <div className="flip-clock">
            <FlipDigit key={0} digit={digits[0]} />
            <FlipDigit key={1} digit={digits[1]} />
            <span className="flip-clock__sep">:</span>
            <FlipDigit key={2} digit={digits[2]} />
            <FlipDigit key={3} digit={digits[3]} />
          </div>
          {isIdle && (
            <span className="pomodoro-widget__hint">
              {MODE_LABELS[timerState.mode]} · {settings.workMinutes} 分钟
            </span>
          )}
        </div>
      </a>

      <div className="pomodoro-widget__controls">
        <button
          type="button"
          className="primary-button"
          onClick={(e) => {
            e.preventDefault()
            handleStartPause()
          }}
        >
          {isRunning ? "暂停" : isIdle ? "开始" : "继续"}
        </button>
      </div>
    </div>
  )
}

export default PomodoroSidebarTimer
