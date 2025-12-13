import React from "react"

/**
 * Button component with multiple variants
 * @param {string} variant - "primary" | "secondary" | "ghost"
 * @param {boolean} disabled - Disable button
 * @param {string} className - Additional Tailwind classes
 * @param {React.ReactNode} children - Button content
 * @param {function} onClick - Click handler
 * @param {string} type - "button" | "submit" | "reset"
 */
export default function Button({
  variant = "primary",
  disabled = false,
  className = "",
  children,
  onClick,
  type = "button",
  ...props
}) {
  const baseStyles =
    "px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

  const variants = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    secondary:
      "bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus:ring-neutral-500",
    ghost:
      "bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-500",
  }

  const variantStyles = variants[variant] || variants.primary

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
