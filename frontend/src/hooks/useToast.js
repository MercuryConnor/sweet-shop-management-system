import { useContext } from "react"
import { ToastContext } from "../context/ToastContext"

/**
 * Hook to use toast notifications
 * Must be used inside ToastProvider
 * @returns {Object} Toast context value with success, error, info methods
 */
export const useToast = () => {
  const context = useContext(ToastContext)

  if (context === undefined) {
    throw new Error("useToast must be used inside ToastProvider")
  }

  return context
}
