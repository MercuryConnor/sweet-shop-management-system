import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Container, Card, Button, Input } from "../components"
import { useAuth } from "../hooks"

/**
 * Register page - User account creation with backend API integration
 */
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState(null)

  const { register, isAuthenticated } = useAuth()
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
      const { fullName, username, password, confirmPassword } = formData

      // Validation
      if (!fullName.trim()) {
        throw new Error("Please enter your full name")
      }

      if (!username.trim()) {
        throw new Error("Please enter a username")
      }

      if (username.length < 3) {
        throw new Error("Username must be at least 3 characters")
      }

      if (!password.trim()) {
        throw new Error("Please enter a password")
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters")
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
      }

      await register(username, password, fullName)
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
          <h1 className="text-3xl font-bold text-neutral-900">Create Account</h1>
          <p className="text-neutral-600">
            Join Sweet Shop and start shopping
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
              label="Full Name"
              name="fullName"
              placeholder="Your full name"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <Input
              type="text"
              label="Username"
              name="username"
              placeholder="Choose a username (3+ characters)"
              value={formData.username}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <Input
              type="password"
              label="Password"
              name="password"
              placeholder="Enter a secure password (6+ characters)"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <Input
              type="password"
              label="Confirm Password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
            <p className="text-neutral-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-600 font-medium hover:underline"
              >
                Sign in here
              </Link>
           </p>
          </div>
        </Card>
      </div>
    </Container>
  )
}
