import { 
  users, 
  reservations, 
  cabins, 
  adminUsers,
  galleryImages,
  reviews,
  activities,
  heroBanners,
  type User, 
  type InsertUser, 
  type Reservation, 
  type InsertReservation, 
  type Cabin, 
  type InsertCabin,
  type AdminUser,
  type InsertAdminUser,
  type GalleryImage,
  type InsertGalleryImage,
  type Review,
  type InsertReview,
  type Activity,
  type InsertActivity,
  type HeroBanner,
  type InsertHeroBanner
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, lt, gt } from "drizzle-orm";
import fs from "fs";
import path from "path";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Cabin methods
  getAllCabins(): Promise<Cabin[]>;
  getCabin(id: number): Promise<Cabin | undefined>;
  createCabin(cabin: InsertCabin): Promise<Cabin>;
  
  // Reservation methods
  getReservation(id: number): Promise<Reservation | undefined>;
  getAllReservations(): Promise<Reservation[]>;
  getReservationsByDateRange(startDate: string, endDate: string): Promise<Reservation[]>;
  getReservationsByCabinAndDateRange(cabinId: number, startDate: string, endDate?: string): Promise<Reservation[]>;
  createReservation(reservation: InsertReservation & { 
    confirmationCode: string; 
    frozenUntil: Date;
    paymentInstructions?: string;
  }): Promise<Reservation>;
  updateReservationCalendarId(id: number, calendarEventId: string): Promise<Reservation | undefined>;
  updateReservationStatus(id: number, status: "pending" | "confirmed" | "cancelled" | "expired", calendarEventId?: string): Promise<Reservation | undefined>;
  getExpiredReservations(): Promise<Reservation[]>;
  getReservationByConfirmationCode(confirmationCode: string): Promise<Reservation | undefined>;
  deleteReservation(id: number): Promise<boolean>;

  // Admin methods
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  getAllAdmins(): Promise<AdminUser[]>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;

  // Gallery methods
  getAllGalleryImages(): Promise<GalleryImage[]>;
  getActiveGalleryImages(): Promise<GalleryImage[]>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: number, updates: Partial<GalleryImage>): Promise<GalleryImage | undefined>;
  deleteGalleryImage(id: number): Promise<boolean>;

  // Review methods
  getAllReviews(): Promise<Review[]>;
  getApprovedReviews(): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;

  // Activity methods
  getAllActivities(): Promise<Activity[]>;
  getActiveActivities(): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, updates: Partial<Activity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;

  // Hero banner methods
  getAllHeroBanners(): Promise<HeroBanner[]>;
  getActiveHeroBanners(): Promise<HeroBanner[]>;
  getHeroBanner(id: number): Promise<HeroBanner | undefined>;
  createHeroBanner(banner: InsertHeroBanner): Promise<HeroBanner>;
  updateHeroBanner(id: number, updates: Partial<HeroBanner>): Promise<HeroBanner | undefined>;
  deleteHeroBanner(id: number): Promise<boolean>;

}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reservations: Map<number, Reservation>;
  private cabins: Map<number, Cabin>;
  private galleryImages: Map<number, GalleryImage>;
  private reviews: Map<number, Review>;
  private activities: Map<number, Activity>;
  private currentUserId: number;
  private currentReservationId: number;
  private currentCabinId: number;
  private currentGalleryId: number;
  private currentReviewId: number;
  private currentActivityId: number;
  private heroBanners: Map<number, HeroBanner>;
  private currentHeroBannerId: number;
  private activitiesFilePath: string;
  private galleryFilePath: string;

  constructor() {
    this.users = new Map();
    this.reservations = new Map();
    this.cabins = new Map();
    this.galleryImages = new Map();
    this.reviews = new Map();
    this.activities = new Map();
    this.currentUserId = 1;
    this.currentReservationId = 1;
    this.currentCabinId = 1;
    this.currentGalleryId = 1;
    this.currentReviewId = 1;
    this.currentActivityId = 1;
    this.heroBanners = new Map();
    this.currentHeroBannerId = 0;
    this.activitiesFilePath = path.join(process.cwd(), 'server', 'activities-state.json');
    this.galleryFilePath = path.join(process.cwd(), 'server', 'gallery-state.json');
    
    // Initialize cabins and gallery with the mentioned items
    this.initializeCabins();
    console.log('🔄 [STORAGE] About to load gallery from file...');
    this.loadGalleryFromFile();
    console.log('🔄 [STORAGE] Gallery file loading complete, about to initialize defaults...');
    this.initializeGallery(); // Habilitada para tener imágenes por defecto
    console.log('🔄 [STORAGE] Gallery initialization complete');
    this.initializeReviews();
    this.loadActivitiesFromFile();
    this.initializeBanners();
  }

  private async initializeCabins() {
    // Montesereno Glamping - Hasta 6 huéspedes
    const glampingCabin: Cabin = {
      id: this.currentCabinId++,
      name: "Montesereno Glamping",
      weekdayPrice: 350000, // $350,000 COP entre semana
      weekendPrice: 450000, // $450,000 COP fin de semana
      isActive: true,
    };
    this.cabins.set(glampingCabin.id, glampingCabin);
  }

  private loadGalleryFromFile() {
    try {
      if (fs.existsSync(this.galleryFilePath)) {
        const data = fs.readFileSync(this.galleryFilePath, 'utf8');
        const state = JSON.parse(data);
        
        console.log('🔍 [GALLERY DEBUG] File content:', JSON.stringify(state, null, 2));
        
        // Restaurar galería desde archivo
        this.galleryImages.clear();
        this.currentGalleryId = state.currentGalleryId || 1;
        
        if (state.galleryImages) {
          state.galleryImages.forEach((image: GalleryImage) => {
            this.galleryImages.set(image.id, image);
            console.log(`🔍 [GALLERY DEBUG] Loaded image: ${image.id} - "${image.title}"`);
          });
        }
        
        console.log(`✅ Loaded ${this.galleryImages.size} gallery images from file`);
      } else {
        console.log('⚠️  Gallery file does not exist, will use defaults');
      }
    } catch (error) {
      console.error('❌ Error loading gallery from file:', error);
    }
  }

  private saveGalleryToFile() {
    try {
      const state = {
        currentGalleryId: this.currentGalleryId,
        galleryImages: Array.from(this.galleryImages.values())
      };
      
      fs.writeFileSync(this.galleryFilePath, JSON.stringify(state, null, 2));
      console.log('Gallery saved to file');
    } catch (error) {
      console.error('Error saving gallery to file:', error);
    }
  }

  private initializeGallery() {
    console.log('⚠️  [GALLERY DEBUG] initializeGallery called - current size:', this.galleryImages.size);
    // Solo inicializar si no hay imágenes cargadas del archivo
    if (this.galleryImages.size > 0) {
      console.log('✅ [GALLERY DEBUG] Skipping initialization - images already loaded from file');
      return;
    }
    
    console.log('🚨 [GALLERY DEBUG] WARNING: Loading default initialization data - file loading failed!');
    
    const galleryData = [
      {
        title: "Montaña Vista",
        description: "Vista panorámica de la cabaña con vista a la montaña",
        imageUrl: "/attached_assets/IMG_3297.jpeg",
        displayOrder: 1
      },
      {
        title: "Cabaña Interior",
        description: "Interior acogedor con vista a la montaña para parejas",
        imageUrl: "/attached_assets/IMG_3298.jpeg",
        displayOrder: 2
      },
      {
        title: "Vista Terraza",
        description: "Terraza con vista a la montaña perfecta para familias",
        imageUrl: "/attached_assets/IMG_3299.jpeg",
        displayOrder: 3
      },
      {
        title: "Vista Nocturna Montaña",
        description: "Ambiente mágico en la montaña bajo las estrellas",
        imageUrl: "/attached_assets/IMG_3300.jpeg",
        displayOrder: 4
      },
      {
        title: "Zona de Asado Montaña",
        description: "Área común para disfrutar del kit de asado con vista a la montaña",
        imageUrl: "/attached_assets/IMG_3301.jpeg",
        displayOrder: 5
      },
      {
        title: "Senderos Montaña",
        description: "Caminos para explorar la montaña y disfrutar la naturaleza",
        imageUrl: "/attached_assets/IMG_3302.jpeg",
        displayOrder: 6
      },
      {
        title: "Vista Panorámica Montaña",
        description: "Paisaje espectacular desde Montesereno Glamping",
        imageUrl: "/attached_assets/IMG_3303.jpeg",
        displayOrder: 7
      },
      {
        title: "Amanecer en Montaña",
        description: "Despertar con vistas increíbles de la montaña cada mañana",
        imageUrl: "/attached_assets/IMG_3304.jpeg",
        displayOrder: 8
      },
      {
        title: "Espacios de Relajación",
        description: "Áreas diseñadas para el descanso contemplando la montaña",
        imageUrl: "/attached_assets/IMG_3306.jpeg",
        displayOrder: 9
      },
      {
        title: "Entorno Natural",
        description: "La belleza del paisaje natural que rodea Montesereno Glamping",
        imageUrl: "/attached_assets/IMG_3307.jpeg",
        displayOrder: 10
      },
      {
        title: "Detalles Arquitectónicos",
        description: "Elementos únicos que hacen especial cada cabaña en la montaña",
        imageUrl: "/attached_assets/IMG_3308.jpeg",
        displayOrder: 11
      },
      {
        title: "Experiencia Montaña Completa",
        description: "La magia de Montesereno Glamping en todo su esplendor",
        imageUrl: "/attached_assets/IMG_3309.jpeg",
        displayOrder: 12
      }
    ];

    galleryData.forEach(data => {
      const image: GalleryImage = {
        id: this.currentGalleryId++,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        displayOrder: data.displayOrder,
        isActive: true,
        createdAt: new Date()
      };
      this.galleryImages.set(image.id, image);
    });
  }

  private initializeReviews() {
    const reviewsData = [
      {
        guestName: "Sarah Johnson",
        rating: 5,
        comment: "Una experiencia increíble en Montesereno Glamping. La cabaña con vista a la montaña es hermosa y la vista de la naturaleza es espectacular. El desayuno estuvo delicioso y la atención fue excelente. Definitivamente regresaremos.",
        displayOrder: 1
      },
      {
        guestName: "Carlos Mendoza",
        rating: 5,
        comment: "Perfecto para desconectarse de la ciudad. El entorno de montaña es único y las instalaciones están muy bien cuidadas. El kit de asado fue una excelente adición a nuestra estadía en la naturaleza.",
        displayOrder: 2
      },
      {
        guestName: "Ana García",
        rating: 4,
        comment: "Muy tranquilo y relajante. La cabaña es cómoda y la ubicación en la montaña es perfecta para los amantes de la naturaleza. Recomendado para parejas que buscan un escape romántico.",
        displayOrder: 3
      }
    ];

    reviewsData.forEach(data => {
      const review: Review = {
        id: this.currentReviewId++,
        guestName: data.guestName,
        rating: data.rating,
        comment: data.comment,
        isApproved: true,
        displayOrder: data.displayOrder,
        createdAt: new Date()
      };
      this.reviews.set(review.id, review);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllCabins(): Promise<Cabin[]> {
    return Array.from(this.cabins.values());
  }

  async getCabin(id: number): Promise<Cabin | undefined> {
    return this.cabins.get(id);
  }

  async createCabin(insertCabin: InsertCabin): Promise<Cabin> {
    const id = this.currentCabinId++;
    const cabin: Cabin = { 
      ...insertCabin, 
      id,
      isActive: insertCabin.isActive ?? true
    };
    this.cabins.set(id, cabin);
    return cabin;
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }

  async getAllReservations(): Promise<Reservation[]> {
    return Array.from(this.reservations.values());
  }

  async getReservationsByDateRange(startDate: string, endDate: string): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(reservation => {
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Check if reservation overlaps with the requested date range
      return (checkIn <= end && checkOut >= start);
    });
  }

  async getReservationsByCabinAndDateRange(cabinId: number, startDate: string, endDate?: string): Promise<Reservation[]> {
    const end = endDate || startDate;
    return Array.from(this.reservations.values()).filter(reservation => {
      if (reservation.cabinId !== cabinId) return false;
      
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      const start = new Date(startDate);
      const endFilter = new Date(end);
      
      // Check if reservation overlaps with the requested date range
      return (checkIn <= endFilter && checkOut >= start);
    });
  }

  async createReservation(insertReservation: InsertReservation & { 
    confirmationCode: string; 
    frozenUntil: Date;
    paymentInstructions?: string;
  }): Promise<Reservation> {
    const id = this.currentReservationId++;
    const reservation: Reservation = {
      ...insertReservation,
      id,
      status: "pending",
      googleCalendarEventId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      includesAsado: false, // Default value from schema
      paymentInstructions: insertReservation.paymentInstructions || null,
    };
    this.reservations.set(id, reservation);
    return reservation;
  }

  async updateReservationCalendarId(id: number, calendarEventId: string): Promise<Reservation | undefined> {
    const reservation = this.reservations.get(id);
    if (reservation) {
      const updated = { ...reservation, googleCalendarEventId: calendarEventId };
      this.reservations.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async updateReservationStatus(id: number, status: "pending" | "confirmed" | "cancelled" | "expired", calendarEventId?: string): Promise<Reservation | undefined> {
    const reservation = this.reservations.get(id);
    if (reservation) {
      const updated = { 
        ...reservation, 
        status,
        ...(calendarEventId && { googleCalendarEventId: calendarEventId })
      };
      this.reservations.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getExpiredReservations(): Promise<Reservation[]> {
    const now = new Date();
    return Array.from(this.reservations.values()).filter(reservation => 
      reservation.status === "pending" && 
      reservation.frozenUntil && 
      new Date(reservation.frozenUntil) < now
    );
  }

  async getReservationByConfirmationCode(confirmationCode: string): Promise<Reservation | undefined> {
    return Array.from(this.reservations.values()).find(reservation => 
      reservation.confirmationCode === confirmationCode
    );
  }

  // Admin methods
  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    // Return a default admin for testing
    if (username === "adminbahia") {
      return {
        id: 1,
        username: "adminbahia",
        password: "$2b$10$.5wXhQR9Cr28rjSvb7OM7epB8LJIyWUfy9N2BFDEp4FmIvsqMBnY.", // santamaria2025
        createdAt: new Date()
      };
    }
    return undefined;
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    return [{
      id: 1,
      username: "adminbahia",
      password: "$2b$10$.5wXhQR9Cr28rjSvb7OM7epB8LJIyWUfy9N2BFDEp4FmIvsqMBnY.",
      createdAt: new Date()
    }];
  }

  async createAdmin(admin: InsertAdminUser): Promise<AdminUser> {
    return {
      id: 1,
      ...admin,
      createdAt: new Date()
    };
  }

  // Gallery methods
  async getAllGalleryImages(): Promise<GalleryImage[]> {
    const images = Array.from(this.galleryImages.values()).sort((a, b) => ((a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
    console.log('🔍 [GALLERY API] Returning images:', images.map(img => ({id: img.id, title: img.title})));
    return images;
  }

  async getActiveGalleryImages(): Promise<GalleryImage[]> {
    const allImages = await this.getAllGalleryImages();
    return allImages.filter(img => img.isActive);
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const newImage: GalleryImage = {
      id: this.currentGalleryId++,
      title: image.title || null,
      description: image.description || null,
      imageUrl: image.imageUrl,
      displayOrder: image.displayOrder || null,
      isActive: image.isActive,
      createdAt: new Date()
    };
    this.galleryImages.set(newImage.id, newImage);
    this.saveGalleryToFile();
    return newImage;
  }

  async updateGalleryImage(id: number, updates: Partial<GalleryImage>): Promise<GalleryImage | undefined> {
    const image = this.galleryImages.get(id);
    if (image) {
      const updatedImage = { ...image, ...updates };
      this.galleryImages.set(id, updatedImage);
      this.saveGalleryToFile();
      return updatedImage;
    }
    return undefined;
  }

  async deleteGalleryImage(id: number): Promise<boolean> {
    const image = this.galleryImages.get(id);
    if (image) {
      // Si es una imagen subida (no es de attached_assets), eliminar el archivo físico
      if (image.imageUrl.startsWith('/uploads/')) {
        try {
          const filePath = path.join(process.cwd(), 'public', image.imageUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Archivo físico eliminado: ${filePath}`);
          }
        } catch (error) {
          console.error('Error al eliminar archivo físico:', error);
        }
      }
      
      const deleted = this.galleryImages.delete(id);
      if (deleted) {
        this.saveGalleryToFile();
      }
      return deleted;
    }
    return false;
  }

  // Review methods
  async getAllReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values()).sort((a, b) => ((a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
  }

  async getApprovedReviews(): Promise<Review[]> {
    const allReviews = await this.getAllReviews();
    return allReviews.filter(review => review.isApproved);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const newReview: Review = {
      id: this.currentReviewId++,
      guestName: review.guestName,
      rating: review.rating,
      comment: review.comment,
      isApproved: review.isApproved,
      displayOrder: review.displayOrder || null,
      createdAt: new Date()
    };
    this.reviews.set(newReview.id, newReview);
    return newReview;
  }

  async updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (review) {
      const updatedReview = { ...review, ...updates };
      this.reviews.set(id, updatedReview);
      return updatedReview;
    }
    return undefined;
  }

  async deleteReview(id: number): Promise<boolean> {
    return this.reviews.delete(id);
  }

  private loadActivitiesFromFile() {
    try {
      if (fs.existsSync(this.activitiesFilePath)) {
        const data = fs.readFileSync(this.activitiesFilePath, 'utf8');
        const state = JSON.parse(data);
        
        // Cargar actividades desde el archivo
        if (state.activities && Array.isArray(state.activities)) {
          this.activities.clear();
          state.activities.forEach((activity: Activity) => {
            this.activities.set(activity.id, activity);
          });
        }
        
        // Establecer el contador actual
        if (state.currentActivityId) {
          this.currentActivityId = state.currentActivityId;
        }
        
        console.log(`Loaded ${this.activities.size} activities from file`);
        // Si no hay actividades en el archivo, inicializar las por defecto
        if (this.activities.size === 0) {
          console.log('No activities found in file, initializing default activities');
          this.initializeActivities();
        }
      } else {
        console.log('No activities state file found, initializing default activities');
        this.initializeActivities();
      }
    } catch (error) {
      console.error('Error loading activities from file:', error);
      this.initializeActivities();
    }
  }

  private saveActivitiesToFile() {
    try {
      const state = {
        activities: Array.from(this.activities.values()),
        currentActivityId: this.currentActivityId
      };
      
      fs.writeFileSync(this.activitiesFilePath, JSON.stringify(state, null, 2));
      console.log('Activities saved to file');
    } catch (error) {
      console.error('Error saving activities to file:', error);
    }
  }

  private initializeActivities() {
    // Paddle Surf Classes
    const paddleActivity: Activity = {
      id: this.currentActivityId++,
      name: "Clases de Paddle Surf",
      description: "Sumérgete en las aguas cristalinas del Caribe colombiano con nuestras clases de paddle surf. Experimenta la tranquilidad y la emoción de deslizarte sobre las olas mientras contemplas el impresionante paisaje marino de Moñitos.",
      shortDescription: "Clases de paddle surf para principiantes y avanzados",
      price: 150000, // $150,000 COP
      duration: "2 horas",
      location: "Playa Bahía Santamaría",
      includes: JSON.stringify([
        "Tabla de paddle surf",
        "Remo",
        "Chaleco salvavidas",
        "Instructor certificado",
        "Sesión de fotos"
      ]),
      images: JSON.stringify([]), // Array vacío para imágenes
      isActive: true,
      iconType: "paddle",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.activities.set(paddleActivity.id, paddleActivity);

    // Romantic Dinner
    const dinnerActivity: Activity = {
      id: this.currentActivityId++,
      name: "Cena Romántica",
      description: "Disfruta de una experiencia culinaria inolvidable con nuestra cena romántica frente al mar. Dos exquisitos platos de nuestra carta especial acompañados de una botella de vino selecto, todo mientras contemplas la puesta de sol sobre el Caribe.",
      shortDescription: "Cena romántica con vista al mar",
      price: 180000, // $180,000 COP
      duration: "3 horas",
      location: "Terraza privada con vista al mar",
      includes: JSON.stringify([
        "Dos platos principales de la carta",
        "Botella de vino selecto",
        "Decoración romántica",
        "Servicio personalizado",
        "Vista al atardecer"
      ]),
      images: JSON.stringify([]), // Array vacío para imágenes
      isActive: true,
      iconType: "dinner",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.activities.set(dinnerActivity.id, dinnerActivity);
    
    // Guardar las actividades iniciales
    this.saveActivitiesToFile();
  }

  // Activity methods
  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }

  async getActiveActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(activity => activity.isActive);
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      id,
      name: insertActivity.name,
      description: insertActivity.description,
      shortDescription: insertActivity.shortDescription,
      price: insertActivity.price,
      duration: insertActivity.duration,
      location: insertActivity.location,
      includes: insertActivity.includes,
      images: insertActivity.images || null,
      isActive: insertActivity.isActive,
      iconType: insertActivity.iconType,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.activities.set(id, activity);
    this.saveActivitiesToFile();
    return activity;
  }

  async updateActivity(id: number, updates: Partial<Activity>): Promise<Activity | undefined> {
    const existingActivity = this.activities.get(id);
    if (!existingActivity) {
      return undefined;
    }
    
    const updatedActivity: Activity = {
      ...existingActivity,
      ...updates,
      updatedAt: new Date(),
    };
    this.activities.set(id, updatedActivity);
    this.saveActivitiesToFile();
    return updatedActivity;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const exists = this.activities.has(id);
    if (exists) {
      this.activities.delete(id);
      this.saveActivitiesToFile();
    }
    return exists;
  }

  async deleteReservation(id: number): Promise<boolean> {
    const deleted = this.reservations.delete(id);
    return deleted;
  }


  // Hero banner methods
  async getAllHeroBanners(): Promise<HeroBanner[]> {
    return Array.from(this.heroBanners.values()).sort((a, b) => ((a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
  }

  async getActiveHeroBanners(): Promise<HeroBanner[]> {
    return Array.from(this.heroBanners.values())
      .filter(banner => banner.isActive)
      .sort((a, b) => ((a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
  }

  async getHeroBanner(id: number): Promise<HeroBanner | undefined> {
    return this.heroBanners.get(id);
  }

  async createHeroBanner(insertBanner: InsertHeroBanner): Promise<HeroBanner> {
    const id = ++this.currentHeroBannerId;
    const banner: HeroBanner = {
      id,
      title: insertBanner.title,
      description: insertBanner.description || null,
      imageUrl: insertBanner.imageUrl,
      buttonText: insertBanner.buttonText || null,
      buttonUrl: insertBanner.buttonUrl || null,
      isActive: insertBanner.isActive,
      displayOrder: insertBanner.displayOrder || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.heroBanners.set(id, banner);
    return banner;
  }

  async updateHeroBanner(id: number, updates: Partial<HeroBanner>): Promise<HeroBanner | undefined> {
    const banner = this.heroBanners.get(id);
    if (!banner) return undefined;
    
    const updatedBanner: HeroBanner = {
      ...banner,
      ...updates,
      updatedAt: new Date(),
    };
    this.heroBanners.set(id, updatedBanner);
    return updatedBanner;
  }

  async deleteHeroBanner(id: number): Promise<boolean> {
    return this.heroBanners.delete(id);
  }


  private initializeBanners() {
    const banners = [
      {
        id: 1,
        title: "Bienvenido a Bahía Santamaría",
        description: "Brisa marina, tranquilidad y mar. Tu refugio perfecto en la Costa Caribe",
        imageUrl: "/attached_assets/image_1752432673495.png",
        buttonText: "Reservar Ahora",
        buttonUrl: "#reservar",
        isActive: true,
        displayOrder: 1,
      },
      {
        id: 2,
        title: "Experiencia Marina Auténtica",
        description: "Desconéctate de la rutina y conecta con el mar Caribe en Moñitos, Córdoba",
        imageUrl: "/attached_assets/image_1752432673495.png",
        buttonText: "Explorar Cabañas",
        buttonUrl: "#overview",
        isActive: true,
        displayOrder: 2,
      },
      {
        id: 3,
        title: "Tranquilidad Frente al Mar",
        description: "Dos cabañas exclusivas con vista al mar para tu escape perfecto",
        imageUrl: "/attached_assets/image_1752432673495.png",
        buttonText: "Ver Galería",
        buttonUrl: "#gallery",
        isActive: true,
        displayOrder: 3,
      },
    ];

    banners.forEach(banner => {
      const bannerData: HeroBanner = {
        ...banner,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.heroBanners.set(banner.id, bannerData);
    });
    
    this.currentHeroBannerId = Math.max(...banners.map(b => b.id));
  }




}



export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllCabins(): Promise<Cabin[]> {
    return await db.select().from(cabins).where(eq(cabins.isActive, true));
  }

  async getCabin(id: number): Promise<Cabin | undefined> {
    const [cabin] = await db.select().from(cabins).where(eq(cabins.id, id));
    return cabin || undefined;
  }

  async createCabin(insertCabin: InsertCabin): Promise<Cabin> {
    const [cabin] = await db
      .insert(cabins)
      .values(insertCabin)
      .returning();
    return cabin;
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || undefined;
  }

  async getAllReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations);
  }

  async getReservationsByDateRange(startDate: string, endDate: string): Promise<Reservation[]> {
    return await db.select().from(reservations).where(
      and(
        or(
          and(
            gte(reservations.checkIn, startDate),
            lte(reservations.checkIn, endDate)
          ),
          and(
            gte(reservations.checkOut, startDate),
            lte(reservations.checkOut, endDate)
          ),
          and(
            lte(reservations.checkIn, startDate),
            gte(reservations.checkOut, endDate)
          )
        ),
        or(
          eq(reservations.status, "confirmed"),
          eq(reservations.status, "pending")
        )
      )
    );
  }

  async getReservationsByCabinAndDateRange(cabinId: number, startDate: string, endDate?: string): Promise<Reservation[]> {
    const endDateValue = endDate || startDate;
    
    // Get all reservations for this cabin
    const allReservations = await db.select().from(reservations).where(
      and(
        eq(reservations.cabinId, cabinId),
        or(
          eq(reservations.status, "confirmed"),
          eq(reservations.status, "pending")
        )
      )
    );
    
    // Filter for true overlaps in JavaScript to handle date logic properly
    return allReservations.filter(reservation => {
      const existingCheckIn = new Date(reservation.checkIn);
      const existingCheckOut = new Date(reservation.checkOut);
      const newCheckIn = new Date(startDate);
      const newCheckOut = new Date(endDateValue);
      
      // True overlap: existing check-in is before new check-out AND existing check-out is after new check-in
      // Allow same-day checkout/checkin (checkout at 11am, checkin at 3pm same day)
      return existingCheckIn < newCheckOut && existingCheckOut > newCheckIn;
    });
  }

  async createReservation(insertReservation: InsertReservation & { 
    confirmationCode: string; 
    frozenUntil: Date;
    paymentInstructions?: string;
  }): Promise<Reservation> {
    const [reservation] = await db
      .insert(reservations)
      .values({
        ...insertReservation,
        status: "pending",
        frozenUntil: insertReservation.frozenUntil,
        confirmationCode: insertReservation.confirmationCode,
        paymentInstructions: insertReservation.paymentInstructions,
      })
      .returning();
    return reservation;
  }

  async updateReservationStatus(id: number, status: "pending" | "confirmed" | "cancelled" | "expired", calendarEventId?: string): Promise<Reservation | undefined> {
    const updateData: any = { 
      status, 
      updatedAt: new Date()
    };
    
    if (calendarEventId) {
      updateData.googleCalendarEventId = calendarEventId;
    }

    const [reservation] = await db
      .update(reservations)
      .set(updateData)
      .where(eq(reservations.id, id))
      .returning();
    return reservation || undefined;
  }

  async updateReservationCalendarId(id: number, calendarEventId: string): Promise<Reservation | undefined> {
    const [reservation] = await db
      .update(reservations)
      .set({ 
        googleCalendarEventId: calendarEventId,
        updatedAt: new Date()
      })
      .where(eq(reservations.id, id))
      .returning();
    return reservation || undefined;
  }

  async getExpiredReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations).where(
      and(
        eq(reservations.status, "pending"),
        lte(reservations.frozenUntil, new Date())
      )
    );
  }

  async getReservationByConfirmationCode(confirmationCode: string): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.confirmationCode, confirmationCode));
    return reservation || undefined;
  }

  // Admin methods
  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return admin;
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers);
  }

  async createAdmin(insertAdmin: InsertAdminUser): Promise<AdminUser> {
    const [admin] = await db
      .insert(adminUsers)
      .values(insertAdmin)
      .returning();
    return admin;
  }

  // Gallery methods
  async getAllGalleryImages(): Promise<GalleryImage[]> {
    return await db.select().from(galleryImages).orderBy(galleryImages.displayOrder);
  }

  async getActiveGalleryImages(): Promise<GalleryImage[]> {
    return await db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.isActive, true))
      .orderBy(galleryImages.displayOrder);
  }

  async createGalleryImage(insertImage: InsertGalleryImage): Promise<GalleryImage> {
    const [image] = await db
      .insert(galleryImages)
      .values(insertImage)
      .returning();
    return image;
  }

  async updateGalleryImage(id: number, updates: Partial<GalleryImage>): Promise<GalleryImage | undefined> {
    const [updated] = await db
      .update(galleryImages)
      .set(updates)
      .where(eq(galleryImages.id, id))
      .returning();
    return updated;
  }

  async deleteGalleryImage(id: number): Promise<boolean> {
    // Primero obtener la imagen para saber qué archivo eliminar
    const [image] = await db.select().from(galleryImages).where(eq(galleryImages.id, id));
    
    if (image) {
      // Si es una imagen subida (no es de attached_assets), eliminar el archivo físico
      if (image.imageUrl.startsWith('/uploads/')) {
        try {
          const filePath = path.join(process.cwd(), 'public', image.imageUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Archivo físico eliminado: ${filePath}`);
          }
        } catch (error) {
          console.error('Error al eliminar archivo físico:', error);
        }
      }
      
      // Eliminar de la base de datos
      const result = await db
        .delete(galleryImages)
        .where(eq(galleryImages.id, id));
      return (result.rowCount ?? 0) > 0;
    }
    
    return false;
  }

  // Review methods
  async getAllReviews(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(reviews.displayOrder);
  }

  async getApprovedReviews(): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.isApproved, true))
      .orderBy(reviews.displayOrder);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  async updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined> {
    const [updated] = await db
      .update(reviews)
      .set(updates)
      .where(eq(reviews.id, id))
      .returning();
    return updated;
  }

  async deleteReview(id: number): Promise<boolean> {
    const result = await db
      .delete(reviews)
      .where(eq(reviews.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteReservation(id: number): Promise<boolean> {
    const result = await db
      .delete(reservations)
      .where(eq(reservations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Activity methods
  async getAllActivities(): Promise<Activity[]> {
    return await db.select().from(activities);
  }

  async getActiveActivities(): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.isActive, true));
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async updateActivity(id: number, updates: Partial<Activity>): Promise<Activity | undefined> {
    const [activity] = await db
      .update(activities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(activities.id, id))
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return (result.rowCount || 0) > 0;
  }


  // Hero banner methods
  async getAllHeroBanners(): Promise<HeroBanner[]> {
    const banners = await db.select().from(heroBanners).orderBy(heroBanners.displayOrder);
    return banners;
  }

  async getActiveHeroBanners(): Promise<HeroBanner[]> {
    const banners = await db.select().from(heroBanners)
      .where(eq(heroBanners.isActive, true))
      .orderBy(heroBanners.displayOrder);
    return banners;
  }

  async getHeroBanner(id: number): Promise<HeroBanner | undefined> {
    const [banner] = await db.select().from(heroBanners).where(eq(heroBanners.id, id));
    return banner;
  }

  async createHeroBanner(insertBanner: InsertHeroBanner): Promise<HeroBanner> {
    const [banner] = await db.insert(heroBanners).values(insertBanner).returning();
    return banner;
  }

  async updateHeroBanner(id: number, updates: Partial<HeroBanner>): Promise<HeroBanner | undefined> {
    const [banner] = await db.update(heroBanners)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(heroBanners.id, id))
      .returning();
    return banner;
  }

  async deleteHeroBanner(id: number): Promise<boolean> {
    const result = await db.delete(heroBanners).where(eq(heroBanners.id, id));
    return (result.rowCount || 0) > 0;
  }

}

export const storage = new DatabaseStorage();
