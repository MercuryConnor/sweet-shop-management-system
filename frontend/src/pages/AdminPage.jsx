import React, { useState, useEffect } from "react"
import { Container, Button, Input } from "../components"
import { sweetsService } from "../services"
import { useAuth } from "../hooks"
import { formatPrice } from "../utils"

/**
 * AdminPage - Admin-only inventory management interface
 * Requires admin authentication via ProtectedRoute with requireAdmin={true}
 */
export default function AdminPage() {
  const { user } = useAuth()
  const [sweets, setSweets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [restockQuantities, setRestockQuantities] = useState({})
  const [restockingId, setRestockingId] = useState(null)
  const [restockSuccess, setRestockSuccess] = useState(null)
  const [restockErrors, setRestockErrors] = useState({})

  useEffect(() => {
    loadSweets()
  }, [])

  const loadSweets = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await sweetsService.fetchSweets(0, 100)
      setSweets(data)
    } catch (err) {
      setError(err.message)
      setSweets([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestockQuantityChange = (sweetId, value) => {
    const numValue = Math.max(0, parseInt(value) || 0)
    setRestockQuantities((prev) => ({
      ...prev,
      [sweetId]: numValue,
    }))
    // Clear error for this sweet when user changes input
    setRestockErrors((prev) => ({
      ...prev,
      [sweetId]: "",
    }))
  }

  const handleRestock = async (sweetId) => {
    const quantity = restockQuantities[sweetId]

    if (!quantity || quantity < 0) {
      setRestockErrors((prev) => ({
        ...prev,
        [sweetId]: "Please enter a valid quantity",
      }))
      return
    }

    setRestockingId(sweetId)
    setRestockErrors((prev) => ({ ...prev, [sweetId]: "" }))

    try {
      const updatedSweet = await sweetsService.restockSweet(sweetId, quantity)

      // Update the sweet in the list with new quantity
      setSweets((prev) =>
        prev.map((sweet) =>
          sweet.id === sweetId ? { ...sweet, quantity: updatedSweet.quantity } : sweet
        )
      )

      // Clear input and show success
      setRestockQuantities((prev) => ({
        ...prev,
        [sweetId]: 0,
      }))
      setRestockSuccess(`Restocked ${updatedSweet.name} successfully! ✅`)
      setTimeout(() => setRestockSuccess(null), 3000)
    } catch (err) {
      setRestockErrors((prev) => ({
        ...prev,
        [sweetId]: err.message,
      }))
    } finally {
      setRestockingId(null)
    }
  }

  const lowStockCount = sweets.filter((s) => s.quantity < 5).length
  const totalSweets = sweets.length

  return (
    <Container size="xl">
      <div className="py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-neutral-900">Admin Panel</h1>
          <p className="text-neutral-600 mt-2">
            Manage inventory and restock sweets (Logged in as {user?.username})
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="text-3xl">🍰</div>
              <div>
                <p className="text-sm text-neutral-600">Total Sweets</p>
                <p className="text-2xl font-bold text-neutral-900">{totalSweets}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="text-3xl">⚠️</div>
              <div>
                <p className="text-sm text-neutral-600">Low Stock (&lt; 5)</p>
                <p className="text-2xl font-bold text-neutral-900">{lowStockCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="text-3xl">📦</div>
              <div>
                <p className="text-sm text-neutral-600">Total Inventory</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {sweets.reduce((sum, s) => sum + s.quantity, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success feedback */}
        {restockSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 text-sm font-medium">{restockSuccess}</p>
          </div>
        )}

        {/* Error loading sweets */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={loadSweets}
                className="text-red-600 hover:text-red-700 font-medium text-sm underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Inventory Management */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Inventory Management</h2>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-neutral-100 h-16 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : sweets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-lg">No sweets found</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {sweets.map((sweet) => (
                <div
                  key={sweet.id}
                  className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    {/* Name & Category */}
                    <div>
                      <h3 className="font-semibold text-neutral-900">{sweet.name}</h3>
                      <p className="text-sm text-neutral-600 capitalize">{sweet.category}</p>
                    </div>

                    {/* Price */}
                    <div>
                      <p className="text-sm text-neutral-600">Price</p>
                      <p className="font-semibold text-neutral-900">{formatPrice(sweet.price)}</p>
                    </div>

                    {/* Current Stock */}
                    <div>
                      <p className="text-sm text-neutral-600">Current Stock</p>
                      <p
                        className={`font-semibold text-lg ${
                          sweet.quantity < 5 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {sweet.quantity}
                      </p>
                    </div>

                    {/* Restock Input */}
                    <div>
                      <label className="text-sm text-neutral-600 block mb-1">Add Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={restockQuantities[sweet.id] || 0}
                        onChange={(e) => handleRestockQuantityChange(sweet.id, e.target.value)}
                        disabled={restockingId === sweet.id}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-neutral-100"
                        placeholder="Qty"
                      />
                      {restockErrors[sweet.id] && (
                        <p className="text-xs text-red-600 mt-1">{restockErrors[sweet.id]}</p>
                      )}
                    </div>

                    {/* Restock Button */}
                    <div>
                      <button
                        onClick={() => handleRestock(sweet.id)}
                        disabled={
                          restockingId === sweet.id ||
                          !restockQuantities[sweet.id] ||
                          restockQuantities[sweet.id] < 0
                        }
                        className={`w-full py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                          restockingId === sweet.id
                            ? "bg-primary-500 text-white cursor-wait"
                            : !restockQuantities[sweet.id] || restockQuantities[sweet.id] < 0
                              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                              : "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800"
                        }`}
                      >
                        {restockingId === sweet.id ? "Restocking..." : "Restock"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}
