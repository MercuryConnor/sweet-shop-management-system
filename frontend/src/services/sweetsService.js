import api from "./api"

/**
 * Sweets/Products API service
 * Handles all API calls related to sweets browsing and purchasing
 */

/**
 * Fetch all sweets
 * @param {number} skip - Number of sweets to skip (pagination)
 * @param {number} limit - Number of sweets to return
 * @returns {Promise<Array>} Array of sweet objects
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
 * @param {string} query - Search query string
 * @param {number} skip - Number of sweets to skip (pagination)
 * @param {number} limit - Number of sweets to return
 * @returns {Promise<Array>} Array of matching sweet objects
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
 * Requires authentication (token in Authorization header)
 * @param {number} sweetId - ID of the sweet to purchase
 * @param {number} quantity - Quantity to purchase (default 1)
 * @returns {Promise<Object>} Purchase confirmation
 * @throws {Error} If sweet is out of stock (400) or auth failed (401)
 */
export const purchaseSweet = async (sweetId, quantity = 1) => {
  try {
    const response = await api.post(`/api/sweets/${sweetId}/purchase`, {
      quantity,
    })
    return response.data
  } catch (error) {
    // Handle specific error cases
    if (error.response?.status === 400) {
      const detail = error.response?.data?.detail
      if (detail?.includes("out of stock")) {
        throw new Error("This sweet is out of stock")
      } else if (detail?.includes("Insufficient")) {
        throw new Error("Not enough in stock. Please reduce quantity.")
      }
      throw new Error(detail || "Cannot purchase at this time")
    } else if (error.response?.status === 401) {
      throw new Error("Please log in to purchase")
    }
    throw new Error("Purchase failed. Please try again.")
  }
}

export default {
  fetchSweets,
  searchSweets,
  purchaseSweet,
}
