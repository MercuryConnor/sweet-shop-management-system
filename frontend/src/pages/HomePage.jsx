import React from "react"
import { useNavigate } from "react-router-dom"
import { Container, Card, Button } from "../components"
import { formatPrice } from "../utils"

/**
 * Home page - Landing page for Sweet Shop
 */
export default function HomePage() {
  const navigate = useNavigate()

  const handleBrowse = () => {
    navigate("/dashboard", { state: { scrollTo: "products" } })
  }

  const handleLearnMore = () => {
    navigate("/about")
  }

  return (
    <Container>
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900">
            Handcrafted Indian Mithai, Delivered Fresh
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Celebrate every festival and family moment with rich, traditional sweets made in small batches with desi ghee and premium dry fruits.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" onClick={handleBrowse}>Browse Sweets</Button>
            <Button variant="secondary" onClick={handleLearnMore}>Learn More</Button>
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-900">Featured Sweets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Gulab Jamun",
                category: "Traditional",
                price: 149,
              },
              {
                name: "Rasmalai",
                category: "Milk-based",
                price: 199,
              },
              {
                name: "Kaju Katli",
                category: "Dry Fruit",
                price: 249,
              },
            ].map((sweet) => (
              <Card key={sweet.name} clickable>
                <div className="space-y-3">
                  <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-md flex items-center justify-center">
                    <span className="text-4xl">🍰</span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {sweet.name}
                  </h3>
                  <p className="text-sm text-neutral-600">{sweet.category}</p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xl font-bold text-primary-600">
                      {formatPrice(sweet.price)}
                    </span>
                    <Button variant="primary" className="px-3 py-1 text-sm">
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Made in Small Batches", desc: "Hand-rolled, slow-cooked mithai with desi ghee and premium nuts." },
            { title: "Pan-India Delivery", desc: "Carefully packed to arrive fresh for every festival and celebration." },
            { title: "Support in English & Hindi", desc: "Talk to our team for custom boxes and bulk gifting." },
          ].map((item) => (
            <Card key={item.title}>
              <div className="text-center space-y-3">
                <div className="text-4xl">✨</div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-neutral-600">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Container>
  )
}
