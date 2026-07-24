import type { CompletionRecord } from "../lib/pomodoroStorage.js"

type CompletionStatsProps = {
  readonly record: CompletionRecord
}

export function CompletionStats({ record }: CompletionStatsProps) {
  return (
    <section className="stats-panel surface-panel" aria-labelledby="completion-title">
      <span className="eyebrow">today</span>
      <h2 id="completion-title">今日完成</h2>
      <div className="stats-grid" aria-label="今日完成记录">
        <div>
          <strong data-testid="completion-count">{record.count}</strong>
          <span>轮专注</span>
        </div>
        <div>
          <strong data-testid="completion-minutes">{record.minutes}</strong>
          <span>分钟</span>
        </div>
      </div>
    </section>
  )
}
