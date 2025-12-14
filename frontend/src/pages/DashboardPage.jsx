import React, { useState, useEffect, useCallback, useRef } from "react"
import { useLocation } from "react-router-dom"
import { Container, Button, Input, SweetCard, SkeletonCard, Section } from "../components"
import { sweetsService } from "../services"
import { useToast } from "../hooks"
import { formatPrice } from "../utils"

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
 * DashboardPage - Sweet browsing and purchasing UI
 */
export default function DashboardPage() {
  const toast = useToast()
  const location = useLocation()
  const productsRef = useRef(null)
  const hasAutoScrolled = useRef(false)
  const [sweets, setSweets] = useState([])
  const [filteredSweets, setFilteredSweets] = useState([])
  const [categories, setCategories] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [purchasingId, setPurchasingId] = useState(null)
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
      const normalized = data.map(indianizeSweet)
      setSweets(normalized)
      const uniqueCategories = [...new Set(normalized.map((s) => s.category))]
      setCategories(uniqueCategories.sort())
      const computedMax = Math.ceil(Math.max(...normalized.map((s) => s.price || 0), 50))
      setPriceRange([0, computedMax])
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
      toast.success("Purchase successful! 🎉")
    } catch (err) {
      setPurchaseErrors((prev) => ({ ...prev, [sweetId]: err.message }))
    } finally {
      setPurchasingId(null)
    }
  }

  const maxPrice = Math.max(...sweets.map((s) => s.price), 50)
  const sliderMax = Math.ceil(maxPrice || 50)

  useEffect(() => {
    if (!isLoading && location.state?.scrollTo === "products" && !hasAutoScrolled.current) {
      productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      hasAutoScrolled.current = true
    }
  }, [isLoading, location.state])

  return (
    <Container size="xl">
      <div className="py-8 md:py-12 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900">🍰 Sweet Shop</h1>
          <p className="text-neutral-600 text-lg">Browse and purchase your favorite sweets</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex justify-between items-center gap-4">
              <p className="text-red-700 text-sm font-medium">{error}</p>
              <button onClick={loadSweets} className="text-red-600 hover:text-red-700 font-medium text-sm underline flex-shrink-0">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <Section title="Filters" subtitle="Refine your search">
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
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
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
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-neutral-600">
              <span>Min: {formatPrice(0)}</span>
              <span className="font-semibold text-primary-700">{formatPrice(priceRange[0])} – {formatPrice(priceRange[1])}</span>
              <span>Max: {formatPrice(sliderMax)}</span>
            </div>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="0"
                max={sliderMax}
                value={priceRange[0]}
                onChange={(e) => {
                  const newMin = Math.min(Number(e.target.value), priceRange[1])
                  setPriceRange([newMin, priceRange[1]])
                }}
                aria-label="Minimum price"
                className="flex-1 h-2.5 bg-primary-100 rounded-full appearance-none cursor-pointer accent-primary-600 range-thumb-lg"
              />
              <input
                type="range"
                min="0"
                max={sliderMax}
                value={priceRange[1]}
                onChange={(e) => {
                  const newMax = Math.max(Number(e.target.value), priceRange[0])
                  setPriceRange([priceRange[0], newMax])
                }}
                aria-label="Maximum price"
                className="flex-1 h-2.5 bg-primary-100 rounded-full appearance-none cursor-pointer accent-primary-600 range-thumb-lg"
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
              🔄 Reset Filters
            </Button>
          )}
        </Section>

        {!isLoading && (
          <div className="text-sm font-medium text-neutral-600">
            Showing <span className="text-primary-700 font-bold">{filteredSweets.length}</span> of <span className="text-neutral-700 font-bold">{sweets.length}</span> sweets
          </div>
        )}

        <div ref={productsRef} />

        {isLoading ? (
          <Section title="Products" subtitle="Loading...">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </Section>
        ) : filteredSweets.length === 0 ? (
          <Section title="Products">
            <div className="py-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">No sweets found</h3>
              <p className="text-neutral-600 mb-8">
                {sweets.length === 0
                  ? "No sweets available yet. Check back soon!"
                  : "Try adjusting your filters to find what you're looking for."}
              </p>
              {sweets.length > 0 && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                    setPriceRange([0, maxPrice])
                  }}
                >
                  🔄 Clear All Filters
                </Button>
              )}
            </div>
          </Section>
        ) : (
          <Section title="Products" subtitle={`${filteredSweets.length} sweet${filteredSweets.length !== 1 ? 's' : ''} available`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          </Section>
        )}
      </div>
    </Container>
  )
}
