-- =====================================================
-- MIGRACIÓN COMPLETA: DESARROLLO → PRODUCCIÓN
-- Montesereno Glamping - Hotel Website
-- Fecha: September 2025
-- =====================================================

-- 🎯 OBJETIVO: Migrar TODA la información de desarrollo a producción
-- ✅ Base de datos + Imágenes persistentes para website público global

-- ⚠️  IMPORTANTE: Ejecutar este script EN LA BASE DE DATOS DE PRODUCCIÓN

-- 1. HERO BANNERS (✅ Ya en App Storage)
INSERT INTO hero_banners (id, title, description, image_url, button_text, button_url, is_active, display_order, created_at, updated_at) VALUES
(1, 'Bienvenido a Montesereno Glamping', 'Brisa fresca, tranquilidad y naturaleza. Tu refugio perfecto en la montaña', '/public-objects/uploads/7449acda-9bc8-4746-a39d-0a3041d45451', 'Reservar Ahora', '#reservar', true, 1, '2025-09-18 18:14:11.406', '2025-09-20 19:35:15.718'),
(2, 'Experiencia de Montaña Auténtica', 'Desconéctate de la rutina y conecta con la naturaleza en Montesereno Glamping', '/public-objects/uploads/9f799c2a-dec5-4f90-b9f5-e7395d05399d', 'Explorar Cabaña', '#overview', true, 2, '2025-09-18 18:14:11.406', '2025-09-20 19:35:15.807'),
(3, 'Tranquilidad en la Montaña', 'Una cabaña exclusiva rodeada de naturaleza para tu escape perfecto', '/public-objects/uploads/2196342f-6653-469b-94bb-ddf0887b8839', 'Ver Galería', '#gallery', true, 3, '2025-09-18 18:14:11.406', '2025-09-20 19:35:15.882');

-- 2. RESEÑAS DE HUÉSPEDES
INSERT INTO reviews (id, guest_name, rating, comment, is_approved, display_order, created_at) VALUES
(1, 'Sarah Johnson', 5, '¡Increíble experiencia en Montesereno Glamping! La vista a la montaña es espectacular y la atención al detalle es excepcional. Definitivamente volveremos para otra escapada romántica.', true, 1, '2025-09-18 18:14:11.17'),
(2, 'Carlos Mendoza', 5, 'Perfecto para una escapada familiar. Los niños disfrutaron mucho la naturaleza y nosotros la tranquilidad. La cabaña está muy bien equipada y el desayuno delicioso.', true, 2, '2025-09-18 18:14:11.17'),
(3, 'Ana Rodríguez', 4, 'Hermoso lugar en la montaña. La cabaña es cómoda y la ubicación inmejorable. Los sonidos de la naturaleza toda la noche fueron muy relajantes.', true, 3, '2025-09-18 18:14:11.17');

-- 3. ACTIVIDADES
INSERT INTO activities (id, name, description, short_description, price, duration, location, includes, images, is_active, icon_type, created_at, updated_at) VALUES
(1, 'Transporte Aeropuerto', '', 'Recogida y llevada al aeropuerto', 150000, '', '', '[]', '[""/assets/activities/activity-1758393444830-509605309.png""]', true, 'transport', '2025-09-20 18:22:38.364471', '2025-09-20 18:37:25.775');

-- 4. CONFIGURACIÓN INICIAL DE CABAÑAS
INSERT INTO cabins (id, name, description, capacity, price_base, price_per_person, amenities, images, is_active, created_at) VALUES
(1, 'Cabaña Principal', 'Cabaña exclusiva en la montaña con vista espectacular', 6, 200000, 50000, '["WiFi", "Parqueadero", "Jacuzzi", "Zona BBQ", "Áreas verdes"]', '[]', true, now());

-- 5. USUARIOS ADMIN (⚠️  CAMBIAR CONTRASEÑAS EN PRODUCCIÓN)
INSERT INTO admin_users (id, username, email, password_hash, role, is_active, created_at) VALUES
(1, 'admin', 'admin@montesereno.com', '$2b$10$ejemplo.hash.cambiar.en.produccion', 'admin', true, now());

-- 6. GALERÍA DE IMÁGENES (⚠️  SUBIR MANUALMENTE A PRODUCCIÓN)
-- Archivos a subir desde desarrollo:
-- 1. attached_assets/gallery-1758252092092-434086176.png → puerta
-- 2. attached_assets/gallery-1758252266466-576946484.png → puerta 1  
-- 3. attached_assets/gallery-1758252301510-101263511.png → cama
-- 4. attached_assets/gallery-1758252509896-840357824.png → jacuzzi
-- 5. attached_assets/gallery-1758252537618-548839600.png → jacuzzi 1
-- 6. attached_assets/gallery-1758252582671-577462647.png → cocina

-- DESPUÉS DE SUBIR LAS IMÁGENES, EJECUTAR:
-- INSERT INTO gallery_images (id, title, description, image_url, display_order, is_active, created_at) VALUES
-- (1, 'puerta', '', '/public-objects/uploads/[UUID-GENERADO]', 0, true, '2025-09-19 03:21:33.799252'),
-- (2, 'puerta 1', '', '/public-objects/uploads/[UUID-GENERADO]', 0, true, '2025-09-19 03:24:27.66752'),
-- (3, 'cama', '', '/public-objects/uploads/[UUID-GENERADO]', 0, true, '2025-09-19 03:25:02.13299'),
-- (4, 'jacuzzi', '', '/public-objects/uploads/[UUID-GENERADO]', 0, true, '2025-09-19 03:28:30.931214'),
-- (5, 'jacuzzi 1', '', '/public-objects/uploads/[UUID-GENERADO]', 0, true, '2025-09-19 03:28:58.893862'),
-- (6, 'cocina', '', '/public-objects/uploads/[UUID-GENERADO]', 0, true, '2025-09-19 03:29:43.286186');

