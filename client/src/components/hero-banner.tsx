import { useEffect, useState } from 'react';
import bannerImage from '@assets/banner, montesereno1_1758227216709.png';
import logoImage from '@assets/montesereno_logo_transparente_1758230566071.png';

export default function HeroBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Banner principal con animación de fade-in */}
      <div 
        className={`absolute inset-0 transition-all duration-2000 ease-out transform ${
          isVisible 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-105'
        }`}
      >
        <img 
          src={bannerImage}
          alt="Montesereno Glamping - Vista panorámica de montaña"
          className="w-full h-full object-cover"
        />
        
        {/* Overlay sutil para mejor legibilidad del logo */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Logo y texto centrados - posición más alta */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center z-20 transition-all duration-1800 delay-300 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
        style={{ transform: 'translateY(-2%)' }}
      >
        <div className="text-center">
          {/* Logo con animación */}
          <div 
            className={`transition-all duration-1500 delay-500 ease-out ${
              isVisible 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-6 scale-95'
            }`}
          >
            <img 
              src={logoImage}
              alt="Montesereno Glamping"
              className="w-[420px] h-64 lg:w-[520px] lg:h-80 mx-auto drop-shadow-2xl"
            />
          </div>
          
          {/* Texto con animación de deslizamiento */}
          <div 
            className={`mt-16 transition-all duration-1800 delay-1000 ease-out ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-[#33443C] mb-3 tracking-wide px-2 py-1 rounded inline-block" style={{backgroundColor: 'rgba(255,255,255,0.7)'}}>
              RECONECTA CON
            </h2>
            <h3 className="font-playfair text-3xl lg:text-4xl font-bold text-[#E0CBAD] mb-6 tracking-wide drop-shadow-lg">
              LO ESENCIAL
            </h3>
          </div>

          {/* Indicador de scroll con animación */}
          <div 
            className={`mt-12 transition-all duration-2000 delay-1500 ease-out ${
              isVisible 
                ? 'opacity-70 translate-y-0' 
                : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="flex flex-col items-center text-white animate-bounce">
              <p className="text-sm font-inter text-white mb-3 opacity-90 drop-shadow-lg">Desliza para explorar</p>
              <div className="w-6 h-10 border-2 border-white/80 rounded-full flex justify-center drop-shadow-lg">
                <div className="w-1 h-3 bg-white/80 rounded-full mt-2 animate-pulse"></div>
              </div>
              <svg className="w-5 h-5 mt-2 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}