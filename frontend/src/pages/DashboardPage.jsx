import React from "react"
import { Container, Card, Button } from "../components"

/**
 * Dashboard page - User dashboard (placeholder)
 * TODO: Integrate with backend API for user data and sweets
 */
export default function DashboardPage() {
  return (
    <Container>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600">
            View and manage your Sweet Shop experience
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: "0", icon: "📦" },
            { label: "Favorite Items", value: "0", icon: "❤️" },
            { label: "Account Balance", value: "$0.00", icon: "💳" },
            { label: "Loyalty Points", value: "0", icon: "⭐" },
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

        {/* Quick Actions */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-neutral-900">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="primary">Browse Sweets</Button>
              <Button variant="secondary">View Orders</Button>
              <Button variant="secondary">My Favorites</Button>
              <Button variant="ghost">Account Settings</Button>
            </div>
          </div>
        </Card>

        {/* Empty State for Orders */}
        <Card>
          <div className="text-center space-y-4 py-12">
            <div className="text-6xl">📦</div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-neutral-900">
                No Orders Yet
              </h3>
              <p className="text-neutral-600">
                Start shopping to see your orders here
              </p>
            </div>
            <Button variant="primary">Shop Now</Button>
          </div>
        </Card>
      </div>
    </Container>
  )
}
