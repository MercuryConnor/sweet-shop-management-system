import React from "react"
import { Link } from "react-router-dom"
import { Container, Section, Card } from "../components"

export default function SupportPage() {
  return (
    <Container size="lg">
      <div className="py-10 md:py-14 space-y-10">
        <Section title="Support" subtitle="We are here to help with orders, gifting, and bulk requests">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="space-y-2">
                <p className="text-neutral-500 text-sm uppercase tracking-wide">Email</p>
                <p className="text-neutral-900 font-semibold">support@sweetshop.in</p>
                <p className="text-neutral-600 text-sm">We respond within 24 hours.</p>
              </div>
            </Card>
            <Card>
              <div className="space-y-2">
                <p className="text-neutral-500 text-sm uppercase tracking-wide">Phone</p>
                <p className="text-neutral-900 font-semibold">+91 98765 43210</p>
                <p className="text-neutral-600 text-sm">Daily 9:00 AM – 8:00 PM IST.</p>
              </div>
            </Card>
            <Card>
              <div className="space-y-2">
                <p className="text-neutral-500 text-sm uppercase tracking-wide">Support Hours</p>
                <p className="text-neutral-900 font-semibold">Mon – Sun</p>
                <p className="text-neutral-600 text-sm">Festival days covered with limited hours.</p>
              </div>
            </Card>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 mt-6">
            <p className="text-neutral-900 font-semibold mb-1">Frequently Asked Questions</p>
            <p className="text-neutral-600 mb-3">Coming soon. Meanwhile, reach us by email or phone for quick help.</p>
            <Link to="/contact" className="text-primary-700 font-medium underline">Go to Contact</Link>
          </div>
        </Section>
      </div>
    </Container>
  )
}
