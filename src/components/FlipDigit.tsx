import { useEffect, useRef, useState } from "react"

type FlipPhase = "idle" | "top" | "bottom"

type FlipDigitProps = {
  readonly digit: number
}

/**
 * 机械翻页数字组件。
 *
 * 静态显示分上下半区，各自用 height: 200% + align-items 裁剪。
 * 翻页时：
 *   1. 上半翻页卡片带走旧数字上半部分（300ms）
 *   2. 静态显示下半区更新为新数字
 *   3. 下半翻页卡片翻入新数字下半部分（300ms）
 *
 * 上半区静态始终保持最新数字（动画期间被翻页卡片遮挡），
 * 下半区静态在 Phase 1 保持旧数字，Phase 2 切换到新数字。
 */
export function FlipDigit({ digit }: FlipDigitProps) {
  const [stableDigit, setStableDigit] = useState(digit)
  const [flipPhase, setFlipPhase] = useState<FlipPhase>("idle")
  const prevDigitRef = useRef(digit)
  const topTimerRef = useRef<number>()
  const bottomTimerRef = useRef<number>()

  useEffect(() => {
    if (digit === prevDigitRef.current) return

    const oldDigit = prevDigitRef.current
    prevDigitRef.current = digit

    if (topTimerRef.current !== undefined) clearTimeout(topTimerRef.current)
    if (bottomTimerRef.current !== undefined) clearTimeout(bottomTimerRef.current)

    // Phase 1: 上半翻页卡片带走旧数字
    setFlipPhase("top")

    topTimerRef.current = window.setTimeout(() => {
      // Phase 1 结束：下半区更新为新数字，下半翻页卡片翻入
      setStableDigit(digit)
      setFlipPhase("bottom")
      topTimerRef.current = undefined
    }, 300)

    bottomTimerRef.current = window.setTimeout(() => {
      setFlipPhase("idle")
      bottomTimerRef.current = undefined
    }, 600)

    return () => {
      if (topTimerRef.current !== undefined) clearTimeout(topTimerRef.current)
      if (bottomTimerRef.current !== undefined) clearTimeout(bottomTimerRef.current)
    }
  }, [digit])

  return (
    <div className="flip-digit" aria-hidden="true">
      {/* 静态上半区：始终显示最新数字（动画期间被翻页卡片遮挡） */}
      <div className="flip-digit__upper">
        <span className="flip-digit__num">{digit}</span>
      </div>

      {/* 静态下半区：Phase 1 保持旧数字，之后为新数字 */}
      <div className="flip-digit__lower">
        <span className="flip-digit__num">{stableDigit}</span>
      </div>

      {/* 上半翻页卡片：旧数字上半部分翻走 */}
      {flipPhase === "top" && (
        <div className="flip-digit__top-flip">
          <span className="flip-digit__num">{prevDigitRef.current}</span>
        </div>
      )}

      {/* 下半翻页卡片：新数字下半部分翻入 */}
      {flipPhase === "bottom" && (
        <div className="flip-digit__bottom-flip">
          <span className="flip-digit__num">{digit}</span>
        </div>
      )}
    </div>
  )
}
