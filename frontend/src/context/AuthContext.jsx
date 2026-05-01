import React, { createContext, useContext, useState, useCallback } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('access_token') || null)

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login(email, password)
    const { access_token } = res.data
    localStorage.setItem('access_token', access_token)
    setToken(access_token)

    // Decode JWT payload to get user id (sub)
    const payload = JSON.parse(atob(access_token.split('.')[1]))
    const userData = { id: payload.sub, email }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const signup = useCallback(async (name, email, password) => {
    const res = await authAPI.signup({ name, email, password })
    return res.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
