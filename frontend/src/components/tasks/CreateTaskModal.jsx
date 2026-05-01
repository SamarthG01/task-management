import React, { useState } from 'react'
import { tasksAPI } from '../../api/client'
import { Button, Input, Textarea, Select, Modal, ErrorMessage } from '../ui'

export default function CreateTaskModal({ isOpen, onClose, projectId, members, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        project_id: projectId,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        assigned_to: form.assigned_to || null,
      }
      const res = await tasksAPI.create(payload)
      onCreated(res.data)
      setForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task" width={520}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <ErrorMessage message={error} />

        <Input
          label="Title"
          name="title"
          placeholder="Task title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <Textarea
          label="Description"
          name="description"
          placeholder="Optional description..."
          value={form.description}
          onChange={handleChange}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Select label="Priority" name="priority" value={form.priority} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>

          <Select label="Status" name="status" value={form.status} onChange={handleChange}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </Select>
        </div>

        <Input
          label="Due Date (optional)"
          type="datetime-local"
          name="due_date"
          value={form.due_date}
          onChange={handleChange}
        />

        <Select label="Assign To (optional)" name="assigned_to" value={form.assigned_to} onChange={handleChange}>
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.email || m.user_id} ({m.role})
            </option>
          ))}
        </Select>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Task</Button>
        </div>
      </form>
    </Modal>
  )
}
