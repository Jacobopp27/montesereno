import { Waves, Calendar, MapPin, ChevronLeft, ChevronRight, Utensils, Car } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface Activity {
  id: number;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  duration: string;
  location: string;
  includes: string; // JSON string
  isActive: boolean;
  iconType: string;
}

export default function ActivitiesSection() {
  const [currentActivityImages, setCurrentActivityImages] = useState<Record<number, number>>({});
  const [currentPaddleImage, setCurrentPaddleImage] = useState(0);
  const [currentDinnerImage, setCurrentDinnerImage] = useState(0);
  
  // Cargar actividades desde la API
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case 'paddle':
        return <Waves className="w-6 h-6 text-green-700" />;
      case 'dinner':
        return <Utensils className="w-6 h-6 text-green-700" />;
      case 'transport':
        return <Car className="w-6 h-6 text-green-700" />;
      default:
        return <Waves className="w-6 h-6 text-green-700" />;
    }
  };
  
  // Funciones para navegación manual de carruseles dinámicos
  const nextActivityImage = (activityId: number, imagesLength: number) => {
    setCurrentActivityImages(prev => ({
      ...prev,
      [activityId]: ((prev[activityId] || 0) + 1) % imagesLength
    }));
  };
  
  const prevActivityImage = (activityId: number, imagesLength: number) => {
    setCurrentActivityImages(prev => ({
      ...prev,
      [activityId]: ((prev[activityId] || 0) - 1 + imagesLength) % imagesLength
    }));
  };
  
  // Funciones para navegación manual de paddle surf
  const nextPaddleImage = () => {
    setCurrentPaddleImage((prev) => (prev + 1) % paddleSurfImages.length);
  };
  
  const prevPaddleImage = () => {
    setCurrentPaddleImage((prev) => (prev - 1 + paddleSurfImages.length) % paddleSurfImages.length);
  };
  
  // Funciones para navegación manual de cena
  const nextDinnerImage = () => {
    setCurrentDinnerImage((prev) => (prev + 1) % romanticDinnerImages.length);
  };
  
  const prevDinnerImage = () => {
    setCurrentDinnerImage((prev) => (prev - 1 + romanticDinnerImages.length) % romanticDinnerImages.length);
  };
  
  // Array de imágenes SVG para las clases de paddle surf
  const paddleSurfImages = [
    // Paddle surf en el mar
    <svg key="paddle1" viewBox="0 0 200 120" className="w-full h-full">
      <defs>
        <linearGradient id="ocean-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#7A946E", stopOpacity:0.6}} />
          <stop offset="100%" style={{stopColor:"#4682B4", stopOpacity:0.4}} />
        </linearGradient>
      </defs>
      {/* Cielo */}
      <rect width="200" height="60" fill="#87CEEB" opacity="0.3" />
      {/* Mar */}
      <rect y="60" width="200" height="60" fill="url(#ocean-gradient)" />
      {/* Olas */}
      <path d="M0,70 Q50,65 100,70 T200,70" stroke="#7A946E" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M0,80 Q50,75 100,80 T200,80" stroke="#7A946E" strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* Persona en paddle surf */}
      <ellipse cx="100" cy="85" rx="20" ry="4" fill="#8B4513" opacity="0.8" />
      <circle cx="100" cy="75" r="6" fill="#FFB6C1" opacity="0.8" />
      <rect x="98" y="78" width="4" height="8" fill="#4169E1" opacity="0.7" />
      {/* Remo */}
      <line x1="85" y1="70" x2="115" y2="90" stroke="#8B4513" strokeWidth="3" />
      <ellipse cx="115" cy="90" rx="4" ry="2" fill="#8B4513" opacity="0.8" />
      {/* Sol */}
      <circle cx="30" cy="20" r="8" fill="#FFD700" opacity="0.6" />
    </svg>,
    
    // Instructor enseñando
    <svg key="paddle2" viewBox="0 0 200 120" className="w-full h-full">
      <defs>
        <linearGradient id="beach-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#F4A460", stopOpacity:0.4}} />
          <stop offset="100%" style={{stopColor:"#7A946E", stopOpacity:0.3}} />
        </linearGradient>
      </defs>
      {/* Cielo */}
      <rect width="200" height="50" fill="#87CEEB" opacity="0.3" />
      {/* Playa */}
      <rect y="50" width="200" height="30" fill="url(#beach-gradient)" />
      {/* Mar */}
      <rect y="80" width="200" height="40" fill="#7A946E" opacity="0.4" />
      {/* Instructor */}
      <circle cx="80" cy="65" r="8" fill="#FFB6C1" opacity="0.8" />
      <rect x="77" y="70" width="6" height="12" fill="#FF6347" opacity="0.7" />
      {/* Estudiante */}
      <circle cx="120" cy="65" r="8" fill="#FFB6C1" opacity="0.8" />
      <rect x="117" y="70" width="6" height="12" fill="#4169E1" opacity="0.7" />
      {/* Tablas de paddle */}
      <ellipse cx="70" cy="90" rx="25" ry="5" fill="#FFFF99" opacity="0.7" />
      <ellipse cx="130" cy="90" rx="25" ry="5" fill="#FF69B4" opacity="0.7" />
      {/* Remos */}
      <line x1="60" y1="75" x2="85" y2="85" stroke="#8B4513" strokeWidth="3" />
      <line x1="135" y1="75" x2="110" y2="85" stroke="#8B4513" strokeWidth="3" />
    </svg>,
    
    // Equipo de paddle surf
    <svg key="paddle3" viewBox="0 0 200 120" className="w-full h-full">
      <defs>
        <linearGradient id="sand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#F4A460", stopOpacity:0.5}} />
          <stop offset="100%" style={{stopColor:"#DEB887", stopOpacity:0.3}} />
        </linearGradient>
      </defs>
      {/* Playa */}
      <rect width="200" height="120" fill="url(#sand-gradient)" />
      {/* Tablas de paddle surf */}
      <ellipse cx="60" cy="60" rx="35" ry="8" fill="#00CED1" opacity="0.8" />
      <ellipse cx="140" cy="60" rx="35" ry="8" fill="#FF1493" opacity="0.8" />
      <ellipse cx="100" cy="80" rx="35" ry="8" fill="#32CD32" opacity="0.8" />
      {/* Remos */}
      <line x1="30" y1="40" x2="90" y2="40" stroke="#8B4513" strokeWidth="4" />
      <ellipse cx="30" cy="40" rx="6" ry="3" fill="#8B4513" opacity="0.8" />
      <line x1="110" y1="40" x2="170" y2="40" stroke="#8B4513" strokeWidth="4" />
      <ellipse cx="170" cy="40" rx="6" ry="3" fill="#8B4513" opacity="0.8" />
      {/* Chaleco salvavidas */}
      <ellipse cx="100" cy="100" rx="15" ry="8" fill="#FF4500" opacity="0.8" />
      <rect x="93" y="95" width="14" height="10" fill="#FF4500" opacity="0.8" />
    </svg>
  ];
  
  // Array de imágenes SVG para la cena romántica
  const romanticDinnerImages = [
    // Mesa con velas y vista al mar
    <svg key="dinner1" viewBox="0 0 200 120" className="w-full h-full">
      <defs>
        <linearGradient id="sunset" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#ff6b6b", stopOpacity:0.3}} />
          <stop offset="100%" style={{stopColor:"#ffd93d", stopOpacity:0.2}} />
        </linearGradient>
      </defs>
      {/* Fondo atardecer */}
      <rect width="200" height="120" fill="url(#sunset)" />
      {/* Mar */}
      <path d="M0,80 Q50,75 100,80 T200,80 L200,120 L0,120 Z" fill="#7A946E" opacity="0.4" />
      {/* Mesa */}
      <ellipse cx="100" cy="85" rx="40" ry="15" fill="#8B4513" opacity="0.8" />
      {/* Platos */}
      <circle cx="85" cy="80" r="8" fill="#F5F5DC" opacity="0.9" />
      <circle cx="115" cy="80" r="8" fill="#F5F5DC" opacity="0.9" />
      {/* Velas */}
      <rect x="98" y="70" width="4" height="15" fill="#8B4513" />
      <ellipse cx="100" cy="68" rx="3" ry="8" fill="#FFD700" opacity="0.7" />
      {/* Copas */}
      <path d="M75,75 L75,85 M75,80 L82,80" stroke="#7A946E" strokeWidth="2" fill="none" opacity="0.8" />
      <path d="M125,75 L125,85 M125,80 L132,80" stroke="#7A946E" strokeWidth="2" fill="none" opacity="0.8" />
    </svg>,
    
    // Botella de vino y copas
    <svg key="dinner2" viewBox="0 0 200 120" className="w-full h-full">
      <defs>
        <radialGradient id="wine" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{stopColor:"#722F37", stopOpacity:0.8}} />
          <stop offset="100%" style={{stopColor:"#8B0000", stopOpacity:0.6}} />
        </radialGradient>
      </defs>
      {/* Fondo elegante */}
      <rect width="200" height="120" fill="#F5F5DC" opacity="0.3" />
      {/* Mesa */}
      <ellipse cx="100" cy="90" rx="60" ry="20" fill="#8B4513" opacity="0.6" />
      {/* Botella de vino */}
      <rect x="95" y="40" width="10" height="40" fill="#2F4F2F" opacity="0.8" />
      <rect x="93" y="35" width="14" height="8" fill="#2F4F2F" opacity="0.8" />
      <rect x="97" y="45" width="6" height="25" fill="url(#wine)" />
      {/* Copas de vino */}
      <path d="M70,60 Q70,50 75,50 Q80,50 80,60 L80,75 L70,75 Z" fill="#F5F5DC" opacity="0.7" />
      <path d="M120,60 Q120,50 125,50 Q130,50 130,60 L130,75 L120,75 Z" fill="#F5F5DC" opacity="0.7" />
      {/* Vino en las copas */}
      <path d="M72,65 Q72,55 75,55 Q78,55 78,65 L78,72 L72,72 Z" fill="url(#wine)" />
      <path d="M122,65 Q122,55 125,55 Q128,55 128,65 L128,72 L122,72 Z" fill="url(#wine)" />
      {/* Decoración */}
      <circle cx="60" cy="70" r="3" fill="#FFD700" opacity="0.5" />
      <circle cx="140" cy="70" r="3" fill="#FFD700" opacity="0.5" />
    </svg>,
    
    // Terraza con vista al mar
    <svg key="dinner3" viewBox="0 0 200 120" className="w-full h-full">
      <defs>
        <linearGradient id="ocean" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#7A946E", stopOpacity:0.4}} />
          <stop offset="100%" style={{stopColor:"#4682B4", stopOpacity:0.3}} />
        </linearGradient>
      </defs>
      {/* Cielo */}
      <rect width="200" height="60" fill="#E6E6FA" opacity="0.3" />
      {/* Mar */}
      <rect y="60" width="200" height="60" fill="url(#ocean)" />
      {/* Olas */}
      <path d="M0,65 Q50,60 100,65 T200,65" stroke="#7A946E" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M0,70 Q50,65 100,70 T200,70" stroke="#7A946E" strokeWidth="1" fill="none" opacity="0.4" />
      {/* Terraza */}
      <rect y="90" width="200" height="30" fill="#D2B48C" opacity="0.5" />
      {/* Mesa romántica */}
      <ellipse cx="100" cy="100" rx="25" ry="8" fill="#8B4513" opacity="0.8" />
      {/* Sillas */}
      <rect x="70" y="95" width="8" height="15" fill="#8B4513" opacity="0.6" />
      <rect x="122" y="95" width="8" height="15" fill="#8B4513" opacity="0.6" />
      {/* Velas románticas */}
      <circle cx="90" cy="97" r="2" fill="#FFD700" opacity="0.8" />
      <circle cx="110" cy="97" r="2" fill="#FFD700" opacity="0.8" />
      {/* Estrellas */}
      <circle cx="30" cy="20" r="1" fill="#FFD700" opacity="0.7" />
      <circle cx="170" cy="15" r="1" fill="#FFD700" opacity="0.7" />
      <circle cx="150" cy="25" r="1" fill="#FFD700" opacity="0.7" />
    </svg>
  ];

  // Cambiar imágenes cada 3 segundos
  useEffect(() => {
    const dinnerInterval = setInterval(() => {
      setCurrentDinnerImage((prev) => (prev + 1) % romanticDinnerImages.length);
    }, 3000);
    
    const paddleInterval = setInterval(() => {
      setCurrentPaddleImage((prev) => (prev + 1) % paddleSurfImages.length);
    }, 3500); // Ligeramente diferente para que no cambien al mismo tiempo
    
    return () => {
      clearInterval(dinnerInterval);
      clearInterval(paddleInterval);
    };
  }, []);

  return (
    <section className="py-16 bg-gradient-to-br from-nature-background to-nature-beige">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-nature-text mb-4">
            Actividades Especiales
          </h2>
          <p className="font-inter text-lg text-nature-text/80 max-w-2xl mx-auto">
            Enriquece tu experiencia en Montesereno Glamping con nuestras actividades exclusivas
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Clases de Paddle Surf */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-elegant hover:shadow-elegant-lg transition-all duration-300 transform hover:scale-105">
            <div className="relative w-full h-40 mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-[#7A946E]/10 to-[#5a7052]/10 border-2 border-[#7A946E]/20">
              <div className="transition-all duration-1000 ease-in-out">
                {paddleSurfImages[currentPaddleImage]}
              </div>
              {/* Flechas de navegación */}
              <button
                onClick={prevPaddleImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="w-4 h-4 text-[#7A946E]" />
              </button>
              <button
                onClick={nextPaddleImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="w-4 h-4 text-[#7A946E]" />
              </button>
              {/* Indicadores de puntos */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {paddleSurfImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPaddleImage(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentPaddleImage
                        ? 'bg-[#7A946E]'
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </div>
            <h3 className="font-playfair text-2xl font-bold text-nature-text mb-4 text-center">
              Clases de Paddle Surf
            </h3>
            <p className="font-inter text-nature-text/70 mb-6 text-center">
              Aprende paddle surf con instructores expertos en las tranquilas aguas del Caribe. 
              Perfecto para principiantes y avanzados.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-nature-text/80">
                <Calendar className="w-4 h-4 mr-2 text-[#7A946E]" />
                <span className="font-inter text-sm">2 horas de clase</span>
              </div>
              <div className="flex items-center text-nature-text/80">
                <MapPin className="w-4 h-4 mr-2 text-[#7A946E]" />
                <span className="font-inter text-sm">Playa privada frente a las cabañas</span>
              </div>
            </div>
            <div className="text-center">
              <span className="font-playfair text-2xl font-bold text-[#7A946E]">
                $150.000 COP
              </span>
              <p className="font-inter text-xs text-nature-text/60 mt-1">
                Por persona · Incluye equipo completo
              </p>
            </div>
          </div>

          {/* Cena Romántica */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-elegant hover:shadow-elegant-lg transition-all duration-300 transform hover:scale-105">
            <div className="relative w-full h-40 mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-[#7A946E]/10 to-[#5a7052]/10 border-2 border-[#7A946E]/20">
              <div className="transition-all duration-1000 ease-in-out">
                {romanticDinnerImages[currentDinnerImage]}
              </div>
              {/* Flechas de navegación */}
              <button
                onClick={prevDinnerImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="w-4 h-4 text-[#7A946E]" />
              </button>
              <button
                onClick={nextDinnerImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="w-4 h-4 text-[#7A946E]" />
              </button>
              {/* Indicadores de puntos */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {romanticDinnerImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentDinnerImage(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentDinnerImage
                        ? 'bg-[#7A946E]'
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </div>
            <h3 className="font-playfair text-2xl font-bold text-nature-text mb-4 text-center">
              Cena Romántica
            </h3>
            <p className="font-inter text-nature-text/70 mb-6 text-center">
              Una experiencia gastronómica única bajo las estrellas, con vista al mar y 
              un ambiente íntimo y especial.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-nature-text/80">
                <Calendar className="w-4 h-4 mr-2 text-[#7A946E]" />
                <span className="font-inter text-sm">Dos platos de la carta</span>
              </div>
              <div className="flex items-center text-nature-text/80">
                <MapPin className="w-4 h-4 mr-2 text-[#7A946E]" />
                <span className="font-inter text-sm">Terraza privada con vista al mar</span>
              </div>
            </div>
            <div className="text-center">
              <span className="font-playfair text-2xl font-bold text-[#7A946E]">
                $180.000 COP
              </span>
              <p className="font-inter text-xs text-nature-text/60 mt-1">
                Para 2 personas · Incluye botella de vino
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="font-inter text-nature-text/70 mb-4">
            Las actividades se pueden reservar directamente en la recepción
          </p>
          <button className="bg-[hsl(var(--nature-button))] hover:bg-[hsl(var(--nature-button-hover))] text-white px-8 py-3 rounded-lg font-inter font-semibold transition-all transform hover:scale-105 shadow-elegant">
            Consultar Disponibilidad
          </button>
        </div>
      </div>
    </section>
  );
}