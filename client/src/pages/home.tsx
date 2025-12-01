import Navigation from "@/components/navigation";
import HeroBanner from "@/components/hero-banner";
import HeroCarousel from "@/components/hero-carousel";
import BookingWidget from "@/components/booking-widget";
import PricingSection from "@/components/pricing-section";
import AmenitiesSection from "@/components/amenities-section";
import ActivitiesSection from "@/components/activities-section-new";
import GallerySection from "@/components/gallery-section";
import ReviewsSection from "@/components/reviews-section";
import ContactSection from "@/components/contact-section";
import PoliciesSection from "@/components/policies-section";
import Footer from "@/components/footer";
import { GLAMPING } from '@/config/glamping';

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <HeroBanner />
      <Navigation />
      
      {/* Property Overview Section - Descripción */}
      <section id="overview" className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center">
            <div className="flex flex-col items-center text-center max-w-6xl">

              
              <h2 className="font-playfair font-semibold text-4xl text-white mb-6 tracking-wider">
                {GLAMPING.brand} - Experiencia de Montaña
              </h2>
              
              <div className="flex items-center justify-center text-white mb-8 space-x-6 flex-wrap">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Hasta 6 huéspedes</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  <span>Glamping de montaña</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                  </svg>
                  <span>Baño privado</span>
                </div>
              </div>
              
              <p className="text-lg text-white leading-relaxed mb-8 max-w-4xl">
                <strong className="text-white font-semibold">{GLAMPING.hero.title}.</strong> {GLAMPING.hero.subtitle} Una experiencia única donde la naturaleza y el confort se encuentran para crear momentos inolvidables.
              </p>
              
              <div className="mb-8 w-full max-w-5xl">
                <HeroCarousel />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <PricingSection />
      <BookingWidget />
      <AmenitiesSection />
      <ActivitiesSection />
      <GallerySection />
      <ReviewsSection />
      <ContactSection />
      <PoliciesSection />
      <Footer />
    </div>
  );
}
