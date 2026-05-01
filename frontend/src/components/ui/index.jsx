import React from 'react'

// ── Button ─────────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', loading, disabled, className = '', ...props }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    letterSpacing: '0.02em',
    transition: 'all 0.15s ease',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    border: 'none',
  }
  const sizes = {
    sm: { padding: '8px 16px', fontSize: '0.875rem' },
    md: { padding: '12px 24px', fontSize: '0.9375rem' },
    lg: { padding: '14px 32px', fontSize: '1rem' },
  }
  const variants = {
    primary: { background: 'var(--accent)', color: '#fff' },
    secondary: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
    danger: { background: 'var(--danger)', color: '#fff' },
    success: { background: 'var(--success)', color: '#fff' },
  }

  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      disabled={disabled || loading}
      className={`btn-hover ${className}`}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}

// ── Input ──────────────────────────────────────────────────────────────────────
export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          background: 'var(--bg-elevated)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          color: 'var(--text-primary)',
          fontSize: '0.9375rem',
          width: '100%',
          transition: 'all 0.15s',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent)'
          e.target.style.boxShadow = 'var(--shadow-accent)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'
          e.target.style.boxShadow = 'none'
        }}
        {...props}
      />
      {error && <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

// ── Select ─────────────────────────────────────────────────────────────────────
export function Select({ label, error, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
        }}>
          {label}
        </label>
      )}
      <select
        style={{
          background: 'var(--bg-elevated)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          color: 'var(--text-primary)',
          fontSize: '0.9375rem',
          width: '100%',
          cursor: 'pointer',
          transition: 'all 0.15s',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent)'
          e.target.style.boxShadow = 'var(--shadow-accent)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'
          e.target.style.boxShadow = 'none'
        }}
        {...props}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

// ── Textarea ───────────────────────────────────────────────────────────────────
export function Textarea({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
        }}>
          {label}
        </label>
      )}
      <textarea
        style={{
          background: 'var(--bg-elevated)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          color: 'var(--text-primary)',
          fontSize: '0.9375rem',
          width: '100%',
          resize: 'vertical',
          minHeight: '80px',
          transition: 'all 0.15s',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent)'
          e.target.style.boxShadow = 'var(--shadow-accent)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'
          e.target.style.boxShadow = 'none'
        }}
        {...props}
      />
      {error && <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────────
const BADGE_VARIANTS = {
  todo:        { bg: 'var(--info-dim)',    color: 'var(--info)',    label: 'To Do' },
  in_progress: { bg: 'var(--warning-dim)', color: 'var(--warning)', label: 'In Progress' },
  done:        { bg: 'var(--success-dim)', color: 'var(--success)', label: 'Done' },
  low:         { bg: 'var(--success-dim)', color: 'var(--success)', label: 'Low' },
  medium:      { bg: 'var(--warning-dim)', color: 'var(--warning)', label: 'Medium' },
  high:        { bg: 'var(--danger-dim)',  color: 'var(--danger)',  label: 'High' },
  admin:       { bg: 'var(--accent-dim)',  color: 'var(--accent)',  label: 'Admin' },
  member:      { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)', label: 'Member' },
}

export function Badge({ type, children }) {
  const v = BADGE_VARIANTS[type] || { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)', label: type }
  return (
    <span style={{
      display: 'inline-block',
      background: v.bg,
      color: v.color,
      borderRadius: 'var(--radius-full)',
      padding: '4px 10px',
      fontSize: '0.75rem',
      fontWeight: 600,
      fontFamily: 'var(--font-display)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {children ?? v.label}
    </span>
  )
}

// ── Spinner ────────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = 'var(--accent)' }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `2px solid transparent`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, width = 480 }) {
  if (!isOpen) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          width: '100%',
          maxWidth: width,
          animation: 'fadeIn 0.2s ease',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1.25rem', lineHeight: 1,
              padding: '4px',
            }}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'border-color 0.15s, transform 0.15s, box-shadow 0.15s' : undefined,
        boxShadow: 'var(--shadow-md)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 20px', gap: '12px',
      color: 'var(--text-muted)', textAlign: 'center',
    }}>
      <span style={{ fontSize: '2.5rem' }}>{icon}</span>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-secondary)' }}>{title}</p>
      {description && <p style={{ fontSize: '0.875rem', maxWidth: 320 }}>{description}</p>}
      {action}
    </div>
  )
}

// ── Error Message ──────────────────────────────────────────────────────────────
export function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <div style={{
      background: 'var(--danger-dim)',
      border: '1px solid var(--danger)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px 14px',
      fontSize: '0.875rem',
      color: 'var(--danger)',
    }}>
      {message}
    </div>
  )
}

// ── Page Loader ───────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh',
    }}>
      <Spinner size={36} />
    </div>
  )
}
