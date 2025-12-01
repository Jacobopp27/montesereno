import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReservationSchema, insertAdminUserSchema, insertGalleryImageSchema, insertReviewSchema, insertActivitySchema, insertHeroBannerSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { 
  sendReservationConfirmationToGuest, 
  sendReservationNotificationToOwner,
  sendReservationConfirmedToGuest,
  sendReservationExpiredToGuest 
} from "./email";
import { afterActivityChange } from "./sync-migration";
import { ObjectStorageService } from "./objectStorage.js";

// Extend session interface for admin authentication
declare module 'express-session' {
  interface SessionData {
    adminId?: number;
  }
}

// Google Calendar API setup
import { google } from 'googleapis';

// Colombian holidays function
function isColombianHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();
  
  // Fixed holidays
  const fixedHolidays = [
    { month: 1, day: 1 },   // New Year's Day
    { month: 5, day: 1 },   // Labor Day
    { month: 7, day: 20 },  // Independence Day
    { month: 8, day: 7 },   // Battle of Boyacá
    { month: 12, day: 8 },  // Immaculate Conception
    { month: 12, day: 25 }, // Christmas Day
  ];
  
  // Check fixed holidays
  for (const holiday of fixedHolidays) {
    if (month === holiday.month && day === holiday.day) {
      return true;
    }
  }
  
  // Moveable holidays that are moved to Monday (Ley Emiliani)
  const moveableHolidays = getColombianMoveableHolidays(year);
  const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  
  return moveableHolidays.includes(dateString);
}

function getColombianMoveableHolidays(year: number): string[] {
  const holidays: string[] = [];
  
  // Calculate Easter Sunday
  const easter = getEasterDate(year);
  
  // Easter-based holidays (fixed dates, not moved)
  holidays.push(formatDate(addDays(easter, -3))); // Maundy Thursday
  holidays.push(formatDate(addDays(easter, -2))); // Good Friday
  
  // Easter-based holidays moved to Monday (Ley Emiliani)
  holidays.push(formatDate(moveToMonday(addDays(easter, 39)))); // Ascension Day
  holidays.push(formatDate(moveToMonday(addDays(easter, 60)))); // Corpus Christi
  holidays.push(formatDate(moveToMonday(addDays(easter, 68)))); // Sacred Heart
  
  // Other holidays moved to Monday (Ley Emiliani)
  const epiphany = moveToMonday(new Date(year, 0, 6)); // January 6 - Epiphany
  const saintJoseph = moveToMonday(new Date(year, 2, 19)); // March 19 - Saint Joseph
  const saintsPeterPaul = moveToMonday(new Date(year, 5, 29)); // June 29 - Saints Peter and Paul
  const assumption = moveToMonday(new Date(year, 7, 15)); // August 15 - Assumption
  const columbusDay = moveToMonday(new Date(year, 9, 12)); // October 12 - Columbus Day
  const allSaints = moveToMonday(new Date(year, 10, 1)); // November 1 - All Saints
  const cartagenaIndependence = moveToMonday(new Date(year, 10, 11)); // November 11 - Cartagena Independence
  
  holidays.push(formatDate(epiphany));
  holidays.push(formatDate(saintJoseph));
  holidays.push(formatDate(saintsPeterPaul));
  holidays.push(formatDate(assumption));
  holidays.push(formatDate(columbusDay));
  holidays.push(formatDate(allSaints));
  holidays.push(formatDate(cartagenaIndependence));
  
  // Remove duplicates and sort
  return [...new Set(holidays)].sort();
}

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

function moveToMonday(date: Date): Date {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 1) return date; // Already Monday
  
  const daysToAdd = dayOfWeek === 0 ? 1 : (8 - dayOfWeek); // If Sunday, add 1; otherwise, move to next Monday
  return addDays(date, daysToAdd);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let calendar: any = null;

// Initialize Google Calendar API
function initializeGoogleCalendar() {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.warn("Google Calendar API credentials not provided. Calendar integration will be disabled.");
    return null;
  }

  try {
    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      GOOGLE_PRIVATE_KEY,
      ['https://www.googleapis.com/auth/calendar']
    );

    return google.calendar({ version: 'v3', auth });
  } catch (error) {
    console.error("Failed to initialize Google Calendar API:", error);
    return null;
  }
}

// Configure multer for gallery uploads (persistent storage)
const gallery_storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/assets/gallery';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for Object Storage (PERSISTENT for all uploads)
const persistentStorageConfig = multer.memoryStorage(); // Memory storage for Object Storage uploads

