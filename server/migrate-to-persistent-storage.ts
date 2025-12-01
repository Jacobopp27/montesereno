import { storage } from './storage.js';
import fs from 'fs';
import path from 'path';
import { ObjectStorageService } from './objectStorage.js';

// Helper function to check if a file belongs to this project
function isProjectAsset(filename: string, sourceDir: string): boolean {
  // Filtros basados en prefijos y directorios para Montesereno (no substring rígido)
  if (sourceDir === 'attached_assets') {
    return filename.startsWith('gallery-') || filename.includes('montesereno');
  }
  if (sourceDir === 'uploads') {
    return filename.startsWith('activity-') || filename.startsWith('banner-') || filename.includes('montesereno');
  }
  
  // Excluir explícitamente archivos problemáticos de otros proyectos
  const excludePatterns = [
    'ChatGPT_Image', 'Gemini_Generated_Image', 'claude-', 'openai-', 
    'temp-', 'test-', 'demo-', 'sample-'
  ];
  
  if (excludePatterns.some(pattern => filename.includes(pattern))) {
    console.log(`❌ EXCLUIDO archivo de otro proyecto: ${filename}`);
    return false;
  }
  
  return true;
}

// Helper function to check if file is an image
function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

// Helper function to upload to Object Storage (persistent like banners)
async function uploadToObjectStorage(filePath: string, originalFileName: string): Promise<string> {
  try {
    const objectStorageService = new ObjectStorageService();
    
    // Get upload URL from Object Storage
    const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload to Object Storage
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': getContentType(originalFileName),
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload: ${response.statusText}`);
    }
    
    // Parse the upload URL to get the object path
    const urlParts = new URL(uploadUrl);
    const objectPath = urlParts.pathname; // "/<bucket>/.private/uploads/<uuid>"
    
    // Strip the leading bucket segment to get the object name
    const [, , ...rest] = objectPath.split("/");
    const objectName = rest.join("/"); // ".private/uploads/<uuid>"
    
    // Convert to our public object URL format (PERSISTENT like banners)
    const publicUrl = `/public-objects/${objectName}`;
    console.log(`✅ Uploaded ${originalFileName} -> ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error(`❌ Error uploading ${originalFileName}:`, error);
    throw error;
  }
}

// Helper function to get content type
function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

interface MigrationResult {
  migratedFiles: number;
  updatedUrls: number;
  orphansRecovered: number;
  brokenReferencesFixed: number;
  errors: string[];
  details: {
    migratedFiles: string[];
    updatedUrls: { old: string; new: string; type: string; id: number }[];
    orphansRecovered: { file: string; assignedTo: string; type: string; id: number }[];
    brokenReferencesFixed: { type: string; id: number; brokenUrl: string }[];
  };
}

export async function migrateImagesToPersistentStorage(): Promise<MigrationResult> {
  console.log('🚀 INICIANDO MIGRACIÓN COMPLETA A ALMACENAMIENTO PERSISTENTE...\n');
  
  const result: MigrationResult = {
    migratedFiles: 0,
    updatedUrls: 0,
    orphansRecovered: 0,
    brokenReferencesFixed: 0,
    errors: [],
    details: {
      migratedFiles: [],
      updatedUrls: [],
      orphansRecovered: [],
      brokenReferencesFixed: []
    }
  };

  try {
    console.log('🔗 Usando Object Storage persistente (como banners) para permanencia real...');

    // 2. Migrar imágenes de galería
    console.log('\n🖼️  MIGRANDO IMÁGENES DE GALERÍA...');
    await migrateGalleryImages(result);

    // 3. Migrar imágenes de actividades
    console.log('\n🏃 MIGRANDO IMÁGENES DE ACTIVIDADES...');
    await migrateActivityImages(result);

    // 4. Migrar imágenes de banners
    console.log('\n🎨 MIGRANDO IMÁGENES DE BANNERS...');
    await migrateBannerImages(result);

    // 5. Recuperar imágenes huérfanas
    console.log('\n🔍 RECUPERANDO IMÁGENES HUÉRFANAS...');
    await recoverOrphanImages(result);

    // 6. Limpiar referencias rotas
    console.log('\n🧹 LIMPIANDO REFERENCIAS ROTAS...');
    await cleanBrokenReferences(result);

    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Archivos migrados: ${result.migratedFiles}`);
    console.log(`🔄 URLs actualizadas: ${result.updatedUrls}`);
    console.log(`🔍 Huérfanos recuperados: ${result.orphansRecovered}`);
    console.log(`🧹 Referencias rotas reparadas: ${result.brokenReferencesFixed}`);
    console.log(`❌ Errores: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ ERRORES ENCONTRADOS:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

    return result;

  } catch (error) {
    console.error('❌ Error crítico durante la migración:', error);
    result.errors.push(`Error crítico: ${(error as Error).message}`);
    throw error;
  }
}

