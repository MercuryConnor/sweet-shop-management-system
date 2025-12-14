import React from "react"

/**
 * Section - Reusable bordered container for grouping content
 * Provides visual hierarchy and consistent spacing
 *
 * @param {React.ReactNode} children - Section content
 * @param {string} title - Optional section title
 * @param {string} subtitle - Optional section subtitle
 * @param {string} className - Additional Tailwind classes
 */
export default function Section({
  children,
  title,
  subtitle,
  className = "",
}) {
  return (
    <section
      className={`
        bg-white border border-neutral-200 rounded-xl shadow-sm
        p-6 md:p-8 space-y-4
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="border-b border-neutral-100 pb-4">
          {title && (
            <h2 className="text-lg font-semibold text-neutral-900">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