const galleryUpload = multer({
  storage: persistentStorageConfig, // CHANGED: Now uses Object Storage
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const activityUpload = multer({
  storage: persistentStorageConfig, // CHANGED: Now uses Object Storage
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common image formats including mobile formats
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/webp', 'image/heic', 'image/heif'
    ];
    
    if (allowedTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      console.log(`[IMAGE UPLOAD] Rejected file type: ${file.mimetype}`);
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten imágenes.`));
    }
  }
});

const bannerUpload = multer({
  storage: persistentStorageConfig, // CHANGED: Now uses Object Storage
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware for admin authentication
const requireAdminAuth = (req: any, res: any, next: any) => {
  if (!req.session?.adminId) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from public/assets (persistent storage)
  app.use('/assets', express.static(path.join(process.cwd(), 'public/assets')));
  
  // Session configuration for admin panel
  app.use(session({
    secret: process.env.SESSION_SECRET || 'villa-al-cielo-admin-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static('uploads'));
  
  // Serve public objects from App Storage (persistent storage)
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Initialize Google Calendar
  calendar = initializeGoogleCalendar();
  
  // Add migration endpoint for urgent image migration
  app.post("/api/admin/migrate-to-app-storage", async (req, res) => {
    // Check admin authentication
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Admin authentication required" });
    }
    
    try {
      const { runMigration } = await import('./migrate-to-app-storage.js');
      await runMigration();
      res.json({ success: true, message: "Migration completed successfully" });
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({ error: "Migration failed", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Check for expired reservations every 10 minutes
  setInterval(async () => {
    try {
      const expiredReservations = await storage.getExpiredReservations();
      for (const reservation of expiredReservations) {
        if (reservation.status === 'pending') {
          await storage.updateReservationStatus(reservation.id, 'expired');
          console.log(`Reservation ${reservation.confirmationCode} expired and marked as expired`);
        }
      }
    } catch (error) {
      console.error('Error checking expired reservations:', error);
    }
  }, 10 * 60 * 1000); // Check every 10 minutes

  // Get all cabins
  app.get("/api/cabins", async (req, res) => {
    try {
      const cabins = await storage.getAllCabins();
      res.json(cabins);
    } catch (error) {
      console.error("Error fetching cabins:", error);
      res.status(500).json({ error: "Failed to fetch cabins" });
    }
  });

  // Get public gallery images
  app.get("/api/gallery", async (req, res) => {
    try {
      console.log('🚨 [API ROUTE] Gallery API called - using storage.getActiveGalleryImages()');
      const images = await storage.getActiveGalleryImages();
      console.log('🚨 [API ROUTE] Retrieved images:', images.map(img => ({id: img.id, title: img.title})));
      res.json(images);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      res.status(500).json({ error: "Failed to fetch gallery images" });
    }
  });

  // Get public reviews
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getApprovedReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Get Colombian holidays for a given year
  app.get("/api/holidays/:year", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      if (isNaN(year) || year < 2020 || year > 2030) {
        return res.status(400).json({ error: "Invalid year" });
      }

      const holidays = getColombianMoveableHolidays(year);
      
      // Add fixed holidays
      const fixedHolidays = [
        `${year}-01-01`, // New Year's Day
        `${year}-05-01`, // Labor Day
        `${year}-07-20`, // Independence Day
        `${year}-08-07`, // Battle of Boyacá
        `${year}-12-08`, // Immaculate Conception
        `${year}-12-25`, // Christmas Day
      ];

      const allHolidays = [...holidays, ...fixedHolidays].sort();
      
      res.json({ year, holidays: allHolidays });
    } catch (error) {
      console.error("Error fetching holidays:", error);
      res.status(500).json({ error: "Failed to fetch holidays" });
    }
  });

  // Get cabin availability for specific dates
  app.get("/api/cabins/availability", async (req, res) => {
    try {
      const { startDate, endDate, guests } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: "Start date and end date are required"
        });
      }

      const numberOfGuests = parseInt(guests as string) || 2;
      const cabins = await storage.getAllCabins();
      const availability = [];

      for (const cabin of cabins) {
        const reservations = await storage.getReservationsByCabinAndDateRange(
          cabin.id,
          startDate as string,
          endDate as string
        );

        // Calculate price based on dates and guests
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        let totalPrice = 0;
        let includesAsado = false;
        
        // Check each day to determine if it's weekday or weekend
        // Friday-Saturday = weekend, Sunday-Monday = weekday (unless Monday is holiday)
        // Holiday pricing applies to the night before the holiday
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
          const nextDay = new Date(d);
          nextDay.setDate(nextDay.getDate() + 1);
          const isNextDayHoliday = isColombianHoliday(nextDay);
          
          // Weekend pricing: Friday, Saturday, or night before any holiday
          const isWeekendPricing = dayOfWeek === 5 || dayOfWeek === 6 || isNextDayHoliday;
          
          let dailyPrice = isWeekendPricing ? cabin.weekendPrice : cabin.weekdayPrice;
          
          // Apply guest pricing logic for Montesereno Glamping
          // Single cabin accommodates up to 6 guests
          if (numberOfGuests > 2) {
            // Base price includes 2 guests, charge 50k COP per additional guest
            const extraGuests = numberOfGuests - 2;
            dailyPrice += extraGuests * 50000; // 50k per extra person as per config
          }
          includesAsado = false; // No asado included
          
          totalPrice += dailyPrice;
        }

        // Filter only confirmed and pending reservations for availability check
        const activeReservations = reservations.filter(r => 
          r.status === 'confirmed' || r.status === 'pending'
        );

        // Skip cabin if guest count exceeds capacity (max 6 guests for Montesereno)
        if (numberOfGuests > 6) {
          continue;
        }

        availability.push({
          cabin,
          isAvailable: activeReservations.length === 0,
          totalPrice,
          includesAsado,
          days,
          guests: numberOfGuests,
          reservations: activeReservations.map(r => ({
            checkIn: r.checkIn,
            checkOut: r.checkOut,
            status: r.status
          }))
        });
      }

      res.json(availability);
    } catch (error) {
      console.error("Error checking cabin availability:", error);
      res.status(500).json({ error: "Failed to check availability" });
    }
  });

  // Get availability for date range
  app.get("/api/availability", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: "Start date and end date are required",
          available: true,
          bookedDates: []
        });
      }

      // Get existing reservations
      const reservations = await storage.getReservationsByDateRange(
        startDate as string, 
        endDate as string
      );

      // Get booked dates from reservations
      const bookedDates: string[] = [];
      reservations.forEach(reservation => {
        const start = new Date(reservation.checkIn);
        const end = new Date(reservation.checkOut);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          bookedDates.push(d.toISOString().split('T')[0]);
        }
      });

      // Check Google Calendar if available
      let calendarEvents: string[] = [];
      if (calendar) {
        try {
          const response = await calendar.events.list({
            calendarId: GOOGLE_CALENDAR_ID,
            timeMin: new Date(startDate as string).toISOString(),
            timeMax: new Date(endDate as string).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          });

          calendarEvents = response.data.items?.map((event: any) => {
            if (event.start.date) {
              return event.start.date;
            } else if (event.start.dateTime) {
              return new Date(event.start.dateTime).toISOString().split('T')[0];
            }
            return null;
          }).filter(Boolean) || [];
        } catch (error) {
          console.error("Error fetching calendar events:", error);
        }
      }

      const allBookedDates = Array.from(new Set([...bookedDates, ...calendarEvents]));
      
      res.json({
        available: allBookedDates.length === 0,
        bookedDates: allBookedDates
      });
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({ 
        error: "Failed to check availability",
        available: true,
        bookedDates: []
      });
    }
  });

  // Create reservation
  app.post("/api/reservations", async (req, res) => {
    try {
      const validatedData = insertReservationSchema.parse(req.body);
      
      // Check if cabin exists
      const cabin = await storage.getCabin(validatedData.cabinId);
      if (!cabin) {
        return res.status(400).json({ 
          error: "Cabin not found" 
        });
      }

      // Check availability in Google Calendar first (real-time availability)
      if (calendar) {
        try {
          const response = await calendar.events.list({
            calendarId: GOOGLE_CALENDAR_ID,
            timeMin: new Date(validatedData.checkIn).toISOString(),
            timeMax: new Date(validatedData.checkOut).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          });

          if (response.data.items && response.data.items.length > 0) {
            return res.status(400).json({ 
              error: "Selected dates are not available according to calendar" 
            });
          }
        } catch (error) {
          console.error("Error checking Google Calendar availability:", error);
        }
      }

      // Check if dates are available for this specific cabin in database
      const conflictingReservations = await storage.getReservationsByCabinAndDateRange(
        validatedData.cabinId,
        validatedData.checkIn,
        validatedData.checkOut
      );

      // Filter only active reservations (confirmed or pending)
      const activeConflicts = conflictingReservations.filter(r => 
        r.status === 'confirmed' || r.status === 'pending'
      );

      if (activeConflicts.length > 0) {
        const conflictDetails = activeConflicts.map(r => 
          `${r.checkIn} a ${r.checkOut} (${r.status})`
        ).join(', ');
        
        return res.status(400).json({ 
          error: `Las fechas seleccionadas no están disponibles. Reservas existentes: ${conflictDetails}` 
        });
      }

      // Generate confirmation code and freeze period (24 hours)
      const confirmationCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const frozenUntil = new Date();
      frozenUntil.setHours(frozenUntil.getHours() + 24);

      // Payment instructions (50% deposit)
      const depositAmount = Math.round(validatedData.totalPrice * 0.5);
      const paymentInstructions = `
        ABONO DEL 50% REQUERIDO: $${depositAmount.toLocaleString()} COP
        
        Titular: Andrés Felipe Santamaría
        CC: 80854724
        
        BANCOLOMBIA - Ahorros: 91225289099
        DAVIVIENDA - Ahorros: 488423818217
        NEQUI: 3115730499
        
        Envía el comprobante por WhatsApp: +57 311 5730499
        Incluye tu código de confirmación: ${confirmationCode}
      `;

      // Create reservation in storage with pending status
      const reservation = await storage.createReservation({
        ...validatedData,
        confirmationCode,
        frozenUntil,
        paymentInstructions
      });

      // Send confirmation email to guest
      try {
        await sendReservationConfirmationToGuest(reservation, cabin);
      } catch (error) {
        console.error("Error sending guest confirmation email:", error);
      }

      // Send notification email to owner
      try {
        await sendReservationNotificationToOwner(reservation, cabin);
      } catch (error) {
        console.error("Error sending owner notification email:", error);
      }

      res.status(201).json({
        id: reservation.id,
        confirmationCode: reservation.confirmationCode,
        status: reservation.status,
        frozenUntil: reservation.frozenUntil,
        message: "Reserva creada exitosamente. Verifica tu email para instrucciones de pago."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      
      console.error("Error creating reservation:", error);
      res.status(500).json({ 
        error: "Failed to create reservation" 
      });
    }
  });

  // Create quick reservation (admin only - no emails)
  app.post("/api/admin/quick-reservation", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertReservationSchema.parse(req.body);
      
      // Check if cabin exists
      const cabin = await storage.getCabin(validatedData.cabinId);
      if (!cabin) {
        return res.status(400).json({ 
          error: "Cabin not found" 
        });
      }

      // Check if dates are available for this specific cabin
      const conflictingReservations = await storage.getReservationsByCabinAndDateRange(
        validatedData.cabinId,
        validatedData.checkIn,
        validatedData.checkOut
      );

      // Filter only active reservations (confirmed or pending)
      const activeConflicts = conflictingReservations.filter(r => 
        r.status === 'confirmed' || r.status === 'pending'
      );

      if (activeConflicts.length > 0) {
        const conflictDetails = activeConflicts.map(r => 
          `${r.checkIn} a ${r.checkOut} (${r.status})`
        ).join(', ');
        
        return res.status(400).json({ 
          error: `Las fechas seleccionadas no están disponibles. Reservas existentes: ${conflictDetails}` 
        });
      }

      // Generate confirmation code
      const confirmationCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      // Create reservation directly as confirmed (no emails)
      const reservation = await storage.createReservation({
        ...validatedData,
        confirmationCode,
        frozenUntil: null, // No freeze period for admin quick reservations
        paymentInstructions: "Reserva creada directamente por administrador"
      });

      // Update status to confirmed immediately
      const confirmedReservation = await storage.updateReservationStatus(reservation.id, 'confirmed');

      res.status(201).json({
        id: reservation.id,
        confirmationCode: reservation.confirmationCode,
        status: 'confirmed',
        message: "Reserva rápida creada exitosamente (sin correos)"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      
      console.error("Error creating quick reservation:", error);
      res.status(500).json({ 
        error: "Failed to create quick reservation" 
      });
    }
  });

  // Confirm reservation payment
  app.post("/api/reservations/:id/confirm", async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);
      const reservation = await storage.getReservation(reservationId);
      
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      if (reservation.status !== "pending") {
        return res.status(400).json({ error: "Reservation is not pending confirmation" });
      }

      // Create Google Calendar event when confirmed
      let calendarEventId = null;
      if (calendar) {
        try {
          const cabin = await storage.getCabin(reservation.cabinId);
          const event = {
            summary: `Villa al Cielo - ${reservation.guestName} (${cabin?.name || 'Cabin'})`,
            description: `Huésped: ${reservation.guestName}\nEmail: ${reservation.guestEmail}\nPersonas: ${reservation.guests}\nTotal: $${reservation.totalPrice.toLocaleString()} COP\nCódigo: ${reservation.confirmationCode}`,
            start: {
              date: reservation.checkIn,
              timeZone: 'America/Bogota',
            },
            end: {
              date: reservation.checkOut,
              timeZone: 'America/Bogota',
            },
            attendees: [
              { email: reservation.guestEmail }
            ],
          };

          const response = await calendar.events.insert({
            calendarId: GOOGLE_CALENDAR_ID,
            resource: event,
          });

          calendarEventId = response.data.id;
        } catch (error) {
          console.error("Error creating calendar event:", error);
        }
      }

      // Update reservation status to confirmed
      const confirmedReservation = await storage.updateReservationStatus(
        reservationId, 
        "confirmed", 
        calendarEventId || undefined
      );

      if (!confirmedReservation) {
        return res.status(500).json({ error: "Failed to confirm reservation" });
      }

      // Send confirmation email to guest
      try {
        const cabin = await storage.getCabin(reservation.cabinId);
        if (cabin) {
          const emailSent = await sendReservationConfirmedToGuest(confirmedReservation, cabin);
          console.log(`Confirmation email sent to guest: ${emailSent ? 'SUCCESS' : 'FAILED'}`);
        }
      } catch (error) {
        console.error("Error sending confirmation email:", error);
        console.error("Full error details:", error);
      }

      res.json({
        message: "Reservation confirmed successfully",
        reservation: confirmedReservation
      });
    } catch (error) {
      console.error("Error confirming reservation:", error);
      res.status(500).json({ error: "Failed to confirm reservation" });
    }
  });

  // Get reservation by confirmation code
  app.get("/api/reservations/code/:code", async (req, res) => {
    try {
      const confirmationCode = req.params.code.toUpperCase();
      const reservation = await storage.getReservationByConfirmationCode(confirmationCode);
      
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      res.json(reservation);
    } catch (error) {
      console.error("Error fetching reservation by code:", error);
      res.status(500).json({ error: "Failed to fetch reservation" });
    }
  });

  // Process expired reservations (should be called periodically)
  app.post("/api/reservations/process-expired", async (req, res) => {
    try {
      const expiredReservations = await storage.getExpiredReservations();
      
      for (const reservation of expiredReservations) {
        // Update status to expired
        await storage.updateReservationStatus(reservation.id, "expired");
        
        // Send expiration email to guest
        try {
          const cabin = await storage.getCabin(reservation.cabinId);
          if (cabin) {
            await sendReservationExpiredToGuest(reservation, cabin);
          }
        } catch (error) {
          console.error("Error sending expiration email:", error);
        }
      }

      res.json({
        message: `Processed ${expiredReservations.length} expired reservations`,
        count: expiredReservations.length
      });
    } catch (error) {
      console.error("Error processing expired reservations:", error);
      res.status(500).json({ error: "Failed to process expired reservations" });
    }
  });

  // Get all reservations
  app.get("/api/reservations", async (req, res) => {
    try {
      const reservations = await storage.getAllReservations();
      res.json(reservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      res.status(500).json({ 
        error: "Failed to fetch reservations" 
      });
    }
  });

  // ========== ADMIN PANEL ROUTES ==========

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.adminId = admin.id;
      res.json({ message: "Login successful", adminId: admin.id });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Check admin auth status
  app.get("/api/admin/auth", (req, res) => {
    if (req.session?.adminId) {
      res.json({ authenticated: true, adminId: req.session.adminId });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Create initial admin user (for first setup)
  app.post("/api/admin/setup", async (req, res) => {
    try {
      const existingAdmins = await storage.getAllAdmins();
      if (existingAdmins.length > 0) {
        return res.status(400).json({ error: "Admin already exists" });
      }

      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await storage.createAdmin({ username, password: hashedPassword });
      
      res.json({ message: "Admin created successfully", adminId: admin.id });
    } catch (error) {
      console.error("Admin setup error:", error);
      res.status(500).json({ error: "Setup failed" });
    }
  });

  // ========== ADMIN DASHBOARD ROUTES ==========

  // Public test email endpoint for development
  app.post("/api/test-email-public", async (req, res) => {
    try {
      const { email, subject, message } = req.body;
      
      if (!email || !subject || !message) {
        return res.status(400).json({ error: "Email, subject, and message are required" });
      }

      // Import sendEmail function
      const { sendReservationConfirmationToGuest } = await import('./email.js');
      
      // Test with a mock reservation to use existing email function
      const testReservation = {
        id: 999,
        guestName: "Prueba Sistema",
        guestEmail: email,
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        totalPrice: 200000,
        confirmationCode: "TEST123",
        includesAsado: false,
        cabinId: 1,
        guests: 2,
        status: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        frozenUntil: new Date(Date.now() + 86400000),
        calendarEventId: null,
        googleCalendarEventId: null,
        paymentInstructions: null
      };

      const testCabin = {
        id: 1,
        name: "Cielo",
        weekdayPrice: 200000,
        weekendPrice: 390000,
        isActive: true
      };

      const success = await sendReservationConfirmationToGuest(testReservation, testCabin);

      if (success) {
        res.json({ message: "Email sent successfully", emailService: "dual-route system" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  // Test email endpoint (admin only)
  app.post("/api/admin/test-email", requireAdminAuth, async (req, res) => {
    try {
      const { email, subject, message } = req.body;
      
      if (!email || !subject || !message) {
        return res.status(400).json({ error: "Email, subject, and message are required" });
      }

      // Import sendEmail function
      const { sendReservationConfirmationToGuest } = await import('./email.js');
      
      // Test the dual-route email system with a simple test email
      const testParams = {
        to: email,
        from: "admin@villaalcielo.com",
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6b705c;">Villa al Cielo - Prueba de Sistema de Correos</h1>
            <p>${message}</p>
            <p style="color: #666; font-size: 12px;">Este es un correo de prueba del sistema de doble ruta (SendGrid/Gmail API)</p>
          </div>
        `
      };

      // Test with a mock reservation to use existing email function
      const testReservation = {
        id: 999,
        guestName: "Prueba Sistema",
        guestEmail: email,
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        totalPrice: 200000,
        confirmationCode: "TEST123",
        includesAsado: false,
        cabinId: 1,
        guests: 2,
        status: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        frozenUntil: new Date(Date.now() + 86400000),
        calendarEventId: null,
        googleCalendarEventId: null,
        paymentInstructions: null
      };

      const testCabin = {
        id: 1,
        name: "Cielo",
        weekdayPrice: 200000,
        weekendPrice: 390000,
        isActive: true
      };

      const success = await sendReservationConfirmationToGuest(testReservation, testCabin);

      if (success) {
        res.json({ message: "Email sent successfully", emailService: "dual-route system" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  // Get dashboard statistics
  app.get("/api/admin/dashboard/stats", requireAdminAuth, async (req, res) => {
    try {
      const reservations = await storage.getAllReservations();
      const currentYear = new Date().getFullYear();
      
      const stats = {
        totalReservations: reservations.length,
        pendingReservations: reservations.filter(r => r.status === 'pending').length,
        confirmedReservations: reservations.filter(r => r.status === 'confirmed').length,
        totalRevenue: reservations
          .filter(r => r.status === 'confirmed')
          .reduce((sum, r) => sum + r.totalPrice, 0),
        thisYearReservations: reservations
          .filter(r => new Date(r.createdAt!).getFullYear() === currentYear).length,
        monthlyData: getMonthlyReservationData(reservations),
        revenueData: getMonthlyRevenueData(reservations),
        occupancyRate: getMonthlyOccupancyRate(reservations)
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  // ========== RESERVATION MANAGEMENT ROUTES ==========

  // Get all reservations for admin
  app.get("/api/admin/reservations", requireAdminAuth, async (req, res) => {
    try {
      const reservations = await storage.getAllReservations();
      const cabins = await storage.getAllCabins();
      
      const enrichedReservations = await Promise.all(
        reservations.map(async (reservation) => {
          const cabin = cabins.find(c => c.id === reservation.cabinId);
          return {
            ...reservation,
            cabin: cabin || null
          };
        })
      );
      
      res.json(enrichedReservations);
    } catch (error) {
      console.error("Error fetching admin reservations:", error);
      res.status(500).json({ error: "Failed to fetch reservations" });
    }
  });

  // Update reservation status (approve/deny)
  app.patch("/api/admin/reservations/:id/status", requireAdminAuth, async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);
      const { status, calendarEventId } = req.body;
      
      if (!['confirmed', 'cancelled', 'expired'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updatedReservation = await storage.updateReservationStatus(
        reservationId, 
        status, 
        calendarEventId
      );

      if (!updatedReservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      // Send appropriate email based on status
      const cabin = await storage.getCabin(updatedReservation.cabinId);
      if (cabin) {
        if (status === 'confirmed') {
          await sendReservationConfirmedToGuest(updatedReservation, cabin);
        } else if (status === 'expired') {
          await sendReservationExpiredToGuest(updatedReservation, cabin);
        }
      }

      res.json(updatedReservation);
    } catch (error) {
      console.error("Error updating reservation status:", error);
      res.status(500).json({ error: "Failed to update reservation" });
    }
  });

  // Cancel reservation (sets status to cancelled)
  app.patch("/api/admin/reservations/:id/cancel", requireAdminAuth, async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);
      
      const updatedReservation = await storage.updateReservationStatus(
        reservationId, 
        'cancelled'
      );

      if (!updatedReservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      res.json({ 
        message: "Reservation cancelled successfully", 
        reservation: updatedReservation 
      });
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      res.status(500).json({ error: "Failed to cancel reservation" });
    }
  });

  // Delete reservation completely
  app.delete("/api/admin/reservations/:id", requireAdminAuth, async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);
      
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      const deleted = await storage.deleteReservation(reservationId);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete reservation" });
      }

      res.json({ message: "Reservation deleted successfully" });
    } catch (error) {
      console.error("Error deleting reservation:", error);
      res.status(500).json({ error: "Failed to delete reservation" });
    }
  });

  // ========== GALLERY MANAGEMENT ROUTES ==========

  // ⚠️  DUPLICATE ROUTE REMOVED - using the first /api/gallery route instead

  // Get all gallery images for admin
  app.get("/api/admin/gallery", requireAdminAuth, async (req, res) => {
    try {
      const images = await storage.getAllGalleryImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching admin gallery:", error);
      res.status(500).json({ error: "Failed to fetch gallery" });
    }
  });

  // Add gallery image via URL
  app.post("/api/admin/gallery", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertGalleryImageSchema.parse(req.body);
      const image = await storage.createGalleryImage(validatedData);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error adding gallery image:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid image data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add image" });
    }
  });

  // Upload gallery image from device (PERSISTENT Object Storage)
  app.post("/api/admin/gallery/upload", requireAdminAuth, galleryUpload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      // Upload to Object Storage for PERSISTENCE (like banners)
      const objectStorageService = new ObjectStorageService();
      const uploadUrl = await objectStorageService.getPublicObjectUploadURL();
      
      // Upload to Object Storage (using buffer from memoryStorage)
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: req.file.buffer,
        headers: {
          'Content-Type': req.file.mimetype,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload to Object Storage failed: ${response.status}`);
      }
      
      // Parse upload URL to get persistent URL (like banners)
      const urlParts = new URL(uploadUrl);
      const objectPath = urlParts.pathname;
      const [, , ...rest] = objectPath.split("/");
      const objectName = rest.join("/");
      // Remove duplicate "public/" if present
      const cleanObjectName = objectName.startsWith("public/") ? objectName.substring(7) : objectName;
      const imageUrl = `/public-objects/${cleanObjectName}`;
      
      const imageData = {
        title,
        description: description || "",
        imageUrl, // PERSISTENT URL like banners
        isActive: true
      };

      const image = await storage.createGalleryImage(imageData);
      console.log(`✅ Nueva imagen de galería subida a Object Storage: ${imageUrl}`);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error uploading gallery image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Update gallery image
  app.patch("/api/admin/gallery/:id", requireAdminAuth, async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const updates = req.body;
      const updatedImage = await storage.updateGalleryImage(imageId, updates);
      
      if (!updatedImage) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      res.json(updatedImage);
    } catch (error) {
      console.error("Error updating gallery image:", error);
      res.status(500).json({ error: "Failed to update image" });
    }
  });

  // Migrate all images to persistent storage
  app.post("/api/admin/migrate-images", requireAdminAuth, async (req, res) => {
    try {
      const { migrateImagesToPersistentStorage } = await import('./migrate-to-persistent-storage.js');
      const result = await migrateImagesToPersistentStorage();
      res.json(result);
    } catch (error) {
      console.error("Error migrating images to persistent storage:", error);
      res.status(500).json({ error: "Failed to migrate images" });
    }
  });

  // Delete gallery image
  app.delete("/api/admin/gallery/:id", requireAdminAuth, async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const deleted = await storage.deleteGalleryImage(imageId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // ========== REVIEWS MANAGEMENT ROUTES ==========

  // Get approved reviews for public
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getApprovedReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Get all reviews for admin
  app.get("/api/admin/reviews", requireAdminAuth, async (req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching admin reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Add review
  app.post("/api/admin/reviews", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error adding review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid review data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add review" });
    }
  });

  // Update review
  app.patch("/api/admin/reviews/:id", requireAdminAuth, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const updates = req.body;
      const updatedReview = await storage.updateReview(reviewId, updates);
      
      if (!updatedReview) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      res.json(updatedReview);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  // Delete review
  app.delete("/api/admin/reviews/:id", requireAdminAuth, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const deleted = await storage.deleteReview(reviewId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  // Test confirmation email endpoint (admin only)
  app.post("/api/admin/test-confirmation", requireAdminAuth, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Create test reservation data
      const testReservation = {
        id: 999,
        guestName: 'Usuario de Prueba Confirmación',
        guestEmail: email,
        checkIn: '2025-06-25',
        checkOut: '2025-06-27',
        totalPrice: 780000,
        confirmationCode: 'TEST-CONF-' + Date.now(),
        includesAsado: true,
        cabinId: 1,
        guests: 2,
        status: 'confirmed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        frozenUntil: new Date(Date.now() + 86400000),
        calendarEventId: null,
        googleCalendarEventId: null,
        paymentInstructions: null
      };

      const testCabin = {
        id: 1,
        name: 'Cielo',
        weekdayPrice: 200000,
        weekendPrice: 390000,
        isActive: true
      };

      console.log(`Testing confirmation email to: ${email}`);
      const emailSent = await sendReservationConfirmedToGuest(testReservation, testCabin);
      console.log(`Confirmation email result: ${emailSent ? 'SUCCESS' : 'FAILED'}`);

      res.json({ 
        success: emailSent,
        message: emailSent ? "Confirmation email sent successfully" : "Confirmation email failed to send",
        reservationCode: testReservation.confirmationCode
      });
    } catch (error) {
      console.error("Test confirmation email error:", error);
      res.status(500).json({ 
        error: "Confirmation email test failed",
        details: error.message
      });
    }
  });

  // ========== ACTIVITIES MANAGEMENT ROUTES ==========

  // Migration endpoint to move activity images to persistent storage
  app.post("/api/admin/migrate-activity-images", requireAdminAuth, async (req, res) => {
    try {
      console.log("[MIGRATION] Starting activity images migration...");
      
      const allActivities = await storage.getAllActivities();
      let migratedCount = 0;
      let updatedActivitiesCount = 0;
      let orphanImagesFound = 0;
      
      // First, handle activities with existing images in database
      for (const activity of allActivities) {
        if (activity.images) {
          try {
            const imageUrls = JSON.parse(activity.images);
            let hasChanges = false;
            const updatedUrls = imageUrls.map((url: string) => {
              if (url.startsWith('/uploads/activity-')) {
                const filename = path.basename(url);
                const oldPath = path.join(__dirname, '..', url);
                const newPath = path.join(__dirname, '..', 'public', 'assets', 'activities', filename);
                
                // Copy file if it exists and destination doesn't exist
                if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
                  fs.copyFileSync(oldPath, newPath);
                  migratedCount++;
                  console.log(`[MIGRATION] Migrated: ${filename}`);
                }
                
                hasChanges = true;
                return `/assets/activities/${filename}`;
              }
              return url;
            });
            
            if (hasChanges) {
              await storage.updateActivity(activity.id, { images: JSON.stringify(updatedUrls) });
              updatedActivitiesCount++;
              console.log(`[MIGRATION] Updated activity ${activity.id} URLs`);
            }
          } catch (e) {
            console.error(`[MIGRATION] Error processing activity ${activity.id}:`, e);
          }
        }
      }
      
      // Second, find orphan images and try to associate them with activities that have empty images
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        const activityFiles = files.filter(file => file.startsWith('activity-'));
        
        console.log(`[MIGRATION] Found ${activityFiles.length} potential orphan activity images`);
        
        // Get activities with empty images (but exclude activities that already have valid persistent images)
        const activitiesWithoutImages = allActivities.filter(activity => {
          if (!activity.images) return true;
          try {
            const imageUrls = JSON.parse(activity.images);
            if (imageUrls.length === 0) return true;
            
            // If activity has images in persistent storage, don't touch it
            const hasPersistentImages = imageUrls.some((url: string) => 
              url.startsWith('/assets/activities/') || url.startsWith('public/assets/activities/')
            );
            if (hasPersistentImages) {
              console.log(`[MIGRATION] Skipping activity ${activity.id} - already has persistent images`);
              return false;
            }
            
            return false;
          } catch (e) {
            return true;
          }
        });
        
        if (activitiesWithoutImages.length > 0 && activityFiles.length > 0) {
          // For activities without images, assign orphan images based on creation time proximity
          for (const activity of activitiesWithoutImages) {
            const orphanImages: string[] = [];
            
            // Take up to 10 orphan images for each activity without images
            const imagesToAssign = activityFiles.splice(0, Math.min(10, activityFiles.length));
            
            for (const filename of imagesToAssign) {
              const oldPath = path.join(uploadsDir, filename);
              const newPath = path.join(__dirname, '..', 'public', 'assets', 'activities', filename);
              
              // Copy to persistent storage
              if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
                fs.copyFileSync(oldPath, newPath);
                migratedCount++;
                orphanImagesFound++;
                console.log(`[MIGRATION] Migrated orphan image: ${filename} to activity ${activity.id} (${activity.name})`);
              }
              
              orphanImages.push(`/assets/activities/${filename}`);
            }
            
            if (orphanImages.length > 0) {
              await storage.updateActivity(activity.id, { images: JSON.stringify(orphanImages) });
              updatedActivitiesCount++;
              console.log(`[MIGRATION] Associated ${orphanImages.length} orphan images with activity ${activity.id} (${activity.name})`);
            }
            
            if (activityFiles.length === 0) break; // No more orphan images
          }
        }
      }
      
      console.log(`[MIGRATION] Completed: ${migratedCount} images migrated, ${updatedActivitiesCount} activities updated, ${orphanImagesFound} orphan images recovered`);
      res.json({ 
        success: true, 
        migratedImages: migratedCount, 
        updatedActivities: updatedActivitiesCount,
        orphanImages: orphanImagesFound,
        message: `Migration completed successfully. Recovered ${orphanImagesFound} orphan images.`
      });
    } catch (error) {
      console.error("[MIGRATION] Error during migration:", error);
      res.status(500).json({ error: "Migration failed", details: error.message });
    }
  });

  // Get all activities for public
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getActiveActivities();
      
      // Return activities without automatic cleanup (this was causing image deletion)
      const cleanedActivities = activities.map(activity => {
        if (activity.images) {
          try {
            const imageUrls = JSON.parse(activity.images);
            // Simply return the activity as-is, no automatic cleanup
            return {
              ...activity,
              images: JSON.stringify(imageUrls)
            };
          } catch (e) {
            console.error(`Error parsing images for activity ${activity.id}:`, e);
            return {
              ...activity,
              images: '[]'
            };
          }
        }
        return activity;
      });
      
      // Log for debugging but don't auto-clean
      console.log(`[ACTIVITIES API] Serving ${cleanedActivities.length} activities without auto-cleanup`);
      
      res.json(cleanedActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Get all activities for admin (with potential cleanup notification)
  app.get("/api/admin/activities", requireAdminAuth, async (req, res) => {
    try {
      const activities = await storage.getAllActivities();
      
      // For admin, we can show validation status but still don't auto-clean
      res.json(activities);
    } catch (error) {
      console.error("Error fetching admin activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Add activity
  app.post("/api/admin/activities", requireAdminAuth, async (req, res) => {
    try {
      console.log("Creating activity with data:", req.body);
      const validatedData = insertActivitySchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const activity = await storage.createActivity(validatedData);
      console.log("Activity created successfully:", activity);
      
      // Sincronizar script de migración
      await afterActivityChange();
      
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error adding activity:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ error: "Invalid activity data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add activity" });
    }
  });

  // Update activity
  app.patch("/api/admin/activities/:id", requireAdminAuth, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const updates = req.body;
      const updatedActivity = await storage.updateActivity(activityId, updates);
      
      if (!updatedActivity) {
        return res.status(404).json({ error: "Activity not found" });
      }
      
      // Sincronizar script de migración
      await afterActivityChange();
      
      res.json(updatedActivity);
    } catch (error) {
      console.error("Error updating activity:", error);
      res.status(500).json({ error: "Failed to update activity" });
    }
  });

  // Delete activity
  app.delete("/api/admin/activities/:id", requireAdminAuth, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const deleted = await storage.deleteActivity(activityId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Activity not found" });
      }
      
      // Sincronizar script de migración
      await afterActivityChange();
      
      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // Upload activity image
  app.post("/api/admin/activities/:id/images", (req, res, next) => {
    console.log("[IMAGE UPLOAD] Raw request received for activity", req.params.id);
    next();
  }, requireAdminAuth, (req, res, next) => {
    console.log("[IMAGE UPLOAD] Auth passed, processing with multer...");
    activityUpload.single('image')(req, res, (err) => {
      if (err) {
        console.error("[IMAGE UPLOAD] Multer error:", err);
        return res.status(500).json({ error: "File upload error: " + err.message });
      }
      console.log("[IMAGE UPLOAD] Multer processing completed successfully");
      next();
    });
  }, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      console.log(`[IMAGE UPLOAD] Starting upload for activity ${activityId}`);
      console.log(`[IMAGE UPLOAD] Session data:`, req.session);
      
      if (!req.file) {
        console.log("[IMAGE UPLOAD] No file received in request");
        return res.status(400).json({ error: "No image file provided" });
      }

      console.log(`[IMAGE UPLOAD] File received: ${req.file.originalname}, size: ${req.file.size} bytes, type: ${req.file.mimetype}`);

      // Upload to Object Storage for PERSISTENCE (like galería)
      const objectStorageService = new ObjectStorageService();
      const uploadUrl = await objectStorageService.getPublicObjectUploadURL();
      
      // Upload to Object Storage
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: req.file.buffer, // Use buffer from memory storage
        headers: {
          'Content-Type': req.file.mimetype,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload to Object Storage failed: ${response.status}`);
      }
      
      // Parse upload URL to get persistent URL (like galería)
      const urlParts = new URL(uploadUrl);
      const objectPath = urlParts.pathname;
      const [, , ...rest] = objectPath.split("/");
      const objectName = rest.join("/");
      // Remove duplicate "public/" if present
      const cleanObjectName = objectName.startsWith("public/") ? objectName.substring(7) : objectName;
      const imageUrl = `/public-objects/${cleanObjectName}`;
      
      console.log(`[IMAGE UPLOAD] ✅ Actividad subida a Object Storage: ${imageUrl}`);

      const activity = await storage.getActivity(activityId);
      if (!activity) {
        console.log(`[IMAGE UPLOAD] Activity ${activityId} not found`);
        return res.status(404).json({ error: "Activity not found" });
      }
      
      // Manejar tanto JSON como string simple
      let currentImages: string[] = [];
      if (activity.images) {
        try {
          if (activity.images.startsWith('[')) {
            currentImages = JSON.parse(activity.images);
          } else {
            currentImages = [activity.images];
          }
        } catch (error) {
          console.error("[IMAGE UPLOAD] Error parsing images:", error);
          currentImages = [];
        }
      }
      
      console.log(`[IMAGE UPLOAD] Current images: ${JSON.stringify(currentImages)}`);
      
      currentImages.push(imageUrl);
      console.log(`[IMAGE UPLOAD] Updated images: ${JSON.stringify(currentImages)}`);

      const updatedActivity = await storage.updateActivity(activityId, {
        images: JSON.stringify(currentImages)
      });

      console.log(`[IMAGE UPLOAD] Activity updated successfully with new image: ${imageUrl}`);
      // Sincronizar script de migración después de subir imagen
      await afterActivityChange();
      
      res.json({ 
        message: "Image uploaded successfully", 
        imageUrl,
        activity: updatedActivity
      });
    } catch (error) {
      console.error("[IMAGE UPLOAD] Error uploading activity image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Delete activity image
  app.delete("/api/admin/activities/:id/images", requireAdminAuth, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      const activity = await storage.getActivity(activityId);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      // Manejar tanto JSON como string simple
      let currentImages: string[] = [];
      if (activity.images) {
        try {
          if (activity.images.startsWith('[')) {
            currentImages = JSON.parse(activity.images);
          } else {
            currentImages = [activity.images];
          }
        } catch (error) {
          console.error("Error parsing images for deletion:", error);
          currentImages = [];
        }
      }
      
      const filteredImages = currentImages.filter((url: string) => url !== imageUrl);

      const updatedActivity = await storage.updateActivity(activityId, {
        images: JSON.stringify(filteredImages)
      });

      // Delete the actual file from the correct location
      try {
        if (imageUrl.startsWith('/assets/activities/')) {
          // New persistent storage location
          const filename = imageUrl.split('/').pop();
          if (filename) {
            const filePath = path.join(process.cwd(), 'public', 'assets', 'activities', filename);
            await fs.promises.unlink(filePath);
          }
        } else if (imageUrl.startsWith('public/assets/activities/')) {
          // Full path format
          const filePath = path.join(process.cwd(), imageUrl);
          await fs.promises.unlink(filePath);
        } else {
          // Legacy uploads location
          const filename = imageUrl.split('/').pop();
          if (filename) {
            const filePath = path.join(process.cwd(), 'uploads', filename);
            await fs.promises.unlink(filePath);
          }
        }
      } catch (fileError) {
        console.error("Error deleting file:", fileError);
        // Continue execution even if file deletion fails
      }

      // Sincronizar script de migración después de eliminar imagen
      await afterActivityChange();
      
      res.json({ 
        message: "Image deleted successfully", 
        activity: updatedActivity
      });
    } catch (error) {
      console.error("Error deleting activity image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // Hero banner routes
  app.get("/api/admin/hero-banners", requireAdminAuth, async (req, res) => {
    try {
      const banners = await storage.getAllHeroBanners();
      res.json(banners);
    } catch (error) {
      console.error("Error getting hero banners:", error);
      res.status(500).json({ error: "Failed to get hero banners" });
    }
  });

  app.get("/api/hero-banners", async (req, res) => {
    try {
      const banners = await storage.getActiveHeroBanners();
      res.json(banners);
    } catch (error) {
      console.error("Error getting active hero banners:", error);
      res.status(500).json({ error: "Failed to get active hero banners" });
    }
  });

  app.post("/api/admin/hero-banners", requireAdminAuth, bannerUpload.single('image'), async (req, res) => {
    try {
      console.log("[BANNER CREATE] Body:", req.body);
      console.log("[BANNER CREATE] File:", req.file);
      
      let imageUrl = req.body.imageUrl || "";
      
      // Si hay archivo subido, usar Object Storage (PERSISTENT)
      if (req.file) {
        const objectStorageService = new ObjectStorageService();
        const uploadUrl = await objectStorageService.getPublicObjectUploadURL();
        
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: req.file.buffer,
          headers: {
            'Content-Type': req.file.mimetype,
          },
        });

        if (!response.ok) {
          throw new Error(`Upload to Object Storage failed: ${response.status}`);
        }
        
        const urlParts = new URL(uploadUrl);
        const objectPath = urlParts.pathname;
        const [, , ...rest] = objectPath.split("/");
        const objectName = rest.join("/");
        // Remove duplicate "public/" if present
        const cleanObjectName = objectName.startsWith("public/") ? objectName.substring(7) : objectName;
        imageUrl = `/public-objects/${cleanObjectName}`;
        
        console.log("[BANNER CREATE] ✅ Banner subido a Object Storage:", imageUrl);
      }
      
      const bannerData = {
        title: req.body.title,
        description: req.body.description,
        imageUrl,
        buttonText: req.body.buttonText,
        buttonUrl: req.body.buttonUrl,
        displayOrder: parseInt(req.body.displayOrder) || 0,
        isActive: req.body.isActive === 'true' || req.body.isActive === true
      };
      
      console.log("[BANNER CREATE] Creating banner with data:", bannerData);
      
      const banner = await storage.createHeroBanner(bannerData);
      res.status(201).json(banner);
    } catch (error) {
      console.error("Error creating hero banner:", error);
      res.status(500).json({ error: "Failed to create hero banner" });
    }
  });

  app.patch("/api/admin/hero-banners/:id", requireAdminAuth, bannerUpload.single('image'), async (req, res) => {
    try {
      const bannerId = parseInt(req.params.id);
      console.log("[BANNER UPDATE] Body:", req.body);
      console.log("[BANNER UPDATE] File:", req.file);
      
      let updates = { ...req.body };
      
      // Si hay archivo subido, usar Object Storage (PERSISTENT)
      if (req.file) {
        const objectStorageService = new ObjectStorageService();
        const uploadUrl = await objectStorageService.getPublicObjectUploadURL();
        
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: req.file.buffer,
          headers: {
            'Content-Type': req.file.mimetype,
          },
        });

        if (!response.ok) {
          throw new Error(`Upload to Object Storage failed: ${response.status}`);
        }
        
        const urlParts = new URL(uploadUrl);
        const objectPath = urlParts.pathname;
        const [, , ...rest] = objectPath.split("/");
        const objectName = rest.join("/");
        // Remove duplicate "public/" if present
        const cleanObjectName = objectName.startsWith("public/") ? objectName.substring(7) : objectName;
        updates.imageUrl = `/public-objects/${cleanObjectName}`;
        
        console.log("[BANNER UPDATE] ✅ Banner subido a Object Storage:", updates.imageUrl);
      }
      
      // Convertir strings a tipos correctos
      if (updates.displayOrder) {
        updates.displayOrder = parseInt(updates.displayOrder);
      }
      if (updates.isActive !== undefined) {
        updates.isActive = updates.isActive === 'true' || updates.isActive === true;
      }
      
      console.log("[BANNER UPDATE] Final updates:", updates);
      
      const updatedBanner = await storage.updateHeroBanner(bannerId, updates);
      
      if (!updatedBanner) {
        return res.status(404).json({ error: "Hero banner not found" });
      }
      
      res.json(updatedBanner);
    } catch (error) {
      console.error("Error updating hero banner:", error);
      res.status(500).json({ error: "Failed to update hero banner" });
    }
  });

  app.delete("/api/admin/hero-banners/:id", requireAdminAuth, async (req, res) => {
    try {
      const bannerId = parseInt(req.params.id);
      const deleted = await storage.deleteHeroBanner(bannerId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Hero banner not found" });
      }
      
      res.json({ message: "Hero banner deleted successfully" });
    } catch (error) {
      console.error("Error deleting hero banner:", error);
      res.status(500).json({ error: "Failed to delete hero banner" });
    }
  });

  // Upload banner image
  app.post("/api/admin/hero-banners/:id/image", requireAdminAuth, bannerUpload.single('image'), async (req, res) => {
    try {
      const bannerId = parseInt(req.params.id);
      
      console.log(`[BANNER UPLOAD SERVER] Iniciando subida para banner ${bannerId}`);
      console.log(`[BANNER UPLOAD SERVER] Archivo recibido:`, req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : 'No file received');
      
      if (!req.file) {
        console.error(`[BANNER UPLOAD SERVER] Error: No se recibió archivo`);
        return res.status(400).json({ error: "No image file provided" });
      }

      const banner = await storage.getHeroBanner(bannerId);
      if (!banner) {
        console.error(`[BANNER UPLOAD SERVER] Error: Banner ${bannerId} no encontrado`);
        return res.status(404).json({ error: "Hero banner not found" });
      }

      // Upload to Object Storage for PERSISTENCE
      const objectStorageService = new ObjectStorageService();
      const uploadUrl = await objectStorageService.getPublicObjectUploadURL();
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: req.file.buffer,
        headers: {
          'Content-Type': req.file.mimetype,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload to Object Storage failed: ${response.status}`);
      }
      
      const urlParts = new URL(uploadUrl);
      const objectPath = urlParts.pathname;
      const [, , ...rest] = objectPath.split("/");
      const objectName = rest.join("/");
      // Remove duplicate "public/" if present
      const cleanObjectName = objectName.startsWith("public/") ? objectName.substring(7) : objectName;
      const imageUrl = `/public-objects/${cleanObjectName}`;
      
      console.log(`[BANNER UPLOAD SERVER] ✅ Banner subido a Object Storage: ${imageUrl}`);
      
      const updatedBanner = await storage.updateHeroBanner(bannerId, { imageUrl });
      console.log(`[BANNER UPLOAD SERVER] Banner actualizado exitosamente:`, updatedBanner);

      res.json({ 
        message: "Image uploaded successfully", 
        imageUrl,
        banner: updatedBanner
      });
    } catch (error) {
      console.error("[BANNER UPLOAD SERVER] Error uploading banner image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // TEST ENDPOINT FOR EMAIL SYSTEM
  app.post("/api/test-email", async (req, res) => {
    try {
      const { sendReservationConfirmationToGuest } = await import('./email');
      
      // Create a test reservation
      const testReservation = {
        id: 999,
        cabinId: 1,
        guestName: "Test Usuario",
        guestEmail: "test@example.com",
        checkIn: "2025-01-15",
        checkOut: "2025-01-17",
        guests: 2,
        totalPrice: 400000,
        includesAsado: false,
        status: "pending" as const,
        specialRequests: "Prueba de correo",
        googleCalendarEventId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        reservationCode: "TEST123",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        paymentInstructions: "Instrucciones de pago de prueba"
      };

      // Create test cabin
      const testCabin = {
        id: 1,
        name: "Bahía Santamaría 1",
        description: "Cabaña romántica para parejas",
        maxGuests: 2,
        priceWeekday: 200000,
        priceWeekend: 390000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await sendReservationConfirmationToGuest(testReservation, testCabin);
      
      if (result) {
        res.json({ success: true, message: "Correo de prueba enviado exitosamente" });
      } else {
        res.status(500).json({ success: false, message: "Error al enviar correo de prueba" });
      }
    } catch (error) {
      console.error("Error in test email endpoint:", error);
      res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for dashboard statistics
function getMonthlyReservationData(reservations: any[]) {
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(0, i).toLocaleString('es', { month: 'short' }),
    total: 0,
    aprobadas: 0,
    canceladas: 0
  }));

  reservations.forEach(reservation => {
    if (reservation.createdAt) {
      const month = new Date(reservation.createdAt).getMonth();
      monthlyData[month].total++;
      
      if (reservation.status === 'confirmed') {
        monthlyData[month].aprobadas++;
      } else if (reservation.status === 'cancelled' || reservation.status === 'expired') {
        monthlyData[month].canceladas++;
      }
    }
  });

  return monthlyData;
}

function getMonthlyRevenueData(reservations: any[]) {
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(0, i).toLocaleString('es', { month: 'short' }),
    revenue: 0
  }));

  reservations
    .filter(r => r.status === 'confirmed')
    .forEach(reservation => {
      if (reservation.createdAt) {
        const month = new Date(reservation.createdAt).getMonth();
        monthlyData[month].revenue += reservation.totalPrice;
      }
    });

  return monthlyData;
}

function getMonthlyOccupancyRate(reservations: any[]) {
  const currentYear = new Date().getFullYear();
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(0, i).toLocaleString('es', { month: 'short' }),
    occupancyRate: 0,
    bookedDays: 0,
    totalDays: new Date(currentYear, i + 1, 0).getDate()
  }));

  reservations
    .filter(r => r.status === 'confirmed')
    .forEach(reservation => {
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      
      if (checkIn.getFullYear() === currentYear || checkOut.getFullYear() === currentYear) {
        let currentDate = new Date(checkIn);
        
        while (currentDate < checkOut) {
          if (currentDate.getFullYear() === currentYear) {
            const month = currentDate.getMonth();
            monthlyData[month].bookedDays++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

  return monthlyData.map(data => ({
    month: data.month,
    occupancyRate: data.totalDays > 0 ? Math.round((data.bookedDays / data.totalDays) * 100) : 0,
    bookedDays: data.bookedDays,
    totalDays: data.totalDays
  }));
}
