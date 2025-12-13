import React from "react"
import { Container, Card, Button } from "../components"

/**
 * Admin page - Admin panel (placeholder)
 * TODO: Implement admin features for inventory management
 */
export default function AdminPage() {
  return (
    <Container>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900">Admin Panel</h1>
          <p className="text-neutral-600">
            Manage sweets, inventory, and orders
          </p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Sweets", value: "0", icon: "🍰" },
            { label: "Low Stock Items", value: "0", icon: "⚠️" },
            { label: "Recent Orders", value: "0", icon: "📋" },
          ].map((stat) => (
            <Card key={stat.label}>
              <div className="flex items-center gap-4">
                <div className="text-3xl">{stat.icon}</div>
                <div>
                  <p className="text-sm text-neutral-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Admin Actions */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-neutral-900">
              Admin Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="primary">Add New Sweet</Button>
              <Button variant="primary">Manage Inventory</Button>
              <Button variant="secondary">View All Orders</Button>
              <Button variant="secondary">User Management</Button>
              <Button variant="secondary">View Reports</Button>
              <Button variant="ghost">Settings</Button>
            </div>
          </div>
        </Card>

        {/* Coming Soon Section */}
        <Card>
          <div className="text-center space-y-4 py-12">
            <div className="text-6xl">🔧</div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-neutral-900">
                Admin Features Coming Soon
              </h3>
              <p className="text-neutral-600">
                Comprehensive inventory and order management tools will be available soon
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  )
}
