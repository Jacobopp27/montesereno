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
  images: string; // JSON string de URLs de imágenes
  isActive: boolean;
  iconType: string;
}

export default function ActivitiesSection() {
  const [currentActivityImages, setCurrentActivityImages] = useState<Record<number, number>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
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
      case 'massage':
        return <Waves className="w-6 h-6 text-green-700" />; // Usando Waves por ahora, idealmente sería un icono de masaje
      default:
        return <Waves className="w-6 h-6 text-green-700" />;
    }
  };

  // SVG base para actividades
  const getActivitySVGs = (iconType: string) => {
    if (iconType === 'massage') {
      return [
        // Masaje relajante en la playa
        <svg key="massage1" viewBox="0 0 200 120" className="w-full h-full max-w-md mx-auto">
          <defs>
            <linearGradient id="spa-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#7A946E", stopOpacity:0.6}} />
              <stop offset="100%" style={{stopColor:"#5a7052", stopOpacity:0.4}} />
            </linearGradient>
          </defs>
          <rect width="200" height="60" fill="#F4A460" opacity="0.3" />
          <rect y="60" width="200" height="60" fill="url(#spa-gradient)" />
          <path d="M0,70 Q50,65 100,70 T200,70" stroke="#7A946E" strokeWidth="2" fill="none" opacity="0.7" />
          <rect x="70" y="70" width="60" height="20" rx="10" fill="#DEB887" opacity="0.8" />
          <circle cx="85" cy="65" r="5" fill="#FFB6C1" opacity="0.8" />
          <circle cx="115" cy="65" r="5" fill="#FFB6C1" opacity="0.8" />
          <path d="M75,75 Q85,70 95,75 Q105,80 115,75 Q125,70 135,75" stroke="#8B4513" strokeWidth="2" fill="none" />
          <circle cx="40" cy="20" r="8" fill="#FFD700" opacity="0.6" />
          <circle cx="160" cy="25" r="6" fill="#98FB98" opacity="0.5" />
          <circle cx="30" cy="45" r="4" fill="#98FB98" opacity="0.4" />
        </svg>,
        
        // Aceites esenciales y relajación
        <svg key="massage2" viewBox="0 0 200 120" className="w-full h-full max-w-md mx-auto">
          <defs>
            <linearGradient id="relax-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#98FB98", stopOpacity:0.4}} />
              <stop offset="100%" style={{stopColor:"#7A946E", stopOpacity:0.3}} />
            </linearGradient>
          </defs>
          <rect width="200" height="120" fill="url(#relax-gradient)" />
          <circle cx="100" cy="60" r="40" fill="#DEB887" opacity="0.6" />
          <circle cx="100" cy="55" r="8" fill="#FFB6C1" opacity="0.8" />
          <rect x="96" y="58" width="8" height="12" fill="#4169E1" opacity="0.7" />
          <ellipse cx="80" cy="80" rx="15" ry="8" fill="#8FBC8F" opacity="0.6" />
          <ellipse cx="120" cy="80" rx="15" ry="8" fill="#8FBC8F" opacity="0.6" />
          <circle cx="60" cy="30" r="3" fill="#98FB98" opacity="0.7" />
          <circle cx="140" cy="35" r="3" fill="#98FB98" opacity="0.7" />
          <circle cx="170" cy="50" r="2" fill="#98FB98" opacity="0.6" />
          <path d="M40,100 Q60,95 80,100 Q120,105 160,100" stroke="#7A946E" strokeWidth="2" fill="none" opacity="0.5" />
        </svg>
      ];
    } else if (iconType === 'paddle') {
      return [
        // Paddle surf en el mar
        <svg key="paddle1" viewBox="0 0 200 120" className="w-full h-full max-w-md mx-auto">
          <defs>
            <linearGradient id="ocean-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#7A946E", stopOpacity:0.6}} />
              <stop offset="100%" style={{stopColor:"#4682B4", stopOpacity:0.4}} />
            </linearGradient>
          </defs>
          <rect width="200" height="60" fill="#87CEEB" opacity="0.3" />
          <rect y="60" width="200" height="60" fill="url(#ocean-gradient)" />
          <path d="M0,70 Q50,65 100,70 T200,70" stroke="#7A946E" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M0,80 Q50,75 100,80 T200,80" stroke="#7A946E" strokeWidth="1.5" fill="none" opacity="0.5" />
          <ellipse cx="100" cy="85" rx="20" ry="4" fill="#8B4513" opacity="0.8" />
          <circle cx="100" cy="75" r="6" fill="#FFB6C1" opacity="0.8" />
          <rect x="98" y="78" width="4" height="8" fill="#4169E1" opacity="0.7" />
          <line x1="85" y1="70" x2="115" y2="90" stroke="#8B4513" strokeWidth="3" />
          <ellipse cx="115" cy="90" rx="4" ry="2" fill="#8B4513" opacity="0.8" />
          <circle cx="30" cy="20" r="8" fill="#FFD700" opacity="0.6" />
        </svg>,
        
        // Instructor enseñando
        <svg key="paddle2" viewBox="0 0 200 120" className="w-full h-full max-w-md mx-auto">
          <defs>
            <linearGradient id="beach-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#F4A460", stopOpacity:0.4}} />
              <stop offset="100%" style={{stopColor:"#7A946E", stopOpacity:0.3}} />
            </linearGradient>
          </defs>
          <rect width="200" height="50" fill="#87CEEB" opacity="0.3" />
          <rect y="50" width="200" height="30" fill="url(#beach-gradient)" />
          <rect y="80" width="200" height="40" fill="#7A946E" opacity="0.4" />
          <circle cx="80" cy="65" r="8" fill="#FFB6C1" opacity="0.8" />
          <rect x="77" y="70" width="6" height="12" fill="#FF6347" opacity="0.7" />
          <circle cx="120" cy="65" r="8" fill="#FFB6C1" opacity="0.8" />
          <rect x="117" y="70" width="6" height="12" fill="#4169E1" opacity="0.7" />
          <ellipse cx="70" cy="90" rx="25" ry="5" fill="#FFFF99" opacity="0.7" />
          <ellipse cx="130" cy="90" rx="25" ry="5" fill="#FF69B4" opacity="0.7" />
        </svg>
      ];
    } else if (iconType === 'dinner') {
      return [
        // Cena romántica en la playa
        <svg key="dinner1" viewBox="0 0 200 120" className="w-full h-full max-w-md mx-auto">
          <defs>
            <linearGradient id="sunset-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#FFB347", stopOpacity:0.6}} />
              <stop offset="50%" style={{stopColor:"#FF8C69", stopOpacity:0.4}} />
              <stop offset="100%" style={{stopColor:"#CD853F", stopOpacity:0.3}} />
            </linearGradient>
          </defs>
          <rect width="200" height="60" fill="url(#sunset-gradient)" />
          <rect y="60" width="200" height="40" fill="#7A946E" opacity="0.3" />
          <rect y="100" width="200" height="20" fill="#F4A460" opacity="0.4" />
          <rect x="80" y="85" width="40" height="4" fill="#8B4513" opacity="0.8" />
          <circle cx="85" cy="80" r="3" fill="#FFFFFF" opacity="0.9" />
          <circle cx="95" cy="80" r="3" fill="#FFFFFF" opacity="0.9" />
          <circle cx="105" cy="80" r="3" fill="#FFFFFF" opacity="0.9" />
          <circle cx="115" cy="80" r="3" fill="#FFFFFF" opacity="0.9" />
          <rect x="90" y="75" width="2" height="8" fill="#FF6347" opacity="0.6" />
          <rect x="108" y="75" width="2" height="8" fill="#FF6347" opacity="0.6" />
          <circle cx="170" cy="15" r="12" fill="#FFD700" opacity="0.7" />
        </svg>,
        
        // Mesa elegante con copas
        <svg key="dinner2" viewBox="0 0 200 120" className="w-full h-full max-w-md mx-auto">
          <defs>
            <linearGradient id="night-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#191970", stopOpacity:0.4}} />
              <stop offset="100%" style={{stopColor:"#483D8B", stopOpacity:0.3}} />
            </linearGradient>
          </defs>
          <rect width="200" height="60" fill="url(#night-gradient)" />
          <rect y="60" width="200" height="60" fill="#7A946E" opacity="0.2" />
          <ellipse cx="100" cy="85" rx="40" ry="20" fill="#8B4513" opacity="0.7" />
          <rect x="80" y="75" width="6" height="15" fill="#DC143C" opacity="0.8" />
          <ellipse cx="83" cy="73" rx="2" ry="3" fill="#FFD700" opacity="0.9" />
          <rect x="114" y="75" width="6" height="15" fill="#DC143C" opacity="0.8" />
          <ellipse cx="117" cy="73" rx="2" ry="3" fill="#FFD700" opacity="0.9" />
          <circle cx="30" cy="25" r="2" fill="#FFFFFF" opacity="0.8" />
          <circle cx="50" cy="15" r="1.5" fill="#FFFFFF" opacity="0.6" />
          <circle cx="150" cy="20" r="2" fill="#FFFFFF" opacity="0.8" />
          <circle cx="170" cy="30" r="1.5" fill="#FFFFFF" opacity="0.6" />
        </svg>
      ];
    }
    return [];
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

  // Auto-cambio de imágenes
  useEffect(() => {
    if (!activities) return;

    const intervals: NodeJS.Timeout[] = [];
    
    activities.forEach((activity, index) => {
      const svgs = getActivitySVGs(activity.iconType);
      if (svgs.length > 1) {
        const interval = setInterval(() => {
          nextActivityImage(activity.id, svgs.length);
        }, 3000 + (index * 500)); // Diferentes intervalos para cada actividad
        intervals.push(interval);
      }
    });
    
    return () => {
      intervals.forEach(clearInterval);
    };
  }, [activities]);

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-nature-background to-nature-beige">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
            <p className="mt-4 text-nature-text/70">Cargando actividades...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-nature-background to-nature-beige">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
              Actividades Especiales
            </h2>
            <p className="font-inter text-lg text-nature-text/80">
              Proximamente tendremos actividades especiales disponibles
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-nature-background to-nature-beige">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
            Actividades Especiales
          </h2>
          <p className="font-inter text-lg text-nature-text/80 max-w-2xl mx-auto">
            Enriquece tu experiencia en Montesereno Glamping con nuestras actividades exclusivas
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {activities.map((activity) => {
            // Manejar imágenes de actividades
            let activityImages: string[] = [];
            try {
              // Si images es un string JSON válido, parsearlo
              if (activity.images && activity.images.startsWith('[')) {
                activityImages = JSON.parse(activity.images);
              } else if (activity.images && activity.images.startsWith('/')) {
                // Si es una sola imagen (string), convertirla a array
                activityImages = [activity.images];
              }
            } catch (error) {
              // Si falla el parse, usar como string individual
              if (activity.images) {
                activityImages = [activity.images];
              }
            }
            
            const svgs = getActivitySVGs(activity.iconType);
            // Filtrar imágenes que sabemos que han fallado
            const validImages = activityImages.filter(img => !failedImages.has(img));
            const imagesToShow = validImages.length > 0 ? validImages : svgs;
            const currentIndex = currentActivityImages[activity.id] || 0;
            
            // Manejar includes de actividades
            let includesItems: string[] = [];
            try {
              if (activity.includes && activity.includes.startsWith('[')) {
                includesItems = JSON.parse(activity.includes);
              } else if (activity.includes) {
                // Si es un string simple, dividirlo por comas
                includesItems = activity.includes.split(',').map(item => item.trim());
              }
            } catch (error) {
              // Si falla el parse, usar como string individual
              if (activity.includes) {
                includesItems = [activity.includes];
              }
            }
            
            return (
              <div key={activity.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-elegant hover:shadow-elegant-lg transition-all duration-300 transform hover:scale-105">
                {imagesToShow.length > 0 && (
                  <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-[#7A946E]/10 to-[#5a7052]/10 border-2 border-[#7A946E]/20">
                    <div className="transition-all duration-1000 ease-in-out h-full flex items-center justify-center">
                      {validImages.length > 0 ? (
                        <img
                          src={validImages[currentIndex]}
                          alt={`${activity.name} - imagen ${currentIndex + 1}`}
                          className="w-full h-full object-cover object-center antialiased image-quality-high"
                          style={{ imageRendering: 'auto' as const }}
                          loading="lazy"
                          onError={(e) => {
                            const failedImage = validImages[currentIndex];
                            // Marcar la imagen como fallida para que se muestre el SVG
                            setFailedImages(prev => new Set([...prev, failedImage]));
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          {svgs[currentIndex]}
                        </div>
                      )}
                    </div>
                    
                    {imagesToShow.length > 1 && (
                      <>
                        {/* Flechas de navegación */}
                        <button
                          onClick={() => prevActivityImage(activity.id, imagesToShow.length)}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                        >
                          <ChevronLeft className="w-4 h-4 text-[#7A946E]" />
                        </button>
                        <button
                          onClick={() => nextActivityImage(activity.id, imagesToShow.length)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                        >
                          <ChevronRight className="w-4 h-4 text-[#7A946E]" />
                        </button>
                        
                        {/* Indicadores de puntos */}
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {imagesToShow.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentActivityImages(prev => ({ ...prev, [activity.id]: index }))}
                              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                index === currentIndex
                                  ? 'bg-[#7A946E]'
                                  : 'bg-white/50 hover:bg-white/80'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-center mb-4">
                  {getActivityIcon(activity.iconType)}
                  <h3 className="font-playfair text-2xl font-bold text-nature-text ml-3">
                    {activity.name}
                  </h3>
                </div>
                
                <p className="font-inter text-nature-text/70 mb-6 text-center">
                  {activity.description}
                </p>
                
                {(activity.duration || activity.location) && (
                  <div className="space-y-3 mb-6">
                    {activity.duration && (
                      <div className="flex items-center text-nature-text/80">
                        <Calendar className="w-4 h-4 mr-2 text-[#7A946E]" />
                        <span className="font-inter text-sm">{activity.duration}</span>
                      </div>
                    )}
                    {activity.location && (
                      <div className="flex items-center text-nature-text/80">
                        <MapPin className="w-4 h-4 mr-2 text-[#7A946E]" />
                        <span className="font-inter text-sm">{activity.location}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {includesItems.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-inter font-semibold text-nature-text/80 mb-2 text-sm">Incluye:</h4>
                    <ul className="space-y-1">
                      {includesItems.map((item: string, index: number) => (
                        <li key={index} className="font-inter text-xs text-nature-text/60 flex items-center">
                          <span className="w-1 h-1 bg-[#7A946E] rounded-full mr-2"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="text-center">
                  <span className="font-playfair text-2xl font-bold text-[#7A946E]">
                    {formatPrice(activity.price)}
                  </span>
                  <p className="font-inter text-xs text-nature-text/60 mt-1">
                    {activity.shortDescription}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}