import React from "react"
import { createContext, useState, useCallback, useEffect } from "react"
import { loginUser, registerUser, decodeToken } from "../services/authService"

/**
 * Auth Context - Provides authentication state and methods
 * Usage: const { user, login, logout, isAuthenticated } = useContext(AuthContext)
 */
export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is logged in (from localStorage token) on mount
  useEffect(() => {
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (err) {
        console.error("Failed to parse stored user:", err)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  // Listen for logout events from api interceptor (401 responses)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null)
      setError(null)
    }

    window.addEventListener("auth-logout", handleLogout)
    return () => window.removeEventListener("auth-logout", handleLogout)
  }, [])

  /**
   * Login with username and password
   * @param {string} username
   * @param {string} password
   * @returns {Promise<void>}
   */
  const login = useCallback(async (username, password) => {
    setError(null)
    try {
      const tokenResponse = await loginUser(username, password)
      const { access_token } = tokenResponse

      // Decode token to get user info
      const decodedUser = decodeToken(access_token)
      if (!decodedUser) {
        throw new Error("Failed to decode token")
      }

      // Create user object with decoded info and username
      const userData = {
        username: decodedUser.username,
        is_admin: decodedUser.is_admin,
      }

      // Store token and user
      localStorage.setItem("token", access_token)
      localStorage.setItem("user", JSON.stringify(userData))
      setUser(userData)

      return userData
    } catch (err) {
      const errorMessage = err.message || "Login failed"
      setError(errorMessage)
      throw err
    }
  }, [])

  /**
   * Register a new user account
   * @param {string} username
   * @param {string} password
   * @param {string} fullName
   * @returns {Promise<void>}
   */
  const register = useCallback(async (username, password, fullName) => {
    setError(null)
    try {
      await registerUser(username, password, fullName)
      // Auto-login after registration
      await login(username, password)
    } catch (err) {
      const errorMessage = err.message || "Registration failed"
      setError(errorMessage)
      throw err
    }
  }, [login])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setError(null)
  }, [])

  const value = {
    user,
    isLoading,
    error,
    setError,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
