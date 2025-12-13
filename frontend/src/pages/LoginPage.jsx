import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Container, Card, Button, Input } from "../components"
import { useAuth } from "../hooks"

/**
 * Login page - User authentication with backend API integration
 */
export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState(null)

  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setLocalError(null) // Clear error on input change
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    setIsSubmitting(true)

    try {
      const { username, password } = formData

      // Validation
      if (!username.trim() || !password.trim()) {
        throw new Error("Please fill in all fields")
      }

      await login(username, password)
      navigate("/dashboard")
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container size="sm">
      <div className="space-y-8 py-12">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900">Welcome Back</h1>
          <p className="text-neutral-600">
            Sign in to your Sweet Shop account
          </p>
        </div>

        {localError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{localError}</p>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              label="Username"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <Input
              type="password"
              label="Password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
            <p className="text-neutral-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary-600 font-medium hover:underline"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </Container>
  )
}
