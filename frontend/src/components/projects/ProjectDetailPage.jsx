import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsAPI, tasksAPI } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import {
  Button, Input, Textarea, Select, Modal, Card, Badge,
  EmptyState, ErrorMessage, PageLoader, Spinner
} from '../ui'
import TaskCard from '../tasks/TaskCard'
import CreateTaskModal from '../tasks/CreateTaskModal'

const STATUSES = ['todo', 'in_progress', 'done']
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
const STATUS_COLORS = {
  todo: 'var(--info)',
  in_progress: 'var(--warning)',
  done: 'var(--success)',
}

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('board')

  // Modals
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberForm, setMemberForm] = useState({ email: '', role: 'member' })
  const [memberError, setMemberError] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [membersRes] = await Promise.all([
        projectsAPI.getMembers(projectId)
      ])
      const fetchedMembers = membersRes.data
      setMembers(fetchedMembers)

      // Determine if current user is admin
      const me = fetchedMembers.find((m) => m.user_id === user?.id)
      const admin = me?.role === 'admin'
      setIsAdmin(admin)

      if (admin) {
        const tasksRes = await projectsAPI.getTasks(projectId)
        setTasks(tasksRes.data)
      } else {
        const tasksRes = await tasksAPI.getMyTasks()
        setTasks(tasksRes.data.filter((t) => t.project_id === projectId))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [projectId, user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev])
    setShowCreateTask(false)
  }

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setMemberError('')
    setAddingMember(true)
    try {
      await projectsAPI.addMember(projectId, memberForm)
      await fetchData()
      setShowAddMember(false)
      setMemberForm({ email: '', role: 'member' })
    } catch (err) {
      setMemberError(err.response?.data?.detail || 'Failed to add member.')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return
    try {
      await projectsAPI.removeMember(projectId, userId)
      setMembers((prev) => prev.filter((m) => m.user_id !== userId))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove member.')
    }
  }

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s)
    return acc
  }, {})

  if (loading) return <PageLoader />

  return (
    <div style={styles.page} className="animate-fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/projects')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
          >←</button>
          <div>
            <h1 style={styles.title}>Project Board</h1>
            <p style={styles.subtitle}>{tasks.length} task{tasks.length !== 1 ? 's' : ''} · {members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowAddMember(true)}>
                + Add Member
              </Button>
              <Button size="sm" onClick={() => setShowCreateTask(true)}>
                + New Task
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['board', 'members'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {tab === 'board' ? 'Board' : 'Members'}
          </button>
        ))}
      </div>

      {/* Board View */}
      {activeTab === 'board' && (
        <div style={styles.board}>
          {STATUSES.map((status) => (
            <div key={status} style={styles.column}>
              <div style={styles.colHeader}>
                <span style={{ ...styles.colDot, background: STATUS_COLORS[status] }} />
                <span style={styles.colTitle}>{STATUS_LABELS[status]}</span>
                <span style={styles.colCount}>{tasksByStatus[status].length}</span>
              </div>
              <div style={styles.colBody}>
                {tasksByStatus[status].length === 0 ? (
                  <div style={styles.emptyCol}>No tasks</div>
                ) : (
                  tasksByStatus[status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isAdmin={isAdmin}
                      onUpdated={handleTaskUpdated}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members View */}
      {activeTab === 'members' && (
        <div style={{ maxWidth: 640 }}>
          {members.length === 0 ? (
            <EmptyState icon="👥" title="No members yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map((member) => (
                <MemberRow
                  key={member.user_id}
                  member={member}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onRemove={() => handleRemoveMember(member.user_id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projectId={projectId}
        members={members}
        onCreated={handleTaskCreated}
      />

      {/* Add Member Modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member">
        <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ErrorMessage message={memberError} />
          <Input
            label="User Email"
            type="email"
            placeholder="teammate@example.com"
            value={memberForm.email}
            onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
            required
          />
          <Select
            label="Role"
            value={memberForm.role}
            onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </Select>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" type="button" onClick={() => setShowAddMember(false)}>Cancel</Button>
            <Button type="submit" loading={addingMember}>Add Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function MemberRow({ member, isAdmin, currentUserId, onRemove }) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: member.role === 'admin' ? 'var(--accent-dim)' : 'var(--bg-elevated)',
          border: `1px solid ${member.role === 'admin' ? 'var(--accent)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontFamily: 'var(--font-display)', fontWeight: 700,
          color: member.role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)',
        }}>
          {member.user_id.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{member.user_id}</p>
          <Badge type={member.role} />
        </div>
      </div>
      {isAdmin && member.user_id !== currentUserId && (
        <Button variant="ghost" size="sm" onClick={onRemove} style={{ color: 'var(--danger)' }}>
          Remove
        </Button>
      )}
    </Card>
  )
}

const styles = {
  page: { padding: '40px 48px', height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1440, margin: '0 auto', width: '100%' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
  },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' },
  tabs: { display: 'flex', gap: '0', borderBottom: '1px solid var(--border)', marginBottom: '24px' },
  tab: {
    padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem',
    transition: 'color 0.15s',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
  },
  column: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  colHeader: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  colDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  colTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', flex: 1 },
  colCount: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-muted)',
    borderRadius: '20px',
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  colBody: { padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' },
  emptyCol: { textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.8rem' },
}
