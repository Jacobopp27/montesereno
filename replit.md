# Montesereno Glamping - Reservation Platform

## Overview
Montesereno Glamping is a modern cabin reservation platform for a mountain glamping experience. The platform enables guests to check real-time availability and book the cabin with dynamic pricing. Its core purpose is to streamline the reservation process for a unique mountain nature experience, featuring one exclusive cabin that accommodates up to 6 guests, with breakfast included. The project aims to provide a seamless booking experience while reflecting the tranquil mountain theme.

## User Preferences
- **Language:** Spanish for all user-facing content
- **Currency:** Colombian Pesos (COP) with proper formatting
- **Design:** Mountain experience with elegant typography (Playfair Display/Inter/Coterie) and natural green (#4C622E) color scheme with earth tone palette and subtle background textures including paper, nature, and glass effects.
- **Logo:** User's tropical leaf logo (circular design with elegant palm leaf motif).
- **Photos:** Real mountain property photos instead of stock images.
- **Communication Style:** Formal tone in emails with enhanced authentication headers.
- **Interaction:** Automated email notifications for guests and property owners. Quick booking system in admin panel for instant, email-free reservations from social media inquiries.
- **Workflow:** Iterative development focusing on user experience, responsiveness, and consistent branding.
- **Project Name:** "MONTESERENO GLAMPING" with slogan "Reconecta con lo esencial".

## System Architecture
The platform is built with a React.js frontend using TypeScript, Tailwind CSS, and Shadcn/ui components, and a Node.js/Express backend also in TypeScript. PostgreSQL with Drizzle ORM is used for production persistence.

**Key Architectural Decisions:**
- **Modular Storage:** Utilizes an `IStorage` interface for flexible database migration.
- **Data Persistence:** Full data persistence across all features (restaurant carousel, gallery, reviews, activities, banners, reservations) achieved through PostgreSQL.
- **Responsive Design:** Core to both public-facing and administrative interfaces, ensuring optimal viewing across devices.
- **Dynamic Pricing & Availability:** Implemented real-time availability checks and dynamic price calculation based on cabin type, dates (weekdays/weekends/holidays), and guest count, including a per-person charge for the family cabin. Colombian holidays are integrated with Ley Emiliani compliance.
- **Authentication & Authorization:** Secure admin panel with dedicated credentials for managing reservations, content (gallery, reviews, restaurant menu), and system tools.
- **Email System:** Robust SendGrid integration for automated guest confirmations and owner notifications, optimized for deliverability across various email providers, including specific templates for Microsoft domains.
- **Enhanced Image Management:** 
  - **Persistent Storage System:** Activity images stored in `/public/assets/activities` directory for persistence across server restarts
  - **Automatic Migration Tool:** Admin panel includes one-click migration system to move legacy images to persistent storage
  - **Orphan Image Recovery:** Advanced algorithm to detect and recover "orphaned" images that exist physically but aren't associated with activities in the database
  - **Intelligent Cleanup:** Automatic detection and removal of broken image references from database
  - **Dual Directory Support:** Backward compatibility with legacy `/uploads` directory while transitioning to persistent storage
  - **Real-time Validation:** Server-side image existence checking during API calls to ensure data integrity
- **Booking Flow:** A streamlined client-side booking process involving date selection, cabin choice, guest details, and confirmation, with server-side validation.
- **UI/UX Decisions:**
    - Marine green (#7A946E) and darker natural green (#4C622E) combined with warm beige (#E9D6B0) and earth tones (terracotta, clay, ochre, umber) for a sophisticated mountain aesthetic.
    - Elegant typography using Playfair Display, Inter, and Coterie fonts for headings and body text.
    - Subtle background textures (paper, waves, glass effects) and elegant shadows for enhanced visual appeal.
    - Compact and mobile-friendly reservation success modal.
    - Visually distinct calendar markings for weekends and holidays.
    - Consistent branding with the tropical leaf logo integrated across the platform (navigation, favicon, PWA).

**Key Features:**
- One exclusive cabin with capacity for up to 6 guests.
- Admin panel for reservation management (view, approve, deny, cancel, delete), content management (gallery, reviews, restaurant menu), and system settings.
- Quick Booking System in admin for rapid reservation creation for social media inquiries.
- Automated email notifications for guests and owners with detailed booking information and payment instructions.
- 24-hour reservation freezing with automated expiration.
- Comprehensive guest-based pricing system.
- Restaurant section with PDF menu upload and management.
- Policies section for cancellation, date changes, pet policy, and music policy.

## External Dependencies
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Email Service:** SendGrid
- **Mapping:** Google Calendar API (optional, not currently active)
- **File Upload:** Multer (for local file handling)