import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroBanner {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
  isActive: boolean;
  displayOrder: number;
}

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["/api/hero-banners"],
    retry: false,
  });

  const activeBanners = (banners as HeroBanner[] | undefined)?.filter((banner: HeroBanner) => banner.isActive) || [];

  // Auto-advance carousel (pause when user is interacting)
  useEffect(() => {
    if (activeBanners.length > 1 && !isUserInteracting) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % activeBanners.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [activeBanners.length, isUserInteracting]);

  // Resume auto-advance after user interaction
  useEffect(() => {
    if (isUserInteracting) {
      const timer = setTimeout(() => {
        setIsUserInteracting(false);
      }, 8000); // Resume auto-advance after 8 seconds of no interaction

      return () => clearTimeout(timer);
    }
  }, [isUserInteracting]);

  const nextSlide = () => {
    setIsUserInteracting(true);
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = () => {
    setIsUserInteracting(true);
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const goToSlide = (index: number) => {
    setIsUserInteracting(true);
    setCurrentIndex(index);
  };

  const handleButtonClick = (buttonUrl: string) => {
    if (buttonUrl.startsWith('#')) {
      // Scroll to element with id
      const element = document.querySelector(buttonUrl);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to URL
      window.open(buttonUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-96 bg-gradient-to-br from-[#7A946E]/20 to-blue-100 flex items-center justify-center">
        <div className="text-[#7A946E] text-lg">Cargando...</div>
      </div>
    );
  }

  if (!activeBanners.length) {
    return (
      <div className="relative w-full h-96 bg-gradient-to-br from-[#7A946E]/20 to-blue-100 flex items-center justify-center">
        <div className="text-center text-[#7A946E]">
          <h2 className="text-2xl font-playfair mb-2">Bienvenido a Montesereno Glamping</h2>
          <p className="text-lg">Tu experiencia de montaña perfecta te espera</p>
        </div>
      </div>
    );
  }

  const currentBanner = activeBanners[currentIndex];

  console.log("Current banner:", currentBanner);
  console.log("Image URL:", currentBanner.imageUrl);

  return (
    <div className="relative w-full h-[28rem] overflow-hidden rounded-lg shadow-lg bg-gradient-to-br from-[#7A946E] to-[#4682B4]">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={currentBanner.imageUrl} 
          alt={currentBanner.title}
          className="w-full h-full object-cover transition-all duration-700 ease-in-out antialiased image-quality-high"
          style={{ 
            imageRendering: 'auto',
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            console.error("Error loading image:", currentBanner.imageUrl);
            // Fallback to a gradient background
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.style.background = 'linear-gradient(135deg, #7A946E 0%, #4682B4 100%)';
            }
          }}
          onLoad={() => {
            console.log("Image loaded successfully:", currentBanner.imageUrl);
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
      </div>

      {/* Wave Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 z-10">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <pattern id="wave-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M0,25 Q12.5,15 25,25 T50,25 V50 H0 Z"
                fill="currentColor"
                opacity="0.1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wave-pattern)" className="text-white" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-20 flex items-center justify-center h-full px-4">
        <div className="text-center text-white max-w-3xl mx-auto absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-4xl md:text-5xl font-playfair mb-4 drop-shadow-lg">
            {currentBanner.title}
          </h1>
          {currentBanner.description && (
            <p className="text-lg md:text-xl mb-8 opacity-90 drop-shadow-md">
              {currentBanner.description}
            </p>
          )}
          {currentBanner.buttonText && currentBanner.buttonUrl && (
            <Button
              onClick={() => handleButtonClick(currentBanner.buttonUrl)}
              style={{backgroundColor: '#E0CBAD', color: '#33443C'}} className="hover:opacity-90 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {currentBanner.buttonText}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 backdrop-blur-sm rounded-full p-4 transition-all duration-300 shadow-lg hover:shadow-xl z-20 border-2 border-white/20" style={{backgroundColor: '#E0CBAD80'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E0CBAD'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0CBAD80'}
            aria-label="Anterior"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 backdrop-blur-sm rounded-full p-4 transition-all duration-300 shadow-lg hover:shadow-xl z-20 border-2 border-white/20" style={{backgroundColor: '#E0CBAD80'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E0CBAD'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0CBAD80'}
            aria-label="Siguiente"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {activeBanners.map((_: HeroBanner, index: number) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 border-2 ${
                index === currentIndex
                  ? 'border-white scale-125 shadow-lg' : 'bg-white/30 border-white/50 hover:bg-white/60 hover:border-white/80'
              }} style={{backgroundColor: index === currentIndex ? '#E0CBAD' : undefined
              }`}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {activeBanners.length > 1 && (
        <div className="absolute top-4 right-4 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-semibold shadow-lg z-20 border border-white/20" style={{backgroundColor: '#E0CBAD80'}}>
          {currentIndex + 1} / {activeBanners.length}
        </div>
      )}
    </div>
  );
}