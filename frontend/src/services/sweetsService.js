import api from "./api"

/**
 * Fetch all sweets
 */
export const fetchSweets = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get("/api/sweets", {
      params: { skip, limit },
    })
    return response.data
  } catch (error) {
    console.error("Failed to fetch sweets:", error)
    throw new Error("Failed to load sweets. Please try again.")
  }
}

/**
 * Search sweets by name
 */
export const searchSweets = async (query, skip = 0, limit = 100) => {
  try {
    const response = await api.get("/api/sweets/search", {
      params: { q: query, skip, limit },
    })
    return response.data
  } catch (error) {
    console.error("Failed to search sweets:", error)
    throw new Error("Search failed. Please try again.")
  }
}

/**
 * Purchase a sweet
 */
export const purchaseSweet = async (sweetId, quantity = 1) => {
  try {
    const response = await api.post(`/api/sweets/${sweetId}/purchase`, {
      quantity,
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error(error.response?.data?.detail || "Out of stock")
    }
    if (error.response?.status === 401) {
      throw new Error("Please log in to purchase")
    }
    throw new Error("Purchase failed. Please try again.")
  }
}

/**
 * Restock a sweet (admin only)
 */
export const restockSweet = async (sweetId, quantity) => {
  try {
    const response = await api.post(`/api/sweets/${sweetId}/restock`, {
      quantity,
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Admin access required to restock")
    }
    if (error.response?.status === 404) {
      throw new Error("Sweet not found")
    }
    throw new Error("Restock failed. Please try again.")
  }
}

/**
 * Create a new sweet (admin only)
 */
export const createSweet = async (sweetData) => {
  try {
    const response = await api.post("/api/sweets", sweetData)
    return response.data
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Admin access required to add sweets")
    }
    if (error.response?.status === 422) {
      throw new Error("Invalid sweet data")
    }
    throw new Error("Could not create sweet. Please try again.")
  }
}

/**
 * Update sweet price (admin only)
 */
export const updateSweetPrice = async (sweetId, newPrice) => {
  try {
    const response = await api.put(`/api/sweets/${sweetId}`, { price: newPrice })
    return response.data
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Admin access required")
    }
    if (error.response?.status === 404) {
      throw new Error("Sweet not found")
    }
    if (error.response?.status === 422) {
      const detail = error.response?.data?.detail
      if (Array.isArray(detail) && detail[0]?.msg) {
        throw new Error(detail[0].msg)
      }
      throw new Error(detail || "Invalid price")
    }
    throw new Error("Could not update price. Please try again.")
  }
}

/**
 * Delete a sweet (admin only)
 */
export const deleteSweet = async (sweetId) => {
  try {
    await api.delete(`/api/sweets/${sweetId}`)
    return true
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Admin access required")
    }
    if (error.response?.status === 404) {
      throw new Error("Sweet not found")
    }
    throw new Error("Could not delete sweet. Please try again.")
  }
}

export default {
  fetchSweets,
  searchSweets,
  purchaseSweet,
  restockSweet,
  createSweet,
  updateSweetPrice,
  deleteSweet,
}
