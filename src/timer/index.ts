export { DEFAULT_TIMER_SETTINGS, durationMsForMode, sanitizeTimerSettings } from "./settings.js"
export {
  applyTimerSettings,
  completeCurrentSegment,
  createInitialTimerState,
  pauseTimer,
  resetTimer,
  restoreTimerState,
  skipCurrentSegment,
  snapshotTimerState,
  startTimer,
  tickTimer,
} from "./state.js"
export {
  clearRuntimeTimerState,
  loadRuntimeTimerState,
  loadTimerSettings,
  RUNTIME_STORAGE_KEY,
  saveRuntimeTimerState,
  saveTimerSettings,
  SETTINGS_STORAGE_KEY,
} from "./storage.js"
export type { KeyValueStorage, RuntimeTimerSnapshot, TimerMode, TimerSettings, TimerState, TimerStatus } from "./types.js"
