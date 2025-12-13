import React from "react"

/**
 * Input component with consistent styling
 * @param {string} type - Input type (text, email, password, etc.)
 * @param {string} placeholder - Placeholder text
 * @param {string} label - Label for the input
 * @param {string} name - Input name attribute
 * @param {string} value - Input value
 * @param {function} onChange - Change handler
 * @param {string} error - Error message to display
 * @param {string} className - Additional Tailwind classes
 */
export default function Input({
  type = "text",
  placeholder = "",
  label = "",
  name = "",
  value = "",
  onChange = () => {},
  error = "",
  className = "",
  ...props
}) {
  const hasError = error && error.length > 0

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <input
        id={name}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          px-4 py-2 rounded-md border-2 transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${
            hasError
              ? "border-red-500 focus:ring-red-500"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500"
          }
        `}
        {...props}
      />
      {hasError && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
