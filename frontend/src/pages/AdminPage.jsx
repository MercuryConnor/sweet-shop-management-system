import React, { useState, useEffect } from "react"
import { Container, Button, Input, Section } from "../components"
import { sweetsService } from "../services"
import { useAuth, useToast } from "../hooks"
import { formatPrice } from "../utils"

/**
 * AdminPage - Admin-only inventory management interface
 * Requires admin authentication via ProtectedRoute with requireAdmin={true}
 */
export default function AdminPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [sweets, setSweets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [restockQuantities, setRestockQuantities] = useState({})
  const [restockingId, setRestockingId] = useState(null)
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
      toast.success(`Restocked ${updatedSweet.name} successfully! ✅`)
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
      <div className="py-8 md:py-12 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900">⚙️ Admin Panel</h1>
          <p className="text-neutral-600 text-lg">
            Manage inventory and restock sweets
            <br />
            <span className="text-sm text-neutral-500">Logged in as <span className="font-medium text-neutral-700">{user?.username}</span></span>
          </p>
        </div>

        {/* Stats Section */}
        <Section title="Inventory Summary" subtitle="Quick overview of stock levels">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🍰</div>
                <div>
                  <p className="text-sm text-neutral-600 font-medium">Total Sweets</p>
                  <p className="text-3xl font-bold text-primary-700 mt-1">{totalSweets}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">⚠️</div>
                <div>
                  <p className="text-sm text-neutral-600 font-medium">Low Stock (&lt; 5)</p>
                  <p className={`text-3xl font-bold mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-mint-600'}`}>{lowStockCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-skyblue-50 to-white border border-skyblue-100 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">📦</div>
                <div>
                  <p className="text-sm text-neutral-600 font-medium">Total Inventory</p>
                  <p className="text-3xl font-bold text-skyblue-700 mt-1">
                    {sweets.reduce((sum, s) => sum + s.quantity, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Error loading sweets */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex justify-between items-center gap-4">
              <p className="text-red-700 text-sm font-medium">{error}</p>
              <button
                onClick={loadSweets}
                className="text-red-600 hover:text-red-700 font-medium text-sm underline flex-shrink-0"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Inventory Management */}
        <Section title="Inventory Management" subtitle="Update stock levels for each sweet">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-neutral-100 h-20 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : sweets.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-500 text-lg font-medium">No sweets found</p>
              <p className="text-neutral-400 text-sm mt-2">Start by adding sweets to your inventory</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
              {sweets.map((sweet) => (
                <div
                  key={sweet.id}
                  className="border border-neutral-200 rounded-lg p-5 bg-white hover:border-primary-200 hover:shadow-sm transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    {/* Name & Category */}
                    <div className="space-y-1">
                      <h3 className="font-semibold text-neutral-900">{sweet.name}</h3>
                      <p className="text-xs text-neutral-600 uppercase font-medium tracking-wide">
                        {sweet.category}
                      </p>
                    </div>

                    {/* Price */}
                    <div>
                      <p className="text-xs text-neutral-600 font-medium uppercase tracking-wide">Price</p>
                      <p className="font-semibold text-neutral-900 text-lg">{formatPrice(sweet.price)}</p>
                    </div>

                    {/* Current Stock */}
                    <div>
                      <p className="text-xs text-neutral-600 font-medium uppercase tracking-wide">Current Stock</p>
                      <p
                        className={`text-2xl font-bold ${
                          sweet.quantity < 5 ? "text-red-600" : "text-mint-600"
                        }`}
                      >
                        {sweet.quantity}
                      </p>
                    </div>

                    {/* Restock Input */}
                    <div>
                      <label className="text-xs text-neutral-600 font-medium uppercase tracking-wide block mb-2">Add Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={restockQuantities[sweet.id] || 0}
                        onChange={(e) => handleRestockQuantityChange(sweet.id, e.target.value)}
                        disabled={restockingId === sweet.id}
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-neutral-100 disabled:text-neutral-400"
                        placeholder="0"
                      />
                      {restockErrors[sweet.id] && (
                        <p className="text-xs text-red-600 font-medium mt-1.5">{restockErrors[sweet.id]}</p>
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
                        className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                          restockingId === sweet.id
                            ? "bg-primary-500 text-white cursor-wait shadow-sm"
                            : !restockQuantities[sweet.id] || restockQuantities[sweet.id] < 0
                              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                              : "bg-mint-600 text-white hover:bg-mint-700 active:bg-mint-800 shadow-sm hover:shadow-md"
                        }`}
                      >
                        {restockingId === sweet.id ? "Restocking..." : "✓ Restock"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </Container>
  )
}
