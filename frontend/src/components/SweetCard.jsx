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
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image placeholder with category badge */}
      <div className="bg-gradient-to-br from-sweet-light to-sweet-medium h-40 relative overflow-hidden">
        <div className="absolute top-2 right-2 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
          {sweet.category}
        </div>
        {/* Emoji icon for visual appeal */}
        <div className="flex items-center justify-center h-full text-5xl">
          {getCategoryEmoji(sweet.category)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name and price */}
        <div>
          <h3 className="font-semibold text-neutral-900 text-lg line-clamp-2">
            {sweet.name}
          </h3>
          <p className="text-primary-600 font-bold text-xl mt-1">
            {formatPrice(sweet.price)}
          </p>
        </div>

        {/* Stock status */}
        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
            {isOutOfStock ? "Out of Stock" : `${sweet.quantity} in stock`}
          </span>
        </div>

        {/* Error message */}
        {error && <p className="text-red-600 text-xs">{error}</p>}

        {/* Purchase button */}
        <button
          onClick={handleClick}
          disabled={isOutOfStock || isLoading}
          className={`w-full py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
            isOutOfStock
              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              : isLoading
                ? "bg-primary-500 text-white cursor-wait"
                : "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800"
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
