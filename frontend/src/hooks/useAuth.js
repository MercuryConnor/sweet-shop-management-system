import { useContext } from "react"
import { AuthContext } from "../context"

/**
 * Hook to use authentication context
 * Must be used inside AuthProvider
 * @returns {Object} Authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}
