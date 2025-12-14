import React, { useState, useEffect, useCallback } from "react"
import { Container, Button, Input, SweetCard, SkeletonCard } from "../components"
import { sweetsService } from "../services"
import { formatPrice } from "../utils"

/**
 * DashboardPage - Sweet browsing and purchasing UI
 */
export default function DashboardPage() {
  const [sweets, setSweets] = useState([])
  const [filteredSweets, setFilteredSweets] = useState([])
  const [categories, setCategories] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [purchasingId, setPurchasingId] = useState(null)
  const [purchaseSuccess, setPurchaseSuccess] = useState(null)
  const [purchaseErrors, setPurchaseErrors] = useState({})

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 100])
  const [debounceTimer, setDebounceTimer] = useState(null)

  useEffect(() => {
    loadSweets()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [sweets, searchQuery, selectedCategory, priceRange])

  const loadSweets = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await sweetsService.fetchSweets(0, 100)
      setSweets(data)
      const uniqueCategories = [...new Set(data.map((s) => s.category))]
      setCategories(uniqueCategories.sort())
    } catch (err) {
      setError(err.message)
      setSweets([])
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = useCallback(() => {
    let result = [...sweets]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      )
    }
    if (selectedCategory !== "all") {
      result = result.filter((s) => s.category === selectedCategory)
    }
    result = result.filter((s) => s.price >= priceRange[0] && s.price <= priceRange[1])
    setFilteredSweets(result)
  }, [sweets, searchQuery, selectedCategory, priceRange])

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    setDebounceTimer(setTimeout(() => {}, 300))
  }

  const handlePurchase = async (sweetId) => {
    setPurchasingId(sweetId)
    setPurchaseErrors((prev) => ({ ...prev, [sweetId]: "" }))
    try {
      await sweetsService.purchaseSweet(sweetId, 1)
      setSweets((prev) => prev.map((s) => (s.id === sweetId ? { ...s, quantity: Math.max(0, s.quantity - 1) } : s)))
      setPurchaseSuccess("Successfully purchased! 🎉")
      setTimeout(() => setPurchaseSuccess(null), 3000)
    } catch (err) {
      setPurchaseErrors((prev) => ({ ...prev, [sweetId]: err.message }))
    } finally {
      setPurchasingId(null)
    }
  }

  const maxPrice = Math.max(...sweets.map((s) => s.price), 50)

  return (
    <Container size="xl">
      <div className="py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900">Sweet Shop</h1>
          <p className="text-neutral-600 mt-2">Browse and purchase your favorite sweets</p>
        </div>

        {purchaseSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 text-sm font-medium">{purchaseSuccess}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="text-red-700 text-sm">{error}</p>
              <button onClick={loadSweets} className="text-red-600 hover:text-red-700 font-medium text-sm underline">
                Try Again
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              type="text"
              label="Search sweets"
              placeholder="Search by name or category..."
              value={searchQuery}
              onChange={handleSearch}
            />
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 block">
              Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="0"
                max={Math.ceil(maxPrice)}
                value={priceRange[0]}
                onChange={(e) => {
                  const newMin = Math.min(Number(e.target.value), priceRange[1])
                  setPriceRange([newMin, priceRange[1]])
                }}
                className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="range"
                min="0"
                max={Math.ceil(maxPrice)}
                value={priceRange[1]}
                onChange={(e) => {
                  const newMax = Math.max(Number(e.target.value), priceRange[0])
                  setPriceRange([priceRange[0], newMax])
                }}
                className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          {(searchQuery || selectedCategory !== "all" || priceRange[0] !== 0 || priceRange[1] !== maxPrice) && (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
                setPriceRange([0, maxPrice])
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>

        {!isLoading && (
          <div className="text-neutral-600">
            Showing <span className="font-semibold">{filteredSweets.length}</span> of <span className="font-semibold">{sweets.length}</span> sweets
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredSweets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 text-lg">
              {sweets.length === 0 ? "No sweets available" : "No sweets match your filters"}
            </p>
            {sweets.length > 0 && (
              <Button
                variant="primary"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                  setPriceRange([0, maxPrice])
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSweets.map((sweet) => (
              <SweetCard
                key={sweet.id}
                sweet={sweet}
                onPurchase={handlePurchase}
                isLoading={purchasingId === sweet.id}
                error={purchaseErrors[sweet.id] || ""}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}
