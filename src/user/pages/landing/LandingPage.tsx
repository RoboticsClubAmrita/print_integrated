import { LandingNav } from '@/components/landing/LandingNav'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FeatureGrid } from '@/components/landing/FeatureGrid'
import { PricingSection } from '@/components/landing/PricingSection'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function LandingPage() {
  useDocumentTitle('Campus printing, minus the queue')

  return (
    <div className="min-h-screen bg-bg">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <FeatureGrid />
      <PricingSection />
      <LandingFooter />
    </div>
  )
}
