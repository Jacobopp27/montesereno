import { Heart, Users, Car, Wifi, Trees, Bath, Flame } from "lucide-react";

const amenities = [
  {
    icon: Heart,
    title: "Mascotas Bienvenidas",
    description: "Acepta hasta 2 mascotas para que toda la familia disfrute de la experiencia de montaña."
  },
  {
    icon: Car,
    title: "Parqueo Disponible",
    description: "Estacionamiento seguro y cómodo para tu vehículo durante toda tu estadía."
  },
  {
    icon: Wifi,
    title: "Wi-Fi Incluido",
    description: "Conexión a internet de alta velocidad para mantenerte conectado cuando lo necesites."
  },
  {
    icon: Trees,
    title: "Zona Verde",
    description: "Amplios espacios naturales y jardines para relajarte y disfrutar del aire puro de montaña."
  },
  {
    icon: Bath,
    title: "Jacuzzi",
    description: "Jacuzzi privado para relajarte mientras contemplas el paisaje montañoso y respiras aire puro."
  },
  {
    icon: Flame,
    title: "Zona BBQ",
    description: "Área de parrilla equipada para preparar deliciosas comidas al aire libre con tu familia."
  }
];

export default function AmenitiesSection() {
  return (
    <section id="amenities" className="py-16 relative" style={{backgroundColor: '#F5F2EC'}}>
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "url('data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2333443C' fill-opacity='0.05'%3E%3Cpath d='M40 40V20h-20v20h20zm-20-20h20v20h-20V20z'/%3E%3C/g%3E%3C/svg%3E')"
      }}>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-playfair font-bold text-4xl lg:text-5xl mb-6" style={{color: '#33443C'}}>
            Experiencia de Montaña
          </h2>
          <div className="w-24 h-1 mx-auto mb-6" style={{backgroundColor: '#E0CBAD'}}></div>
          <p className="text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed" style={{color: '#33443C'}}>
            Disfruta de todas las comodidades necesarias para una experiencia de tranquilidad total en nuestra cabaña de montaña
          </p>
          <p className="text-lg mt-2 font-medium" style={{color: '#33443C'}}>
            en <span className="font-playfair italic">Montesereno Glamping</span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {amenities.map((amenity, index) => {
            const IconComponent = amenity.icon;
            return (
              <div 
                key={index} 
                className="group rounded-2xl p-8 hover:shadow-elegant transition-all duration-300 hover:scale-105 glass-effect" 
                style={{backgroundColor: '#E0CBAD'}}
              >
                <div className="flex flex-col items-center text-center">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300" 
                    style={{backgroundColor: '#33443C'}}
                  >
                    <IconComponent className="text-white w-8 h-8" />
                  </div>
                  
                  <h3 className="font-playfair font-bold text-xl mb-4" style={{color: '#33443C'}}>
                    {amenity.title}
                  </h3>
                  
                  <p className="text-base leading-relaxed font-inter" style={{color: '#33443C'}}>
                    {amenity.description}
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
