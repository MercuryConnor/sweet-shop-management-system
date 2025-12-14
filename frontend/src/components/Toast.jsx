import React, { useEffect } from "react"

/**
 * Toast - Lightweight notification component with pastel styling
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
    success: "bg-white border-mint-200 border",
    error: "bg-white border-red-200 border",
    info: "bg-white border-skyblue-200 border",
  }[type]

  const textColor = {
    success: "text-mint-700",
    error: "text-red-700",
    info: "text-skyblue-700",
  }[type]

  const icon = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
  }[type]

  return (
    <div
      className={`${bgColor} rounded-xl p-4 flex items-start gap-3 shadow-md ${textColor}`}
      role="alert"
      aria-live="polite"
    >
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-lg leading-none hover:opacity-60 transition-opacity"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  )
}
