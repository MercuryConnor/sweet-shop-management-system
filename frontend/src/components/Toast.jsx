import React, { useEffect } from "react"

/**
 * Toast - Lightweight notification component
 * @param {string} id - Unique identifier
 * @param {string} message - Toast message
 * @param {string} type - 'success', 'error', or 'info' (default: 'info')
 * @param {function} onClose - Callback when toast should close
 * @param {number} autoCloseDuration - Auto-close duration in ms (default: 3000, 0 to disable)
 */
export default function Toast({ id, message, type = "info", onClose, autoCloseDuration = 3000 }) {
  useEffect(() => {
    if (autoCloseDuration > 0) {
      const timer = setTimeout(() => onClose(id), autoCloseDuration)
      return () => clearTimeout(timer)
    }
  }, [id, autoCloseDuration, onClose])

  const bgColor = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
  }[type]

  const textColor = {
    success: "text-green-700",
    error: "text-red-700",
    info: "text-blue-700",
  }[type]

  const icon = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
  }[type]

  return (
    <div
      className={`border rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${bgColor}`}
      role="alert"
      aria-live="polite"
    >
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <p className={`text-sm font-medium ${textColor}`}>{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className={`flex-shrink-0 text-lg leading-none hover:opacity-70 transition-opacity`}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  )
}
