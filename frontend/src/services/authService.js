import api from "./api"

/**
 * Authentication service
 * Handles all API calls related to user authentication
 */

/**
 * Register a new user account
 * @param {string} username - Username (3+ chars)
 * @param {string} password - Password (6+ chars)
 * @param {string} fullName - Full name of user
 * @returns {Promise<Object>} User data with id, username, full_name
 * @throws {Error} If username already exists or validation fails
 */
export const registerUser = async (username, password, fullName) => {
  try {
    const response = await api.post("/api/auth/register", {
      username,
      password,
      full_name: fullName,
    })
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || "Registration failed. Please try again."
    throw new Error(message)
  }
}

/**
 * Login user with credentials
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Token object with access_token and token_type
 * @throws {Error} If credentials are invalid
 */
export const loginUser = async (username, password) => {
  try {
    // Backend uses OAuth2PasswordRequestForm, which expects form data
    const formData = new FormData()
    formData.append("username", username)
    formData.append("password", password)

    const response = await api.post("/api/auth/login", formData)
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || "Login failed. Please try again."
    throw new Error(message)
  }
}

/**
 * Get current user info from token
 * Decodes JWT to extract username and check is_admin flag
 * @param {string} token - JWT token
 * @returns {Object} Decoded user info
 */
export const decodeToken = (token) => {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) {
      throw new Error("Invalid token format")
    }

    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]))

    return {
      username: payload.sub,
      // Check if username contains 'admin' for role determination
      is_admin: payload.sub.toLowerCase().includes("admin"),
    }
  } catch (error) {
    console.error("Token decode error:", error)
    return null
  }
}

export default {
  registerUser,
  loginUser,
  decodeToken,
}
