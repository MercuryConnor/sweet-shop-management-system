import React from "react"
import { useNavigate } from "react-router-dom"
import { Container, Section, Button } from "../components"

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <Container size="lg">
      <div className="py-10 md:py-14 space-y-10">
        <Section title="Our Story" subtitle="Crafted in India, inspired by family kitchens">
          <div className="space-y-6 text-neutral-700 leading-relaxed">
            <p>
              Sweet Shop began as a family kitchen in India, where festive trays of gulab jamun, rasmalai,
              and kaju katli were lovingly prepared with desi ghee and slow-roasted nuts. What started
              as gifting boxes for neighbors grew into a full mithai kitchen that still follows the same
              small-batch techniques and heirloom recipes.
            </p>
            <p>
              Every sweet is hand-rolled, simmered, or roasted in copper dekchis to lock in authentic
              flavor. We source premium pista, kaju, and saffron, and never compromise on ingredients or
              craft. From Diwali hampers to everyday chai companions, our mithai is made to celebrate
              togetherness.
            </p>
            <p>
              Today we ship pan-India while keeping our heart in the kitchen. Each box is packed to stay
              fresh on the journey to your home, with the same care our family started with.
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => navigate("/dashboard")}>Browse Sweets</Button>
            <Button variant="secondary" onClick={() => navigate("/contact")}>Contact Us</Button>
          </div>
        </Section>
      </div>
    </Container>
  )
}
