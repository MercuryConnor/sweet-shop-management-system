import React from "react"
import ProductList from "./components/ProductList"

export default function App(){
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-4">Sweet Shop</h1>
        <ProductList />
      </div>
    </div>
  )
}
