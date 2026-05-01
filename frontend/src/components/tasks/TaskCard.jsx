import React, { useState } from 'react'
import { tasksAPI } from '../../api/client'
import { Badge, Spinner } from '../ui'

const PRIORITY_COLORS = {
  low: 'var(--success)',
  medium: 'var(--warning)',
  high: 'var(--danger)',
}

const NEXT_STATUS = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

const STATUS_ACTIONS = {
  todo: 'Start',
  in_progress: 'Complete',
  done: 'Reopen',
}

export default function TaskCard({ task, isAdmin, onUpdated }) {
  const [updating, setUpdating] = useState(false)

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  const handleAdvanceStatus = async (e) => {
    e.stopPropagation()
    setUpdating(true)
    try {
      const res = await tasksAPI.update(task.id, { status: NEXT_STATUS[task.status] })
      onUpdated(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  const dueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--border-light)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      transition: 'border-color 0.15s',
    }}>
      {/* Priority bar */}
      <div style={{
        height: 2,
        borderRadius: 1,
        background: PRIORITY_COLORS[task.priority] || 'var(--border)',
        marginBottom: '2px',
        opacity: 0.7,
      }} />

      <p style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: '0.875rem',
        lineHeight: 1.3,
      }}>
        {task.title}
      </p>

      {task.description && (
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Badge type={task.priority} />
          {dueDate && (
            <span style={{
              fontSize: '0.7rem',
              color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
              fontWeight: isOverdue ? 600 : 400,
            }}>
              {isOverdue ? '⚠ ' : ''}{dueDate}
            </span>
          )}
        </div>
        <button
          onClick={handleAdvanceStatus}
          disabled={updating}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '3px 10px',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {updating ? <Spinner size={10} /> : STATUS_ACTIONS[task.status]}
        </button>
      </div>
    </div>
  )
}
