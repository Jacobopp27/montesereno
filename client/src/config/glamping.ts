export const GLAMPING = {
  brand: "Montesereno Glamping",
  colors: {
    primary: "#33443C",    // fondo/nav/hero
    accent:  "#E0CBAD",    // botones/acentos
    surface: "#F5F2EC",    // cards/inputs
    onPrimary: "#FFFFFF",
    onSurface: "#1E2A25"
  },
  contact: {
    whatsappIntl: "573136275896",
    phoneDisplay: "+57 313 627 5896",
    instagram: "@glamping_montesereno"
  },
  hero: {
    title: "Reconecta con lo esencial",
    subtitle:
      "Vive una experiencia única en Montesereno Glamping, conexión total con la naturaleza en un entorno de montaña.",
    ctaText: "Reservar Ahora"
  },
  pricing: {
    weekdayCouple: 350000,
    weekendCouple: 450000,
    extraPerson: 50000,
    notes: ["Desayuno incluido para 2 personas"] // sin política de niños
  },
  operations: {
    checkIn: "3:00 p.m.",   // dato ficticio
    checkOut: "12:00 p.m."  // dato ficticio
  },
  assets: {
    logo:  "@assets/logo original_1758226258223.png", // Montesereno Glamping official logo
    hero:  "/assets/activities/activity-1752365713671-231512296.jpg", // Using existing mountain activity image
    rates: "/assets/activities/activity-1752366185837-61402294.jpg" // Using existing nature image for rates
  },
  policies: {
    behavior: [
      "Estamos en zona agrícola activa; pueden presentarse labores externas fuera de nuestro control.",
      "Prohibido fumar en el área del jacuzzi por seguridad (vapores/sistemas de calentamiento).",
      "Ambiente respetuoso y familiar; nos reservamos el derecho de admisión y permanencia."
    ],
    cancellation: {
      retract: "Puedes retractarte dentro de 5 días hábiles desde la compra si tu check-in es en 5 días hábiles o más. Si tu llegada es en 4 días hábiles o menos, el retracto no aplica. Devolución en máximo 30 días calendario.",
      outside: [
        "Más de 15 días antes del check-in: 100% reembolso o crédito 100% para reprogramar en 12 meses.",
        "8–14 días: 50% reembolso o crédito 100% para reprogramar en 12 meses (1 reprogramación sin costo).",
        "≤7 días / no-show: sin reembolso. Puedes reprogramar con crédito 100% en 6 meses (pagas diferencias si aplica)."
      ],
      nonRefundable: "Tarifas/promos no reembolsables: sin devolución; 1 reprogramación con 7 días de antelación (pagando diferencias si aplica).",
      forceMajeure: "Cierres viales o alertas climáticas: reprogramación sin penalidad (misma temporada/rango) o crédito 100% por 12 meses.",
      businessDaysNote: "Días hábiles: lunes a viernes, sin festivos."
    }
  }
};