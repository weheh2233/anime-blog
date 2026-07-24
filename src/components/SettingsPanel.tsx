import { useEffect, useState } from "react"
import type { TimerSettings } from "../timer/index.js"

type SettingsPanelProps = {
  readonly open: boolean
  readonly settings: TimerSettings
  readonly onApply: (settings: TimerSettings) => void
  readonly onToggle: () => void
}

export function SettingsPanel({ open, settings, onApply, onToggle }: SettingsPanelProps) {
  const [draft, setDraft] = useState(settings)

  useEffect(() => {
    if (open) setDraft(settings)
  }, [open, settings])

  return (
    <div className="settings-anchor">
      <button
        type="button"
        className="floating-settings-button"
        aria-label="打开计时设置"
        aria-expanded={open}
        aria-controls="settings-panel"
        onClick={onToggle}
      >
        <span aria-hidden="true" className="floating-settings-button__icon">
          ⚙
        </span>
      </button>

      {open ? (
        <form
          id="settings-panel"
          className="settings-popover surface-panel"
          onSubmit={(event) => {
            event.preventDefault()
            onApply(draft)
          }}
        >
          <div className="panel-heading-row">
            <div>
              <span className="eyebrow">settings</span>
              <h2>计时设置</h2>
            </div>
            <button type="button" className="text-button" onClick={onToggle}>
              关闭
            </button>
          </div>
          <NumberField
            id="work-minutes"
            label="专注分钟"
            min={1}
            max={90}
            value={draft.workMinutes}
            onChange={(value) => setDraft((current) => ({ ...current, workMinutes: readNumber(value, current.workMinutes) }))}
          />
          <NumberField
            id="short-break-minutes"
            label="短休息分钟"
            min={1}
            max={30}
            value={draft.shortBreakMinutes}
            onChange={(value) => setDraft((current) => ({ ...current, shortBreakMinutes: readNumber(value, current.shortBreakMinutes) }))}
          />
          <NumberField
            id="long-break-minutes"
            label="长休息分钟"
            min={1}
            max={60}
            value={draft.longBreakMinutes}
            onChange={(value) => setDraft((current) => ({ ...current, longBreakMinutes: readNumber(value, current.longBreakMinutes) }))}
          />
          <NumberField
            id="long-break-interval"
            label="长休息间隔"
            min={2}
            max={8}
            value={draft.longBreakInterval}
            onChange={(value) => setDraft((current) => ({ ...current, longBreakInterval: readNumber(value, current.longBreakInterval) }))}
          />
          <button type="submit" className="primary-button">
            应用设置
          </button>
        </form>
      ) : null}
    </div>
  )
}

type NumberFieldProps = {
  readonly id: string
  readonly label: string
  readonly min: number
  readonly max: number
  readonly value: number
  readonly onChange: (value: string) => void
}

function NumberField({ id, label, min, max, value, onChange }: NumberFieldProps) {
  return (
    <label className="settings-field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} type="number" min={min} max={max} step={1} value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  )
}

function readNumber(value: string, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
