import { createContext, useState, useCallback } from "react"
import Toast from "../components/Toast"

/**
 * Toast Context - Provides toast notification management
 */
export const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type, duration }])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value = {
    addToast,
    removeToast,
    success: (message, duration = 3000) => addToast(message, "success", duration),
    error: (message, duration = 5000) => addToast(message, "error", duration),
    info: (message, duration = 3000) => addToast(message, "info", duration),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
            autoCloseDuration={toast.duration}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
