import { useCallback, useEffect, useMemo, useState } from "react"
import { usePomodoroTimer } from "../hooks/usePomodoroTimer.js"
import type { PomodoroTimerEvent } from "../hooks/usePomodoroTimer.js"
import { createBrowserStorage } from "../lib/browserStorage.js"
import {
  addCompletion,
  loadCompletionRecord,
  loadPomodoroPreferences,
  loadTodos,
  saveCompletionRecord,
  savePomodoroPreferences,
  saveTodos,
} from "../lib/pomodoroStorage.js"
import type { PomodoroPreferences, PomodoroTodo } from "../lib/pomodoroStorage.js"
import { playCompletionChime, requestDesktopNotifications, sendDesktopNotification } from "../lib/notifications.js"
import { CompletionStats } from "./CompletionStats.js"
import { SettingsPanel } from "./SettingsPanel.js"
import { TimerPanel } from "./TimerPanel.js"
import { TodoPanel } from "./TodoPanel.js"

export function PomodoroTimer() {
  const [localStorageArea] = useState(() => createBrowserStorage(typeof window === "undefined" ? null : window.localStorage))
  const [sessionStorageArea] = useState(() => createBrowserStorage(typeof window === "undefined" ? null : window.sessionStorage))
  const [today] = useState(() => formatLocalDate(new Date()))
  const [preferences, setPreferences] = useState<PomodoroPreferences>(() => loadPomodoroPreferences(localStorageArea))
  const [completion, setCompletion] = useState(() => loadCompletionRecord(localStorageArea, today))
  const [todos, setTodos] = useState<readonly PomodoroTodo[]>(() => loadTodos(localStorageArea))
  const [todoText, setTodoText] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  const publishNotification = useCallback(
    (title: string, body: string) => {
      if (!preferences.notificationEnabled) return

      const result = sendDesktopNotification(title, body)
      if (result.kind === "denied") setBanner("桌面通知未开启，已改用页面内提醒。")
      if (result.kind === "unavailable") setBanner("当前浏览器不支持桌面通知，已改用页面内提醒。")
    },
    [preferences.notificationEnabled],
  )

  const handleTimerEvent = useCallback(
    (event: PomodoroTimerEvent) => {
      if (event.kind === "workCompleted") {
        setCompletion((current) => addCompletion(current, event.workMinutes))
        if (!preferences.soundMuted && !playCompletionChime()) setBanner("提示音不可用，计时提醒仍会显示在页面内。")
        return
      }

      if (event.to === "work") {
        setBanner("休息结束，下一轮专注已暂停。")
        publishNotification("休息结束", "下一轮专注已准备好，点击开始继续。")
        return
      }

      setBanner("专注结束，休息已自动开始。")
      publishNotification("专注结束", "休息已自动开始。")
    },
    [preferences.soundMuted, publishNotification],
  )

  const timerEnvironment = useMemo(
    () => ({ localStorage: localStorageArea, sessionStorage: sessionStorageArea, onEvent: handleTimerEvent }),
    [handleTimerEvent, localStorageArea, sessionStorageArea],
  )
  const timer = usePomodoroTimer(timerEnvironment)

  useEffect(() => saveTodos(localStorageArea, todos), [localStorageArea, todos])
  useEffect(() => savePomodoroPreferences(localStorageArea, preferences), [localStorageArea, preferences])
  useEffect(() => saveCompletionRecord(localStorageArea, completion), [completion, localStorageArea])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreShortcut(event.target)) return

      if (event.key === " " || event.code === "Space") {
        event.preventDefault()
        timer.startPause()
        return
      }

      const key = event.key.toLowerCase()
      if (key === "r") timer.reset()
      if (key === "n") timer.skip()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [timer])

  const requestNotifications = useCallback(async () => {
    if (preferences.notificationEnabled) {
      setPreferences((current) => ({ ...current, notificationEnabled: false }))
      return
    }

    const result = await requestDesktopNotifications()
    if (result.kind === "granted") {
      setPreferences((current) => ({ ...current, notificationEnabled: true }))
      setBanner("桌面通知已启用。")
      return
    }

    setPreferences((current) => ({ ...current, notificationEnabled: false }))
    setBanner(result.kind === "denied" ? "桌面通知被拒绝，已改用页面内提醒。" : "当前浏览器不支持桌面通知。")
  }, [preferences.notificationEnabled])

  const addTodo = useCallback(() => {
    const text = todoText.trim()
    if (text.length === 0) {
      setBanner("待办内容不能为空。")
      return
    }

    setTodos((current) => [{ id: createTodoId(), text, completed: false, createdAtMs: Date.now() }, ...current])
    setTodoText("")
  }, [todoText])

  return (
    <main className="app-shell" aria-labelledby="page-title">
      <section id="pomodoro-full-page" className="pomodoro-layout" aria-label="番茄钟完整页面">
        <div className="background-slot" aria-label="番茄钟背景">
          <div className="background-slot__layers" aria-hidden="true">
            <img className="background-slot__image" src="/pomodoro-bg/bg.png" alt="" />
            <div className="background-slot__field" />
            <div className="background-slot__grid" />
            <div className="background-slot__vignette" />
          </div>
          <div className="background-slot__note">
            <span className="eyebrow">background</span>
            <p>可以把自己的横版背景图替换到 public/pomodoro-bg/bg.png，计时面板会保持可读。</p>
          </div>
        </div>

        <article className="rain-glass-panel rain-glass-panel--full-page pomodoro-console" aria-label="番茄钟主控制面板">
          <div className="rain-glass-panel__layers" aria-hidden="true">
            <div className="rain-glass-panel__rim" />
            <div className="rain-glass-panel__sheen" />
            <div className="rain-glass-panel__droplets rain-glass-panel__droplets--static" />
            <div className="rain-glass-panel__droplets rain-glass-panel__droplets--animated rain-glass-panel__droplets--layer-a" />
            <div className="rain-glass-panel__droplets rain-glass-panel__droplets--animated rain-glass-panel__droplets--layer-b" />
          </div>

          <header className="panel-header console-header">
            <div>
              <span className="eyebrow">focus room</span>
              <h1 id="page-title">番茄钟</h1>
            </div>
            <SettingsPanel open={settingsOpen} settings={timer.settings} onApply={timer.applySettings} onToggle={() => setSettingsOpen((open) => !open)} />
          </header>

          <TimerPanel
            mode={timer.state.mode}
            status={timer.state.status}
            timeText={formatRemainingMs(timer.displayRemainingMs)}
            soundMuted={preferences.soundMuted}
            notificationEnabled={preferences.notificationEnabled}
            banner={banner}
            onDismissBanner={() => setBanner(null)}
            onNotificationToggle={() => {
              void requestNotifications()
            }}
            onReset={timer.reset}
            onSkip={timer.skip}
            onSoundToggle={() => setPreferences((current) => ({ ...current, soundMuted: !current.soundMuted }))}
            onStartPause={timer.startPause}
          />
        </article>
      </section>

      <section className="side-grid" aria-label="待办与今日记录">
        <TodoPanel
          todos={todos}
          todoText={todoText}
          onTodoTextChange={setTodoText}
          onAddTodo={addTodo}
          onToggleTodo={(id) => setTodos((current) => current.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))}
          onDeleteTodo={(id) => setTodos((current) => current.filter((todo) => todo.id !== id))}
        />
        <CompletionStats record={completion} />
      </section>
    </main>
  )
}

function formatRemainingMs(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1_000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function shouldIgnoreShortcut(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.matches("input, textarea, select, button")
}

function createTodoId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
