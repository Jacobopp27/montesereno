import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { FaFacebook, FaInstagram } from "react-icons/fa";

export default function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-montserrat font-bold text-4xl text-white mb-4">
            Ubicación y Contacto
          </h2>
          <p className="text-xl text-white">
            Encuéntranos en el corazón de la naturaleza
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h3 className="font-montserrat font-bold text-xl text-[hsl(var(--nature-olive))] mb-6">Ponte en Contacto</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <MapPin className="text-[hsl(var(--nature-olive))] mr-4 w-5 h-5" />
                <span className="text-[hsl(var(--nature-text))]">El Peñol, Antioquia, Colombia</span>
              </div>
              <div className="flex items-center">
                <Phone className="text-[hsl(var(--nature-olive))] mr-4 w-5 h-5" />
                <span className="text-[hsl(var(--nature-text))]">+57 3136275896</span>
              </div>
              <div className="flex items-center">
                <Mail className="text-[hsl(var(--nature-olive))] mr-4 w-5 h-5" />
                <span className="text-[hsl(var(--nature-text))]">glampingmontesereno@gmail.com</span>
              </div>
              <div className="flex items-center">
                <Clock className="text-[hsl(var(--nature-olive))] mr-4 w-5 h-5" />
                <span className="text-[hsl(var(--nature-text))]">Entrada: 3:00 PM | Salida: 12:00 PM</span>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h4 className="font-montserrat font-semibold text-lg text-[hsl(var(--nature-olive))] mb-4">Síguenos</h4>
              <div className="flex space-x-4">
                <a 
                  href="https://www.instagram.com/glamping_montesereno/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-[hsl(var(--nature-olive))] rounded-full flex items-center justify-center text-white hover:bg-[hsl(var(--nature-olive))]/90 transition-colors"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