async function migrateGalleryImages(result: MigrationResult) {
  try {
    const galleryImages = await storage.getAllGalleryImages();
    console.log(`📋 Encontradas ${galleryImages.length} imágenes de galería`);

    for (const image of galleryImages) {
      try {
        // Skip si ya está migrada a Object Storage (PERSISTENTE)
        if (image.imageUrl.startsWith('/public-objects/')) {
          console.log(`✅ Ya en Object Storage persistente: ${image.title}`);
          continue;
        }

        // Skip si es URL externa
        if (image.imageUrl.startsWith('http')) {
          console.log(`🌐 URL externa (no migrar): ${image.title}`);
          continue;
        }

        let sourcePath = '';
        if (image.imageUrl.startsWith('/attached_assets/')) {
          sourcePath = image.imageUrl.replace('/attached_assets/', 'attached_assets/');
        } else if (image.imageUrl.startsWith('/uploads/')) {
          sourcePath = image.imageUrl.replace('/uploads/', 'uploads/');
        } else {
          console.log(`⚠️  URL no reconocida para galería: ${image.imageUrl}`);
          continue;
        }

        const filename = path.basename(sourcePath);
        
        // FILTRO ESTRICTO: Solo archivos del proyecto Montesereno
        if (!isProjectAsset(filename, path.dirname(sourcePath))) {
          console.log(`⏭️ OMITIENDO archivo de otro proyecto: ${filename} (galería ${image.id})`);
          result.details.migratedFiles.push(`OMITIDO: ${filename} (otro proyecto)`);
          continue;
        }

        if (!fs.existsSync(sourcePath)) {
          console.log(`❌ Archivo no encontrado: ${sourcePath}`);
          result.details.brokenReferencesFixed.push({
            type: 'gallery',
            id: image.id,
            brokenUrl: image.imageUrl
          });
          continue;
        }

        // SUBIR A OBJECT STORAGE (PERSISTENTE como banners)
        console.log(`🔗 Subiendo ${filename} a Object Storage persistente...`);
        const newUrl = await uploadToObjectStorage(sourcePath, filename);

        // Actualizar BD con URL persistente
        await storage.updateGalleryImage(image.id, { imageUrl: newUrl });
        console.log(`🔄 URL actualizada: ${image.imageUrl} → ${newUrl} (PERSISTENTE)`);

        result.migratedFiles++;
        result.updatedUrls++;
        result.details.migratedFiles.push(`${filename} → ${newUrl}`);
        result.details.updatedUrls.push({
          old: image.imageUrl,
          new: newUrl,
          type: 'gallery',
          id: image.id
        });

      } catch (error) {
        const errorMsg = `Error migrando imagen de galería ${image.id}: ${(error as Error).message}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }
  } catch (error) {
    result.errors.push(`Error en migración de galería: ${(error as Error).message}`);
  }
}

async function migrateActivityImages(result: MigrationResult) {
  try {
    const activities = await storage.getAllActivities();
    console.log(`📋 Encontradas ${activities.length} actividades`);

    for (const activity of activities) {
      try {
        if (!activity.images) continue;

        let imageUrls: string[] = [];
        try {
          imageUrls = activity.images.startsWith('[') ? JSON.parse(activity.images) : [activity.images];
        } catch {
          imageUrls = [activity.images];
        }

        let hasChanges = false;
        const updatedUrls: string[] = [];

        for (const imageUrl of imageUrls) {
          // Skip si ya está en Object Storage (PERSISTENTE)
          if (imageUrl.startsWith('/public-objects/')) {
            updatedUrls.push(imageUrl);
            continue;
          }

          let sourcePath = '';
          if (imageUrl.startsWith('/uploads/')) {
            sourcePath = imageUrl.replace('/uploads/', 'uploads/');
          } else if (imageUrl.startsWith('/assets/activities/')) {
            sourcePath = imageUrl.replace('/assets/activities/', 'public/assets/activities/');
          } else {
            console.log(`⚠️ URL de actividad no reconocida: ${imageUrl}`);
            updatedUrls.push(imageUrl);
            continue;
          }

          const filename = path.basename(sourcePath);
          
          // FILTRO: Solo archivos del proyecto Montesereno
          if (!isProjectAsset(filename, path.dirname(sourcePath))) {
            console.log(`⏭️ OMITIENDO archivo de otro proyecto: ${filename} (actividad ${activity.id})`);
            updatedUrls.push(imageUrl); // Mantener URL original
            continue;
          }

          if (!fs.existsSync(sourcePath)) {
            console.log(`❌ Archivo de actividad no encontrado: ${sourcePath}`);
            updatedUrls.push(imageUrl); // Mantener URL original
            continue;
          }

          // SUBIR A OBJECT STORAGE (PERSISTENTE como banners)
          console.log(`🔗 Subiendo actividad ${filename} a Object Storage persistente...`);
          const newUrl = await uploadToObjectStorage(sourcePath, filename);

          updatedUrls.push(newUrl);
          hasChanges = true;
          result.migratedFiles++;

          result.details.migratedFiles.push(`${filename} → ${newUrl}`);
          result.details.updatedUrls.push({
            old: imageUrl,
            new: newUrl,
            type: 'activity',
            id: activity.id
          });

          console.log(`✅ Actividad ${activity.id}: ${sourcePath} → ${newUrl} (PERSISTENTE)`);
        }

        if (hasChanges) {
          await storage.updateActivity(activity.id, { images: JSON.stringify(updatedUrls) });
          result.updatedUrls++;
          console.log(`🔄 URLs de actividad ${activity.id} actualizadas`);
        }

      } catch (error) {
        const errorMsg = `Error migrando imágenes de actividad ${activity.id}: ${(error as Error).message}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }
  } catch (error) {
    result.errors.push(`Error en migración de actividades: ${(error as Error).message}`);
  }
}

async function migrateBannerImages(result: MigrationResult) {
  try {
    const banners = await storage.getAllHeroBanners();
    console.log(`📋 Encontrados ${banners.length} banners`);

    for (const banner of banners) {
      try {
        // Skip si ya está en Object Storage (PERSISTENTE)
        if (banner.imageUrl.startsWith('/public-objects/')) {
          console.log(`✅ Banner ya en Object Storage persistente: ${banner.title}`);
          continue;
        }

        let sourcePath = '';
        if (banner.imageUrl.startsWith('/uploads/')) {
          sourcePath = banner.imageUrl.replace('/uploads/', 'uploads/');
        } else if (banner.imageUrl.startsWith('/assets/banners/')) {
          sourcePath = banner.imageUrl.replace('/assets/banners/', 'public/assets/banners/');
        } else {
          console.log(`⚠️  URL de banner no reconocida: ${banner.imageUrl}`);
          continue;
        }

        const filename = path.basename(sourcePath);
        
        // FILTRO: Solo archivos del proyecto Montesereno
        if (!isProjectAsset(filename, path.dirname(sourcePath))) {
          console.log(`⏭️ OMITIENDO archivo de otro proyecto: ${filename} (banner ${banner.id})`);
          continue;
        }

        if (!fs.existsSync(sourcePath)) {
          console.log(`❌ Archivo de banner no encontrado: ${sourcePath}`);
          result.details.brokenReferencesFixed.push({
            type: 'banner',
            id: banner.id,
            brokenUrl: banner.imageUrl
          });
          continue;
        }

        // SUBIR A OBJECT STORAGE (PERSISTENTE como galería)
        console.log(`🔗 Subiendo banner ${filename} a Object Storage persistente...`);
        const newUrl = await uploadToObjectStorage(sourcePath, filename);

        // Actualizar BD con URL persistente
        await storage.updateHeroBanner(banner.id, { imageUrl: newUrl });
        console.log(`🔄 URL de banner actualizada: ${banner.imageUrl} → ${newUrl} (PERSISTENTE)`);

        result.migratedFiles++;
        result.updatedUrls++;
        result.details.migratedFiles.push(`${filename} → ${newUrl}`);
        result.details.updatedUrls.push({
          old: banner.imageUrl,
          new: newUrl,
          type: 'banner',
          id: banner.id
        });

      } catch (error) {
        const errorMsg = `Error migrando banner ${banner.id}: ${(error as Error).message}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }
  } catch (error) {
    result.errors.push(`Error en migración de banners: ${(error as Error).message}`);
  }
}

async function recoverOrphanImages(result: MigrationResult) {
  try {
    const sourceDirectories = ['uploads', 'attached_assets'];
    
    for (const sourceDir of sourceDirectories) {
      if (!fs.existsSync(sourceDir)) continue;

      const files = fs.readdirSync(sourceDir);
      console.log(`🔍 Revisando ${files.length} archivos en ${sourceDir}`);

      for (const file of files) {
        try {
          const filePath = path.join(sourceDir, file);
          const stats = fs.statSync(filePath);
          
          if (!stats.isFile() || !isImageFile(file)) continue;
          
          // Only process project-specific images
          if (!isProjectAsset(file, sourceDir)) {
            console.log(`⏭️ Omitiendo archivo no-proyecto: ${file}`);
            continue;
          }

          // Verificar si ya está referenciado en BD
          const isReferenced = await isFileReferenced(file, sourceDir);
          if (isReferenced) continue;

          console.log(`🔍 Imagen huérfana encontrada: ${file}`);
          
          // Intentar asignar a registro sin imagen
          const assigned = await assignOrphanToRecord(file, filePath, result);
          if (assigned) {
            result.orphansRecovered++;
          }

        } catch (error) {
          console.error(`❌ Error procesando archivo huérfano ${file}: ${(error as Error).message}`);
        }
      }
    }
  } catch (error) {
    result.errors.push(`Error en recuperación de huérfanos: ${(error as Error).message}`);
  }
}

async function cleanBrokenReferences(result: MigrationResult) {
  try {
    // Limpiar referencias rotas en galería
    const galleryImages = await storage.getAllGalleryImages();
    for (const image of galleryImages) {
      if (!await verifyImageExists(image.imageUrl)) {
        console.log(`🧹 Referencia rota en galería: ${image.imageUrl}`);
        result.details.brokenReferencesFixed.push({
          type: 'gallery',
          id: image.id,
          brokenUrl: image.imageUrl
        });
        result.brokenReferencesFixed++;
        
        // Opcionalmente marcar como inactiva en lugar de eliminar
        await storage.updateGalleryImage(image.id, { isActive: false });
      }
    }

    // Limpiar referencias rotas en actividades
    const activities = await storage.getAllActivities();
    for (const activity of activities) {
      if (!activity.images) continue;
      
      let imageUrls: string[] = [];
      try {
        imageUrls = activity.images.startsWith('[') ? JSON.parse(activity.images) : [activity.images];
      } catch {
        continue;
      }

      const validUrls = [];
      let hasChanges = false;

      for (const url of imageUrls) {
        if (await verifyImageExists(url)) {
          validUrls.push(url);
        } else {
          console.log(`🧹 Referencia rota en actividad ${activity.id}: ${url}`);
          result.details.brokenReferencesFixed.push({
            type: 'activity',
            id: activity.id,
            brokenUrl: url
          });
          result.brokenReferencesFixed++;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await storage.updateActivity(activity.id, { images: JSON.stringify(validUrls) });
      }
    }

  } catch (error) {
    result.errors.push(`Error limpiando referencias rotas: ${(error as Error).message}`);
  }
}

// Funciones auxiliares

async function isFileReferenced(filename: string, sourceDir: string): Promise<boolean> {
  try {
    // Verificar en galería
    const galleryImages = await storage.getAllGalleryImages();
    for (const image of galleryImages) {
      if (image.imageUrl.includes(filename)) return true;
    }

    // Verificar en actividades
    const activities = await storage.getAllActivities();
    for (const activity of activities) {
      if (activity.images && activity.images.includes(filename)) return true;
    }

    // Verificar en banners
    const banners = await storage.getAllHeroBanners();
    for (const banner of banners) {
      if (banner.imageUrl.includes(filename)) return true;
    }

    return false;
  } catch {
    return false;
  }
}

async function assignOrphanToRecord(filename: string, filePath: string, result: MigrationResult): Promise<boolean> {
  try {
    // Only assign project-specific files
    const sourceDir = path.dirname(filePath);
    const dirName = path.basename(sourceDir);
    
    if (!isProjectAsset(filename, dirName)) {
      console.log(`⏭️ Omitiendo archivo no-proyecto: ${filename}`);
      return false;
    }
    
    const fileStats = fs.statSync(filePath);
    
    // Intentar asignar a galería sin imagen
    const galleryImages = await storage.getAllGalleryImages();
    for (const image of galleryImages) {
      if (!image.imageUrl || image.imageUrl === '' || !await verifyImageExists(image.imageUrl)) {
        // Copiar archivo a destino correcto
        const destPath = path.join('public/assets/gallery', filename);
        const newUrl = `/assets/gallery/${filename}`;
        
        fs.copyFileSync(filePath, destPath);
        await storage.updateGalleryImage(image.id, { imageUrl: newUrl });
        
        console.log(`🔗 Huérfano asignado a galería ${image.id}: ${filename}`);
        result.details.orphansRecovered.push({
          file: filename,
          assignedTo: `galería "${image.title}"`,
          type: 'gallery',
          id: image.id
        });
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

async function verifyImageExists(imageUrl: string): Promise<boolean> {
  try {
    if (imageUrl.startsWith('http')) {
      // Para URLs externas, asumir que existen
      return true;
    }
    
    if (imageUrl.startsWith('/public-objects/')) {
      // Para App Storage, asumir que existen
      return true;
    }

    let localPath = '';
    if (imageUrl.startsWith('/assets/')) {
      localPath = `public${imageUrl}`;
    } else if (imageUrl.startsWith('/uploads/')) {
      localPath = imageUrl.replace('/uploads/', 'uploads/');
    } else if (imageUrl.startsWith('/attached_assets/')) {
      localPath = imageUrl.replace('/attached_assets/', 'attached_assets/');
    } else {
      return false;
    }

    return fs.existsSync(localPath);
  } catch {
    return false;
  }
}