import React, { useState, useEffect } from "react"
import { Container, Button, Section } from "../components"
import { sweetsService } from "../services"
import { useAuth, useToast } from "../hooks"

const sweetNameMap = {
  "chocolate truffle": { name: "Gulab Jamun", category: "Traditional" },
  "vanilla cupcake": { name: "Rasmalai", category: "Milk-based" },
  "strawberry tart": { name: "Kaju Katli", category: "Dry Fruit" },
  brownies: { name: "Mysore Pak", category: "Traditional" },
  "caramel sauce": { name: "Ghee Mysore Pak", category: "Festival Special" },
}

const indianizeSweet = (sweet) => {
  const key = sweet?.name?.toLowerCase()
  const mapped = key && sweetNameMap[key]
  if (!mapped) return sweet
  return { ...sweet, name: mapped.name, category: mapped.category }
}

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
  const [priceEdits, setPriceEdits] = useState({})
  const [priceErrors, setPriceErrors] = useState({})
  const [savingPriceId, setSavingPriceId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [newSweet, setNewSweet] = useState({ name: "", category: "", price: "", quantity: "" })
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  useEffect(() => {
    loadSweets()
  }, [])

  const loadSweets = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await sweetsService.fetchSweets(0, 100)
      const normalized = data.map(indianizeSweet)
      setSweets(normalized)
      setPriceEdits(normalized.reduce((acc, sweet) => ({ ...acc, [sweet.id]: sweet.price.toString() }), {}))
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

  const handlePriceChange = (sweetId, value) => {
    setPriceEdits((prev) => ({ ...prev, [sweetId]: value }))
    setPriceErrors((prev) => ({ ...prev, [sweetId]: "" }))
  }

  const handleNewSweetChange = (field, value) => {
    setNewSweet((prev) => ({ ...prev, [field]: value }))
    setCreateError("")
  }

  const handleCreateSweet = async (e) => {
    e.preventDefault()
    const { name, category, price, quantity } = newSweet

    if (!name || !category || price === "" || quantity === "") {
      setCreateError("All fields are required")
      return
    }

    const numericPrice = parseFloat(price)
    const numericQuantity = parseInt(quantity, 10)

    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      setCreateError("Price must be greater than 0")
      return
    }

    if (!Number.isInteger(numericQuantity) || numericQuantity < 0) {
      setCreateError("Quantity must be 0 or more")
      return
    }

    setIsCreating(true)
    setCreateError("")
    try {
      const created = await sweetsService.createSweet({
        name: name.trim(),
        category: category.trim(),
        price: numericPrice,
        quantity: numericQuantity,
      })
      const normalized = indianizeSweet(created)
      setSweets((prev) => [normalized, ...prev])
      setPriceEdits((prev) => ({ ...prev, [normalized.id]: normalized.price.toString() }))
      setNewSweet({ name: "", category: "", price: "", quantity: "" })
      toast.success(`Added ${normalized.name} 🎉`)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setIsCreating(false)
    }
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
      const normalized = indianizeSweet(updatedSweet)

      // Update the sweet in the list with new quantity
      setSweets((prev) =>
        prev.map((sweet) =>
          sweet.id === sweetId ? { ...normalized } : sweet
        )
      )
      // Clear input and show success
      setRestockQuantities((prev) => ({
        ...prev,
        [sweetId]: 0,
      }))
      toast.success(`Restocked ${normalized.name} successfully! ✅`)
    } catch (err) {
      setRestockErrors((prev) => ({
        ...prev,
        [sweetId]: err.message,
      }))
    } finally {
      setRestockingId(null)
    }
  }

  const handleSavePrice = async (sweetId) => {
    const value = priceEdits[sweetId]
    const numeric = parseFloat(value)
    if (Number.isNaN(numeric) || numeric <= 0) {
      setPriceErrors((prev) => ({ ...prev, [sweetId]: "Price must be greater than 0" }))
      return
    }

    setSavingPriceId(sweetId)
    setPriceErrors((prev) => ({ ...prev, [sweetId]: "" }))
    try {
      const updated = await sweetsService.updateSweetPrice(sweetId, numeric)
      const normalized = indianizeSweet(updated)
      setSweets((prev) => prev.map((s) => (s.id === sweetId ? { ...normalized } : s)))
      setPriceEdits((prev) => ({ ...prev, [sweetId]: normalized.price.toString() }))
      toast.success(`Updated price for ${normalized.name}`)
    } catch (err) {
      setPriceErrors((prev) => ({ ...prev, [sweetId]: err.message }))
    } finally {
      setSavingPriceId(null)
    }
  }

  const handleDeleteSweet = async (sweetId, sweetName) => {
    const confirmed = window.confirm(`Delete ${sweetName}? This cannot be undone.`)
    if (!confirmed) return

    setDeletingId(sweetId)
    try {
      await sweetsService.deleteSweet(sweetId)
      setSweets((prev) => prev.filter((s) => s.id !== sweetId))
      setRestockQuantities((prev) => {
        const copy = { ...prev }
        delete copy[sweetId]
        return copy
      })
      setPriceEdits((prev) => {
        const copy = { ...prev }
        delete copy[sweetId]
        return copy
      })
      toast.success(`Deleted ${sweetName}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeletingId(null)
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

        {/* Add New Sweet */}
        <Section title="Add New Sweet" subtitle="Create new products (admin only)">
          <form onSubmit={handleCreateSweet} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-neutral-600 font-medium uppercase tracking-wide block mb-2">Name</label>
                <input
                  value={newSweet.name}
                  onChange={(e) => handleNewSweetChange("name", e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Kaju Katli"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600 font-medium uppercase tracking-wide block mb-2">Category</label>
                <input
                  value={newSweet.category}
                  onChange={(e) => handleNewSweetChange("category", e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Dry Fruit"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600 font-medium uppercase tracking-wide block mb-2">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newSweet.price}
                  onChange={(e) => handleNewSweetChange("price", e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="249"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600 font-medium uppercase tracking-wide block mb-2">Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newSweet.quantity}
                  onChange={(e) => handleNewSweetChange("quantity", e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="20"
                  required
                />
              </div>
            </div>

            {createError && (
              <p className="text-red-600 text-sm font-medium">{createError}</p>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isCreating}
                className={`px-5 py-2.5 ${isCreating ? "cursor-wait" : ""}`}
              >
                {isCreating ? "Creating..." : "Add Sweet"}
              </Button>
            </div>
          </form>
        </Section>

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
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    {/* Name & Category */}
                    <div className="space-y-1">
                      <h3 className="font-semibold text-neutral-900">{sweet.name}</h3>
                      <p className="text-xs text-neutral-600 uppercase font-medium tracking-wide">
                        {sweet.category}
                      </p>
                    </div>

                    {/* Price (editable) */}
                    <div>
                      <p className="text-xs text-neutral-600 font-medium uppercase tracking-wide">Price (₹)</p>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceEdits[sweet.id] ?? sweet.price}
                        onChange={(e) => handlePriceChange(sweet.id, e.target.value)}
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        disabled={savingPriceId === sweet.id || deletingId === sweet.id}
                      />
                      {priceErrors[sweet.id] && (
                        <p className="text-xs text-red-600 font-medium mt-1.5">{priceErrors[sweet.id]}</p>
                      )}
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

                    {/* Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleSavePrice(sweet.id)}
                        disabled={savingPriceId === sweet.id || deletingId === sweet.id}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                          savingPriceId === sweet.id
                            ? "bg-primary-500 text-white cursor-wait shadow-sm"
                            : "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm hover:shadow-md"
                        }`}
                      >
                        {savingPriceId === sweet.id ? "Saving..." : "Save Price"}
                      </button>
                      <button
                        onClick={() => handleRestock(sweet.id)}
                        disabled={
                          restockingId === sweet.id ||
                          deletingId === sweet.id ||
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
                      <button
                        onClick={() => handleDeleteSweet(sweet.id, sweet.name)}
                        disabled={deletingId === sweet.id || savingPriceId === sweet.id || restockingId === sweet.id}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                          deletingId === sweet.id
                            ? "bg-red-500 text-white cursor-wait shadow-sm"
                            : "bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300"
                        }`}
                      >
                        {deletingId === sweet.id ? "Deleting..." : "Delete"}
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
