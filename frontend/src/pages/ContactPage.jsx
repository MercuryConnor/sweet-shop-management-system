import React, { useState } from "react"
import { Container, Section, Input, Button } from "../components"
import { useToast } from "../hooks"

export default function ContactPage() {
  const toast = useToast()
  const [form, setForm] = useState({ name: "", email: "", message: "" })

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    toast.success("Message received")
    setForm({ name: "", email: "", message: "" })
  }

  return (
    <Container size="lg">
      <div className="py-10 md:py-14 space-y-8">
        <Section title="Contact Us" subtitle="We love hearing from you">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
            <Input
              label="Name"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-2">Message</label>
              <textarea
                className="w-full border border-neutral-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none min-h-[140px]"
                placeholder="Tell us about your order, gifting needs, or feedback."
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
                required
              />
            </div>
            <Button type="submit">Submit</Button>
          </form>
        </Section>
      </div>
    </Container>
  )
}
