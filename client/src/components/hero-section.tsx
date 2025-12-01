
import { GLAMPING } from '@/config/glamping';

export default function HeroSection() {
  const scrollToBooking = () => {
    const bookingElement = document.querySelector('[data-booking-widget]');
    if (bookingElement) {
      bookingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const scrollToGallery = () => {
    const galleryElement = document.getElementById('gallery');
    if (galleryElement) {
      galleryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-nature-beige via-nature-background to-nature-sand texture-ocean-waves">
      {/* Textura elegante de fondo */}
      <div className="absolute inset-0 texture-waves opacity-20"></div>
      
      {/* Patrón de olas SVG mejorado */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wave-pattern" x="0" y="0" width="200" height="80" patternUnits="userSpaceOnUse">
              <path d="M0,40 C50,20 100,60 200,40" stroke="#4C622E" strokeWidth="2" fill="none" opacity="0.25"/>
              <path d="M0,50 C50,30 100,70 200,50" stroke="#4C622E" strokeWidth="1.5" fill="none" opacity="0.15"/>
              <path d="M0,30 C50,10 100,50 200,30" stroke="#4C622E" strokeWidth="1" fill="none" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wave-pattern)"/>
        </svg>
      </div>
      
      <div className="relative z-10 text-center text-nature-text max-w-4xl mx-auto px-4 rounded-3xl p-8 backdrop-blur-sm glass-effect">
        <h1 className="font-playfair font-semibold text-5xl md:text-7xl mb-6 leading-tight tracking-wider">
          {GLAMPING.hero.title.split(' ').slice(0, 2).join(' ')}<br />
          <span className="text-gold">{GLAMPING.hero.title.split(' ').slice(2).join(' ')}</span>
        </h1>
        <p className="font-inter text-xl md:text-2xl mb-8 font-light max-w-2xl mx-auto">
          {GLAMPING.hero.subtitle}
        </p>
        <div className="flex justify-center">
          <button 
            onClick={scrollToBooking}
            className="bg-[hsl(var(--nature-button))] hover:bg-[hsl(var(--nature-button-hover))] text-white px-8 py-4 rounded-lg font-inter font-semibold text-lg transition-all transform hover:scale-105 shadow-elegant hover:shadow-elegant-lg"
          >
            <span className="hidden sm:inline">{GLAMPING.hero.ctaText}</span>
            <span className="sm:hidden">{GLAMPING.hero.ctaText.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
