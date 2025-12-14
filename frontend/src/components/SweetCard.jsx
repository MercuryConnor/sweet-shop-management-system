import React from "react"
import { formatPrice } from "../utils"

/**
 * SweetCard - Displays a sweet product with details and purchase button
 * @param {Object} sweet - Sweet object {id, name, category, price, quantity}
 * @param {function} onPurchase - Callback when purchase button is clicked
 * @param {boolean} isLoading - Loading state for purchase button
 * @param {string} error - Error message if purchase failed
 */
export default function SweetCard({ sweet, onPurchase, isLoading = false, error = "" }) {
  const isOutOfStock = sweet.quantity === 0

  const handleClick = () => {
    if (!isOutOfStock && !isLoading) {
      onPurchase(sweet.id)
    }
  }

  return (
    <div className="bg-white border border-primary-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col">
      {/* Image placeholder with category badge */}
      <div className="bg-gradient-to-br from-primary-100 via-primary-50 to-white h-48 relative overflow-hidden flex-shrink-0">
        <div className="absolute top-3 right-3 bg-primary-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">
          {sweet.category}
        </div>
        {/* Emoji icon for visual appeal */}
        <div className="flex items-center justify-center h-full text-6xl">
          {getCategoryEmoji(sweet.category)}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        {/* Name and price */}
        <div className="space-y-2">
          <h3 className="font-semibold text-neutral-900 text-lg line-clamp-2">
            {sweet.name}
          </h3>
          <p className="text-primary-600 font-bold text-2xl">
            {formatPrice(sweet.price)}
          </p>
        </div>

        {/* Stock status badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            isOutOfStock
              ? "bg-red-100 text-red-700"
              : "bg-mint-100 text-mint-700"
          }`}>
            {isOutOfStock ? "Out of Stock" : `${sweet.quantity} in stock`}
          </span>
        </div>

        {/* Error message */}
        {error && <p className="text-red-600 text-xs">{error}</p>}

        {/* Purchase button */}
        <button
          onClick={handleClick}
          disabled={isOutOfStock || isLoading}
          className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 mt-auto ${
            isOutOfStock
              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              : isLoading
                ? "bg-primary-500 text-white cursor-wait shadow-sm"
                : "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm hover:shadow-md"
          }`}
        >
          {isLoading ? "Purchasing..." : isOutOfStock ? "Out of Stock" : "Purchase"}
        </button>
      </div>
    </div>
  )
}

/**
 * Get emoji based on category
 */
function getCategoryEmoji(category) {
  const emojiMap = {
    chocolate: "🍫",
    candy: "🍬",
    cake: "🍰",
    cookie: "🍪",
    donut: "🍩",
    ice_cream: "🍦",
    pastry: "🥐",
    tart: "🍮",
    default: "🍭",
  }

  const categoryLower = category?.toLowerCase() || ""
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (categoryLower.includes(key.replace("_", ""))) {
      return emoji
    }
  }
  return emojiMap.default
}
