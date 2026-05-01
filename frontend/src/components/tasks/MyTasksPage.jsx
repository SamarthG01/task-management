import React, { useState, useEffect } from 'react'
import { tasksAPI } from '../../api/client'
import { Badge, Card, EmptyState, PageLoader } from '../ui'
import TaskCard from './TaskCard'

const STATUSES = ['todo', 'in_progress', 'done']
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    tasksAPI.getMyTasks()
      .then((res) => setTasks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
  }

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)
  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done')

  if (loading) return <PageLoader />

  return (
    <div style={styles.page} className="animate-fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Tasks</h1>
          <p style={styles.subtitle}>{tasks.length} assigned · {overdue.length} overdue</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={styles.filters}>
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: filter === s ? 'var(--accent)' : 'var(--border)',
              background: filter === s ? 'var(--accent-dim)' : 'transparent',
              color: filter === s ? 'var(--accent)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="✓"
          title={filter === 'all' ? 'No tasks assigned to you' : `No ${STATUS_LABELS[filter]} tasks`}
          description="Tasks assigned to you will appear here."
        />
      ) : (
        <div style={styles.list}>
          {filtered.map((task) => (
            <TaskListRow key={task.id} task={task} onUpdated={handleTaskUpdated} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskListRow({ task, onUpdated }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
  const dueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No due date'

  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
          {task.title}
        </p>
        {task.description && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {task.description}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '0.75rem', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}>
          {isOverdue ? '⚠ ' : ''}{dueDate}
        </span>
        <Badge type={task.priority} />
        <Badge type={task.status} />
      </div>
    </Card>
  )
}

const styles = {
  page: { padding: '40px 48px', maxWidth: 1000, margin: '0 auto', width: '100%' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
  },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem', marginBottom: '4px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '0.875rem' },
  filters: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
}
