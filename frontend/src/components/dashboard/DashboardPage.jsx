import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsAPI } from '../../api/client'
import { Card, EmptyState, PageLoader, Spinner } from '../ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const STATUS_COLORS = {
  todo: '#005bc0',
  in_progress: '#f59e0b',
  done: '#006947',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '8px 12px',
      fontSize: '0.8rem',
      color: 'var(--text-primary)',
    }}>
      <p style={{ fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill || p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [dashData, setDashData] = useState(null)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingDash, setLoadingDash] = useState(false)

  // 1. Fetch Projects
  useEffect(() => {
    projectsAPI.getAll()
      .then((res) => {
        setProjects(res.data)
        if (res.data.length > 0) {
          setSelectedProject(res.data[0])
        }
      })
      .catch(console.error)
      .finally(() => setLoadingProjects(false))
  }, [])

  // 2. Fetch Tasks & Calculate Stats
  useEffect(() => {
    if (!selectedProject) return
    setLoadingDash(true)

    // We use getTasks because the backend now sends 'assignee_email' with every task
    projectsAPI.getTasks(selectedProject.id)
      .then((res) => {
        const tasks = res.data;
        const stats = {
          total_tasks: tasks.length,
          tasks_by_status: { todo: 0, in_progress: 0, done: 0 },
          tasks_per_user: {},
          overdue_tasks: 0
        };

        tasks.forEach(task => {
          // Count by Status
          const status = task.status ? task.status.toLowerCase() : 'todo';
          if (stats.tasks_by_status[status] !== undefined) {
            stats.tasks_by_status[status]++;
          }

          // Count by User (Slicing the email here!)
          const userKey = task.assignee_email ? task.assignee_email : 'Unassigned';
          stats.tasks_per_user[userKey] = (stats.tasks_per_user[userKey] || 0) + 1;

          // Count Overdue
          if (task.due_date && new Date(task.due_date) < new Date() && status !== 'done') {
            stats.overdue_tasks++;
          }
        });

        setDashData(stats);
      })
      .catch(console.error)
      .finally(() => setLoadingDash(false))
  }, [selectedProject])

  if (loadingProjects) return <PageLoader />

  if (projects.length === 0) {
    return (
      <div style={styles.page} className="animate-fade-in">
        <h1 style={styles.title}>Dashboard</h1>
        <EmptyState
          icon="⬡"
          title="No projects yet"
          description="Create or join a project to view analytics."
          action={<button onClick={() => navigate('/projects')} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-sm)', padding: '10px 20px',
            fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer',
          }}>Go to Projects</button>}
        />
      </div>
    )
  }

  const statusChartData = dashData
    ? [
      { name: 'To Do', value: dashData.tasks_by_status.todo, fill: STATUS_COLORS.todo },
      { name: 'In Progress', value: dashData.tasks_by_status.in_progress, fill: STATUS_COLORS.in_progress },
      { name: 'Done', value: dashData.tasks_by_status.done, fill: STATUS_COLORS.done },
    ]
    : []

  const userChartData = dashData
    ? Object.entries(dashData.tasks_per_user).map(([name, count]) => ({ name, count }))
    : []

  return (
    <div style={styles.page} className="animate-fade-in">
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <select
          value={selectedProject?.id || ''}
          onChange={(e) => {
            const p = projects.find((p) => p.id === e.target.value)
            setSelectedProject(p)
          }}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 14px',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
          }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loadingDash ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner size={32} />
        </div>
      ) : dashData ? (
        <>
          <div style={styles.statsGrid}>
            <StatCard label="Total Tasks" value={dashData.total_tasks} icon="◻" color="var(--accent)" />
            <StatCard label="To Do" value={dashData.tasks_by_status.todo} icon="○" color={STATUS_COLORS.todo} />
            <StatCard label="In Progress" value={dashData.tasks_by_status.in_progress} icon="◑" color={STATUS_COLORS.in_progress} />
            <StatCard label="Done" value={dashData.tasks_by_status.done} icon="●" color={STATUS_COLORS.done} />
            <StatCard label="Overdue" value={dashData.overdue_tasks} icon="⚠" color="var(--danger)" />
          </div>

          <div style={styles.chartsGrid}>
            <Card style={{ padding: '24px' }}>
              <h3 style={styles.chartTitle}>Tasks by Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ padding: '24px' }}>
              <h3 style={styles.chartTitle}>Tasks per User</h3>
              {userChartData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No task assignments yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={userChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,89,187,0.06)' }} />
                    <Bar dataKey="count" name="Tasks" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', color, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</p>
      </div>
    </Card>
  )
}

const styles = {
  page: { padding: '40px 48px', maxWidth: 1440, margin: '0 auto', width: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' },
  chartTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '16px', color: 'var(--text-secondary)' },
}