# 🚀 GUÍA COMPLETA DE MIGRACIÓN A PRODUCCIÓN
## Montesereno Glamping - Website Público Global

### 📋 RESUMEN
Migrar TODOS los datos de desarrollo a producción para que el website del hotel esté disponible públicamente con imágenes persistentes.

---

## 🎯 PASO A PASO DETALLADO

### **PASO 1: Preparar Imágenes de Galería**
Las imágenes de galería están en rutas locales que NO funcionarán en producción.

**📁 Archivos a migrar manualmente:**
```
attached_assets/gallery-1758252092092-434086176.png → "puerta"
attached_assets/gallery-1758252266466-576946484.png → "puerta 1"  
attached_assets/gallery-1758252301510-101263511.png → "cama"
attached_assets/gallery-1758252509896-840357824.png → "jacuzzi"
attached_assets/gallery-1758252537618-548839600.png → "jacuzzi 1"
attached_assets/gallery-1758252582671-577462647.png → "cocina"
```

**🔧 Acción requerida:**
1. Descargar estos 6 archivos desde desarrollo
2. Subirlos manualmente al App Storage de producción
3. Obtener las nuevas URLs `/public-objects/uploads/[UUID]`

### **PASO 2: Ejecutar Script SQL**
**📄 Archivo:** `server/production-migration.sql`

**🎯 Contiene:**
- ✅ **3 Hero Banners** (ya con URLs de App Storage)
- ✅ **3 Reseñas de huéspedes**
- ✅ **1 Actividad** (Transporte Aeropuerto)
- ✅ **Configuración de cabaña**
- ✅ **Usuario admin** (cambiar contraseña)
- ⚠️ **6 Imágenes de galería** (completar después del Paso 1)

### **PASO 3: Configurar Secuencias**
Después de insertar los datos:
```sql
SELECT setval('hero_banners_id_seq', (SELECT MAX(id) FROM hero_banners));
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));
SELECT setval('activities_id_seq', (SELECT MAX(id) FROM activities));
SELECT setval('gallery_images_id_seq', (SELECT MAX(id) FROM gallery_images));
SELECT setval('cabins_id_seq', (SELECT MAX(id) FROM cabins));
SELECT setval('admin_users_id_seq', (SELECT MAX(id) FROM admin_users));
```

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

### **Verificar que funcione:**
1. **Hero banners** se muestran correctamente
2. **Galería de imágenes** carga todas las fotos
3. **Reseñas** aparecen en la página
4. **Actividades** se muestran
5. **Panel admin** funciona con nuevas credenciales

### **URLs de prueba:**
- `https://[tu-dominio]/` → Página principal
- `https://[tu-dominio]/admin` → Panel administrador

---

## 🎯 RESULTADO ESPERADO
**Website público del hotel** completamente funcional con:
- ✅ **Imágenes persistentes** (no se pierden en reinicios)
- ✅ **Datos reales** de desarrollo migrados
- ✅ **Accesible globalmente** desde cualquier país
- ✅ **Base de datos de producción** poblada

---

## ⚠️ NOTAS IMPORTANTES

### **Seguridad:**
- Cambiar contraseña admin en producción
- Configurar variables de entorno necesarias
- Verificar que App Storage esté configurado

### **Imágenes:**
- **Banners:** ✅ Ya en App Storage (`/public-objects/uploads/...`)
- **Galería:** ⚠️ Requieren migración manual
- **Actividades:** ✅ Ya en persistente (`/assets/activities/...`)

---

## 🚨 SOPORTE
Si hay problemas durante la migración, verificar:
1. **Variables de entorno** de App Storage
2. **Permisos de base de datos** 
3. **Conexión a producción**