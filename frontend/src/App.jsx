import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AppLayout, ProtectedRoute } from "./components"
import { AuthProvider } from "./context"
import {
  HomePage,
  LoginPage,
  RegisterPage,
  DashboardPage,
  AdminPage,
} from "./pages"

/**
 * Main App component with routing and auth provider
 */
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            {/* 404 Route */}
            <Route
              path="*"
              element={
                <div className="text-center py-12">
                  <h1 className="text-3xl font-bold text-neutral-900">
                    Page Not Found
                  </h1>
                  <p className="text-neutral-600 mt-2">
                    The page you're looking for doesn't exist.
                  </p>
                </div>
              }
            />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  )
}
