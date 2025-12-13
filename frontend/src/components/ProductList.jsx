import React from "react"

export default function ProductList(){
  // Placeholder UI; connect to API with Axios + React Query
  return (
    <div className="bg-white shadow rounded p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Products</h2>
        <button className="px-3 py-1 bg-indigo-600 text-white rounded">New</button>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div className="p-3 border rounded">
          <div className="flex justify-between">
            <div>
              <div className="font-semibold">Sample Cake</div>
              <div className="text-sm text-gray-600">Tasty cake</div>
            </div>
            <div className="text-indigo-600 font-medium">$4.50</div>
          </div>
        </div>
      </div>
    </div>
  )
}
