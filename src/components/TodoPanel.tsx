import type { PomodoroTodo } from "../lib/pomodoroStorage.js"

type TodoPanelProps = {
  readonly todos: readonly PomodoroTodo[]
  readonly todoText: string
  readonly onTodoTextChange: (value: string) => void
  readonly onAddTodo: () => void
  readonly onToggleTodo: (id: string) => void
  readonly onDeleteTodo: (id: string) => void
}

export function TodoPanel({ todos, todoText, onTodoTextChange, onAddTodo, onToggleTodo, onDeleteTodo }: TodoPanelProps) {
  const remainingCount = todos.filter((todo) => !todo.completed).length

  return (
    <section className="todo-panel surface-panel" aria-labelledby="todo-title">
      <div className="panel-heading-row">
        <div>
          <span className="eyebrow">todo</span>
          <h2 id="todo-title">专注待办</h2>
        </div>
        <span className="count-pill" aria-label={`剩余 ${remainingCount} 项`}>
          {remainingCount} open
        </span>
      </div>

      <form
        className="todo-form"
        onSubmit={(event) => {
          event.preventDefault()
          onAddTodo()
        }}
      >
        <label htmlFor="todo-input">新增待办</label>
        <div className="todo-entry-row">
          <input
            id="todo-input"
            type="text"
            value={todoText}
            maxLength={80}
            onChange={(event) => onTodoTextChange(event.currentTarget.value)}
            placeholder="写下下一件事"
          />
          <button type="submit">添加</button>
        </div>
      </form>

      {todos.length === 0 ? (
        <p className="empty-state">当前没有待办。</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.completed ? "todo-item is-complete" : "todo-item"}>
              <label>
                <input type="checkbox" checked={todo.completed} onChange={() => onToggleTodo(todo.id)} />
                <span>{todo.text}</span>
              </label>
              <button type="button" className="text-button" onClick={() => onDeleteTodo(todo.id)} aria-label={`删除待办：${todo.text}`}>
                删除
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
