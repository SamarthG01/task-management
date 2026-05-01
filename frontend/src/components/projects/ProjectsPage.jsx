import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsAPI } from '../../api/client'
import { Button, Input, Textarea, Modal, Card, EmptyState, ErrorMessage, PageLoader, Badge } from '../ui'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await projectsAPI.getAll()
      setProjects(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      const res = await projectsAPI.create(form)
      setProjects([res.data, ...projects])
      setShowCreate(false)
      setForm({ name: '', description: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project.')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div style={styles.page} className="animate-fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Projects</h1>
          <p style={styles.subtitle}>{projects.length} project{projects.length !== 1 ? 's' : ''} you're part of</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Project</Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon="◫"
          title="No projects yet"
          description="Create your first project and start collaborating with your team."
          action={<Button onClick={() => setShowCreate(true)}>Create Project</Button>}
        />
      ) : (
        <div style={styles.grid}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Project">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ErrorMessage message={error} />
          <Input
            label="Project Name"
            placeholder="e.g. Website Redesign"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Textarea
            label="Description (optional)"
            placeholder="What is this project about?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function ProjectCard({ project, onClick }) {
  const date = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <Card onClick={onClick} style={cardStyles.card}>
      <div style={cardStyles.top}>
        <div style={cardStyles.icon}>
          {project.name.slice(0, 2).toUpperCase()}
        </div>
        <Badge type="admin" />
      </div>
      <h3 style={cardStyles.name}>{project.name}</h3>
      {project.description && (
        <p style={cardStyles.desc}>{project.description}</p>
      )}
      <p style={cardStyles.date}>Created {date}</p>
    </Card>
  )
}

const styles = {
  page: { padding: '40px 48px', maxWidth: 1440, margin: '0 auto', width: '100%' },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '1.75rem',
    marginBottom: '4px',
  },
  subtitle: { color: 'var(--text-secondary)', fontSize: '0.875rem' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
}

const cardStyles = {
  card: { display: 'flex', flexDirection: 'column', gap: '10px' },
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  icon: {
    width: 44, height: 44,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '0.875rem',
  },
  name: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '1rem',
  },
  desc: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  date: { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' },
}
