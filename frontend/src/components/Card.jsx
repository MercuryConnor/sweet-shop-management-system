import React from "react"

/**
 * Card component for content containers
 * @param {React.ReactNode} children - Card content
 * @param {string} className - Additional Tailwind classes
 * @param {boolean} clickable - Add hover effect if clickable
 */
export default function Card({
  children,
  className = "",
  clickable = false,
}) {
  return (
    <div
      className={`
        bg-white rounded-lg border border-neutral-200 shadow-sm
        p-6 transition-all duration-200
        ${clickable ? "hover:shadow-md hover:border-primary-300 cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
