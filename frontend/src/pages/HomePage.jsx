import React from "react"
import { Container, Card, Button } from "../components"

/**
 * Home page - Landing page for Sweet Shop
 */
export default function HomePage() {
  return (
    <Container>
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900">
            Welcome to Sweet Shop
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Discover the finest selection of delicious sweets, cakes, and confections
            crafted with love and premium ingredients.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary">Browse Sweets</Button>
            <Button variant="secondary">Learn More</Button>
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-900">Featured Sweets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Chocolate Truffle",
                category: "Chocolate",
                price: 5.99,
              },
              {
                name: "Strawberry Tart",
                category: "Pastry",
                price: 7.99,
              },
              {
                name: "Vanilla Cupcake",
                category: "Cake",
                price: 3.99,
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
                      ${sweet.price.toFixed(2)}
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
            { title: "Fresh Ingredients", desc: "Made with the finest ingredients" },
            { title: "Fast Delivery", desc: "Quick and reliable shipping" },
            { title: "Customer Support", desc: "Available 24/7 for assistance" },
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
