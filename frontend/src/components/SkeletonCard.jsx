import React from "react"

/**
 * SkeletonCard - Loading placeholder for SweetCard
 * Shows animated skeleton while data is loading
 */
export default function SkeletonCard() {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="bg-neutral-200 h-40"></div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="bg-neutral-200 h-4 rounded w-4/5"></div>
          <div className="bg-neutral-200 h-4 rounded w-3/5"></div>
        </div>

        {/* Price skeleton */}
        <div className="bg-neutral-200 h-6 rounded w-2/5"></div>

        {/* Stock skeleton */}
        <div className="bg-neutral-200 h-4 rounded w-1/3"></div>

        {/* Button skeleton */}
        <div className="bg-neutral-200 h-10 rounded-lg"></div>
      </div>
    </div>
  )
}
