import { useState, useEffect } from "react";
import { GLAMPING } from '@/config/glamping';
import logoUrl from '@assets/logo completo sin fondo_1758226482136.png';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show navbar when scrolled past the hero section
      const heroHeight = window.innerHeight;
      setIsVisible(window.scrollY > heroHeight - 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav 
      className={`bg-[hsl(var(--nature-button))]/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 shadow-elegant transition-all duration-500 ease-out ${
        isVisible 
          ? 'transform translate-y-0 opacity-100' 
          : 'transform -translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              <img 
                src={logoUrl} 
                alt={`${GLAMPING.brand} Logo`} 
                className="w-40 h-20 object-cover drop-shadow-lg"
              />
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button 
                onClick={() => scrollToSection('overview')}
                className="text-white hover:text-nature-sand transition-colors cursor-pointer font-inter font-medium"
              >
                Descripción
              </button>
              <button 
                onClick={() => scrollToSection('amenities')}
                className="text-white hover:text-nature-sand transition-colors cursor-pointer font-inter font-medium"
              >
                Amenidades
              </button>
              <button 
                onClick={() => scrollToSection('gallery')}
                className="text-white hover:text-nature-sand transition-colors cursor-pointer font-inter font-medium"
              >
                Galería
              </button>
              <button 
                onClick={() => scrollToSection('reviews')}
                className="text-white hover:text-nature-sand transition-colors cursor-pointer font-inter font-medium"
              >
                Reseñas
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-white hover:text-nature-sand transition-colors cursor-pointer font-medium"
              >
                Contacto
              </button>
              <button 
                onClick={() => scrollToSection('politicas')}
                className="text-white hover:text-nature-sand transition-colors cursor-pointer font-inter font-medium"
              >
                Políticas
              </button>
            </div>
          </div>
          
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-nature-sand transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[hsl(var(--nature-button))] border-t border-nature-sand">
              <button 
                onClick={() => scrollToSection('overview')}
                className="block text-white hover:text-nature-sand transition-colors w-full text-left px-3 py-2 font-medium"
              >
                Descripción
              </button>
              <button 
                onClick={() => scrollToSection('amenities')}
                className="block text-white hover:text-nature-sand transition-colors w-full text-left px-3 py-2 font-medium"
              >
                Amenidades
              </button>
              <button 
                onClick={() => scrollToSection('gallery')}
                className="block text-white hover:text-nature-sand transition-colors w-full text-left px-3 py-2 font-medium"
              >
                Galería
              </button>
              <button 
                onClick={() => scrollToSection('reviews')}
                className="block text-white hover:text-nature-sand transition-colors w-full text-left px-3 py-2 font-medium"
              >
                Reseñas
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="block text-white hover:text-nature-sand transition-colors w-full text-left px-3 py-2 font-medium"
              >
                Contacto
              </button>
              <button 
                onClick={() => scrollToSection('politicas')}
                className="block text-white hover:text-nature-sand transition-colors w-full text-left px-3 py-2 font-medium"
              >
                Políticas
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}