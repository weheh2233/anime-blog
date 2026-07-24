import type { TimerMode, TimerStatus } from "../timer/index.js"

type TimerPanelProps = {
  readonly mode: TimerMode
  readonly status: TimerStatus
  readonly timeText: string
  readonly soundMuted: boolean
  readonly notificationEnabled: boolean
  readonly banner: string | null
  readonly onDismissBanner: () => void
  readonly onNotificationToggle: () => void
  readonly onReset: () => void
  readonly onSkip: () => void
  readonly onSoundToggle: () => void
  readonly onStartPause: () => void
}

const MODE_LABELS = {
  work: "专注",
  shortBreak: "短休息",
  longBreak: "长休息",
} as const satisfies Record<TimerMode, string>

const STATUS_LABELS = {
  idle: "待开始",
  running: "运行中",
  paused: "已暂停",
} as const satisfies Record<TimerStatus, string>

export function TimerPanel({
  mode,
  status,
  timeText,
  soundMuted,
  notificationEnabled,
  banner,
  onDismissBanner,
  onNotificationToggle,
  onReset,
  onSkip,
  onSoundToggle,
  onStartPause,
}: TimerPanelProps) {
  return (
    <section className="timer-card" aria-labelledby="timer-title">
      <div className="timer-meta-row">
        <span className="mode-label" data-testid="mode-label" data-mode={mode}>
          {MODE_LABELS[mode]}
        </span>
        <span className="status-pill" data-testid="status-pill" data-status={status}>
          {STATUS_LABELS[status]}
        </span>
      </div>
      <h2 id="timer-title" className="sr-only">
        番茄钟计时器
      </h2>
      <output className="timer-display" aria-live="polite" aria-label={`${MODE_LABELS[mode]}剩余时间`}>
        {timeText}
      </output>
      <div className="control-row" aria-label="计时器控制">
        <button type="button" className="primary-button" onClick={onStartPause} aria-keyshortcuts="Space">
          {status === "running" ? "暂停" : "开始"}
        </button>
        <button type="button" onClick={onReset} aria-keyshortcuts="R">
          重置
        </button>
        <button type="button" onClick={onSkip} aria-keyshortcuts="N">
          跳过
        </button>
      </div>
      <div className="preference-row" aria-label="声音和通知设置">
        <button type="button" className="toggle-button" aria-pressed={!soundMuted} onClick={onSoundToggle}>
          声音：{soundMuted ? "静音" : "开启"}
        </button>
        <button type="button" className="toggle-button" aria-pressed={notificationEnabled} onClick={onNotificationToggle}>
          通知：{notificationEnabled ? "已启用" : "启用"}
        </button>
      </div>
      {banner === null ? null : (
        <div className="fallback-banner" role="status">
          <span>{banner}</span>
          <button type="button" className="text-button" onClick={onDismissBanner}>
            知道了
          </button>
        </div>
      )}
    </section>
  )
}
