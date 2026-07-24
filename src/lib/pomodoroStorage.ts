import type { KeyValueStorage } from "../timer/index.js"

export type { KeyValueStorage }

export type PomodoroTodo = {
  readonly id: string
  readonly text: string
  readonly completed: boolean
  readonly createdAtMs: number
}

export type PomodoroPreferences = {
  readonly soundMuted: boolean
  readonly notificationEnabled: boolean
}

export type CompletionRecord = {
  readonly date: string
  readonly count: number
  readonly minutes: number
}

export const TODOS_STORAGE_KEY = "pomodoro.todos.v1"
export const PREFERENCES_STORAGE_KEY = "pomodoro.preferences.v1"
export const COMPLETION_STORAGE_KEY = "pomodoro.completion.v1"

const DEFAULT_PREFERENCES = {
  soundMuted: false,
  notificationEnabled: false,
} as const satisfies PomodoroPreferences

export function loadTodos(storage: KeyValueStorage): readonly PomodoroTodo[] {
  const raw = storage.getItem(TODOS_STORAGE_KEY)
  if (raw === null) {
    return []
  }

  const parsed = parseJson(raw)
  if (!Array.isArray(parsed)) {
    return []
  }

  const todos: PomodoroTodo[] = []
  for (const item of parsed) {
    const todo = parseTodo(item)
    if (todo !== null) {
      todos.push(todo)
    }
  }

  return todos
}

export function saveTodos(storage: KeyValueStorage, todos: readonly PomodoroTodo[]): void {
  storage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos))
}

export function loadPomodoroPreferences(storage: KeyValueStorage): PomodoroPreferences {
  const raw = storage.getItem(PREFERENCES_STORAGE_KEY)
  if (raw === null) {
    return DEFAULT_PREFERENCES
  }

  const parsed = parseJson(raw)
  if (!isRecord(parsed)) {
    return DEFAULT_PREFERENCES
  }

  return {
    soundMuted: readBoolean(parsed, "soundMuted") ?? DEFAULT_PREFERENCES.soundMuted,
    notificationEnabled: readBoolean(parsed, "notificationEnabled") ?? DEFAULT_PREFERENCES.notificationEnabled,
  }
}

export function savePomodoroPreferences(storage: KeyValueStorage, preferences: PomodoroPreferences): void {
  storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
}

export function loadCompletionRecord(storage: KeyValueStorage, today: string): CompletionRecord {
  const raw = storage.getItem(COMPLETION_STORAGE_KEY)
  if (raw === null) {
    return emptyCompletionRecord(today)
  }

  const parsed = parseJson(raw)
  if (!isRecord(parsed)) {
    return emptyCompletionRecord(today)
  }

  const date = readString(parsed, "date")
  const count = readNumber(parsed, "count")
  const minutes = readNumber(parsed, "minutes")
  if (date !== today || count === undefined || minutes === undefined) {
    return emptyCompletionRecord(today)
  }

  if (!Number.isInteger(count) || count < 0 || !Number.isInteger(minutes) || minutes < 0) {
    return emptyCompletionRecord(today)
  }

  return { date, count, minutes }
}

export function saveCompletionRecord(storage: KeyValueStorage, record: CompletionRecord): void {
  storage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(record))
}

export function addCompletion(record: CompletionRecord, minutes: number): CompletionRecord {
  return {
    date: record.date,
    count: record.count + 1,
    minutes: record.minutes + minutes,
  }
}

function emptyCompletionRecord(date: string): CompletionRecord {
  return { date, count: 0, minutes: 0 }
}

function parseTodo(value: unknown): PomodoroTodo | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readString(value, "id")
  const text = readString(value, "text")
  const completed = readBoolean(value, "completed")
  const createdAtMs = readNumber(value, "createdAtMs")
  if (id === null || text === null || completed === undefined || createdAtMs === undefined) {
    return null
  }

  if (text.trim().length === 0 || !Number.isInteger(createdAtMs) || createdAtMs < 0) {
    return null
  }

  return { id, text, completed, createdAtMs }
}

function parseJson(raw: string): unknown {
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null
    }

    throw error
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(record: Readonly<Record<string, unknown>>, key: string): string | null {
  const value = record[key]
  return typeof value === "string" ? value : null
}

function readBoolean(record: Readonly<Record<string, unknown>>, key: string): boolean | undefined {
  const value = record[key]
  return typeof value === "boolean" ? value : undefined
}

function readNumber(record: Readonly<Record<string, unknown>>, key: string): number | undefined {
  const value = record[key]
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}
