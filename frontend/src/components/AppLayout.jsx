import React from "react"
import Header from "./Header"
import Footer from "./Footer"

/**
 * AppLayout component wraps all pages with header and footer
 * @param {React.ReactNode} children - Page content
 */
export default function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-sweet-light">
      <Header />
      <main className="flex-1 py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}
