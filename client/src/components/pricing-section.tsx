import { GLAMPING } from '@/config/glamping';

export default function PricingSection() {
  // Helper function to format Colombian pesos
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section id="tarifas" className="py-16 bg-earth-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-playfair font-semibold text-3xl text-[hsl(var(--nature-olive))] mb-4">
            Tarifas {GLAMPING.brand}
          </h2>
          <p className="text-lg text-[hsl(var(--nature-text))] max-w-2xl mx-auto">
            Precios transparentes para tu experiencia de glamping en las montañas
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-8 shadow-elegant">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Weekday pricing */}
            <div className="text-center p-6 border border-nature-border rounded-lg">
              <h3 className="font-playfair font-semibold text-xl text-nature-olive mb-2">
                Lunes - Viernes
              </h3>
              <div className="text-3xl font-bold text-nature-olive mb-2">
                {formatPrice(GLAMPING.pricing.weekdayCouple)}
              </div>
              <p className="text-nature-text text-sm">
                Pareja (2 personas)
              </p>
            </div>

            {/* Weekend/Holiday pricing */}
            <div className="text-center p-6 border border-nature-border rounded-lg bg-nature-sand/10">
              <h3 className="font-playfair font-semibold text-xl text-nature-olive mb-2">
                Fines de Semana / Festivos
              </h3>
              <div className="text-3xl font-bold text-nature-olive mb-2">
                {formatPrice(GLAMPING.pricing.weekendCouple)}
              </div>
              <p className="text-nature-text text-sm">
                Pareja (2 personas)
              </p>
            </div>

            {/* Extra person pricing */}
            <div className="text-center p-6 border border-nature-border rounded-lg">
              <h3 className="font-playfair font-semibold text-xl text-nature-olive mb-2">
                Persona Adicional
              </h3>
              <div className="text-3xl font-bold text-nature-olive mb-2">
                {formatPrice(GLAMPING.pricing.extraPerson)}
              </div>
              <p className="text-nature-text text-sm">
                Por persona extra
              </p>
            </div>
          </div>

          {/* Notes section */}
          <div className="mt-8 pt-6 border-t border-nature-border">
            <h4 className="font-playfair font-semibold text-lg text-nature-olive mb-4">
              Incluido en la tarifa:
            </h4>
            <ul className="space-y-2">
              {GLAMPING.pricing.notes.map((note, index) => (
                <li key={index} className="flex items-center text-nature-text">
                  <span className="w-2 h-2 bg-nature-olive rounded-full mr-3 flex-shrink-0"></span>
                  {note}
                </li>
              ))}
            </ul>
          </div>

          {/* Operations info */}
          <div className="mt-6 pt-6 border-t border-nature-border">
            <h4 className="font-playfair font-semibold text-lg text-nature-olive mb-4">
              Información de horarios:
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-nature-text">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-nature-sand rounded-full mr-3 flex-shrink-0"></span>
                <span><strong>Check-in:</strong> {GLAMPING.operations.checkIn}</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-nature-sand rounded-full mr-3 flex-shrink-0"></span>
                <span><strong>Check-out:</strong> {GLAMPING.operations.checkOut}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}