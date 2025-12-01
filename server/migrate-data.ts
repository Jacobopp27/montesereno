import { db } from "./db";
import { 
  galleryImages, 
  reviews, 
  activities, 
  heroBanners,
  cabins
} from "@shared/schema";

async function migrateData() {
  console.log("Iniciando migración de datos...");

  // Migrar cabaña
  await db.insert(cabins).values([
    {
      id: 1,
      name: "Montesereno Glamping",
      weekdayPrice: 350000,
      weekendPrice: 450000,
      isActive: true
    }
  ]).onConflictDoNothing();

  // Migrar imágenes de galería
  await db.insert(galleryImages).values([
    {
      id: 13,
      title: "Montaña",
      description: "",
      imageUrl: "/attached_assets/IMG_3297.jpeg",
      displayOrder: 1,
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 14,
      title: "Cabaña",
      description: "",
      imageUrl: "/attached_assets/IMG_3298.jpeg",
      displayOrder: 2,
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 15,
      title: "Vista",
      description: "",
      imageUrl: "/attached_assets/IMG_3299.jpeg",
      displayOrder: 3,
      isActive: true,
      createdAt: new Date()
    }
  ]).onConflictDoNothing();

  // Migrar reseñas
  await db.insert(reviews).values([
    {
      id: 1,
      guestName: "Sarah Johnson",
      rating: 5,
      comment: "¡Increíble experiencia en Montesereno Glamping! La vista a la montaña es espectacular y la atención al detalle es excepcional. Definitivamente volveremos para otra escapada romántica.",
      isApproved: true,
      displayOrder: 1,
      createdAt: new Date()
    },
    {
      id: 2,
      guestName: "Carlos Mendoza",
      rating: 5,
      comment: "Perfecto para una escapada familiar. Los niños disfrutaron mucho la naturaleza y nosotros la tranquilidad. La cabaña está muy bien equipada y el desayuno delicioso.",
      isApproved: true,
      displayOrder: 2,
      createdAt: new Date()
    },
    {
      id: 3,
      guestName: "Ana Rodríguez",
      rating: 4,
      comment: "Hermoso lugar en la montaña. La cabaña es cómoda y la ubicación inmejorable. Los sonidos de la naturaleza toda la noche fueron muy relajantes.",
      isApproved: true,
      displayOrder: 3,
      createdAt: new Date()
    }
  ]).onConflictDoNothing();

  // Migrar actividades
  await db.insert(activities).values([
    {
      id: 1,
      name: "Caminata por la Montaña",
      description: "Explora los senderos naturales de la montaña con guías especializados. Perfecto para principiantes y expertos. Incluye equipo de senderismo y refrigerios.",
      shortDescription: "Aventura de montaña",
      price: 50000,
      duration: "2 horas",
      location: "Senderos Montesereno",
      includes: "Guía especializado, equipo de senderismo, refrigerios",
      iconType: "mountain",
      images: JSON.stringify(["/attached_assets/IMG_3300.jpeg"]),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: "Observación de Aves",
      description: "Descubre la fauna local en un tranquilo recorrido de observación de aves. Ideal para familias y parejas que buscan una experiencia tranquila en contacto con la naturaleza.",
      shortDescription: "Exploración de fauna local",
      price: 40000,
      duration: "1.5 horas",
      location: "Bosques Montesereno",
      includes: "Binoculares, guía especializado, libro de aves",
      iconType: "binoculars",
      images: JSON.stringify(["/attached_assets/IMG_3301.jpeg"]),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      name: "Tour de Café",
      description: "Experiencia completa del proceso del café con productores locales. Incluye degustación de café y productos artesanales. Ideal para amantes del café.",
      shortDescription: "Experiencia cafetera",
      price: 80000,
      duration: "4 horas",
      location: "Fincas cafeteras cercanas",
      includes: "Transporte, guía, degustación, productos artesanales",
      iconType: "coffee",
      images: JSON.stringify([]),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 4,
      name: "Masajes Relajantes",
      description: "Disfruta de un masaje relajante en contacto con la naturaleza con terapeutas especializados. Perfecto para desconectar y renovar energías. Utilizamos aceites naturales y técnicas tradicionales.",
      shortDescription: "Bienestar y relajación en la naturaleza",
      price: 75000,
      duration: "1 hora",
      location: "Spa Montesereno Glamping",
      includes: "Masaje terapéutico, aceites naturales, ambiente relajante",
      iconType: "heart",
      images: JSON.stringify(["/assets/activities/activity-1754413334362-255820339.jpeg", "/assets/activities/activity-1754413334374-199351764.jpeg"]),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]).onConflictDoNothing();


  // Migrar banners del hero
  await db.insert(heroBanners).values([
    {
      id: 1,
      title: "Bienvenido a Montesereno Glamping",
      description: "Brisa fresca, tranquilidad y naturaleza. Tu refugio perfecto en la montaña",
      imageUrl: "/attached_assets/image_1752432673495.png",
      buttonText: "Reservar Ahora",
      buttonUrl: "#reservar",
      displayOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      title: "Experiencia de Montaña Auténtica",
      description: "Desconéctate de la rutina y conecta con la naturaleza en Montesereno Glamping",
      imageUrl: "/attached_assets/image_1752432673495.png",
      buttonText: "Explorar Cabaña",
      buttonUrl: "#overview",
      displayOrder: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      title: "Tranquilidad en la Montaña",
      description: "Una cabaña exclusiva rodeada de naturaleza para tu escape perfecto",
      imageUrl: "/attached_assets/image_1752432673495.png",
      buttonText: "Ver Galería",
      buttonUrl: "#gallery",
      displayOrder: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]).onConflictDoNothing();

  // Migrar menús del restaurante
  await db.insert(restaurantMenus).values([
    {
      id: 1,
      title: "Menú Restaurante Montesereno Glamping",
      description: "Especialidades de la montaña",
      pdfUrl: "/attached_assets/Menu_1752375041449.pdf",
      displayOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]).onConflictDoNothing();

  console.log("Migración de datos completada exitosamente!");
}

// Ejecutar la migración
migrateData().catch(console.error);