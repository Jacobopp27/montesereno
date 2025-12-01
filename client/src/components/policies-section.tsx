import { PawPrint, DollarSign, Music, AlertTriangle } from "lucide-react";
import { GLAMPING } from '@/config/glamping';

export default function PoliciesSection() {
  return (
    <section id="politicas" className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-playfair font-semibold text-3xl text-[hsl(var(--nature-olive))] mb-4">
            Políticas de {GLAMPING.brand}
          </h2>
          <p className="text-lg text-[hsl(var(--nature-text))] max-w-2xl mx-auto">
            Conoce nuestras políticas para garantizar una experiencia segura y placentera para todos
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Comportamiento y otros */}
          <details className="card bg-white rounded-lg shadow-elegant">
            <summary className="cursor-pointer p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[hsl(var(--nature-olive))] rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="text-white w-6 h-6" />
                </div>
                <h3 className="font-playfair font-semibold text-xl text-[hsl(var(--nature-olive))]">
                  Comportamiento y otros
                </h3>
              </div>
              <span className="text-[hsl(var(--nature-olive))] text-2xl">+</span>
            </summary>
            <div className="px-6 pb-6 text-[hsl(var(--nature-text))] leading-relaxed space-y-3">
              {GLAMPING.policies.behavior.map((policy, index) => (
                <p key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-nature-olive rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  {policy}
                </p>
              ))}
            </div>
          </details>

          {/* Cancelación y reembolsos */}
          <details className="card bg-white rounded-lg shadow-elegant">
            <summary className="cursor-pointer p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[hsl(var(--nature-olive))] rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="text-white w-6 h-6" />
                </div>
                <h3 className="font-playfair font-semibold text-xl text-[hsl(var(--nature-olive))]">
                  Cancelación y reembolsos
                </h3>
              </div>
              <span className="text-[hsl(var(--nature-olive))] text-2xl">+</span>
            </summary>
            <div className="px-6 pb-6 text-[hsl(var(--nature-text))] space-y-6">
              
              {/* Retracto */}
              <div>
                <h4 className="font-semibold text-nature-olive mb-2">Retracto:</h4>
                <p className="leading-relaxed">{GLAMPING.policies.cancellation.retract}</p>
              </div>
              
              {/* Fuera del retracto */}
              <div>
                <h4 className="font-semibold text-nature-olive mb-2">Fuera del retracto:</h4>
                <ul className="space-y-2">
                  {GLAMPING.policies.cancellation.outside.map((policy, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-nature-sand rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      {policy}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* No reembolsables/promos */}
              <div>
                <h4 className="font-semibold text-nature-olive mb-2">No reembolsables/promos:</h4>
                <p className="leading-relaxed">{GLAMPING.policies.cancellation.nonRefundable}</p>
              </div>
              
              {/* Fuerza mayor */}
              <div>
                <h4 className="font-semibold text-nature-olive mb-2">Fuerza mayor:</h4>
                <p className="leading-relaxed mb-2">{GLAMPING.policies.cancellation.forceMajeure}</p>
                <p className="text-sm text-nature-text italic">{GLAMPING.policies.cancellation.businessDaysNote}</p>
              </div>
              
            </div>
          </details>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[hsl(var(--nature-text))]/70">
            Al realizar una reserva, aceptas automáticamente estas políticas y condiciones.
          </p>
        </div>
      </div>
    </section>
  );
}