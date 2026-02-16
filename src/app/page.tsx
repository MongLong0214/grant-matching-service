import { HeroSection } from '@/components/landing/hero-section'
import { TrustBar } from '@/components/landing/trust-bar'
import { StatsSection } from '@/components/landing/stats-section'
import { HowItWorks } from '@/components/landing/how-it-works'
import { FeaturesSection } from '@/components/landing/features-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { FaqSection } from '@/components/landing/faq-section'
import { FinalCta } from '@/components/landing/final-cta'

const HomePage = () => {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <TrustBar />
      <StatsSection />
      <HowItWorks />
      <FeaturesSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCta />
    </div>
  )
}

export default HomePage
