import { storage } from './storage.js';
import { ObjectStorageService } from './objectStorage.js';
import fs from 'fs';
import path from 'path';

export async function migrateGalleryToAppStorage(): Promise<{ success: number; errors: number; total: number }> {
  console.log('🖼️  INICIANDO MIGRACIÓN DE GALERÍA A APP STORAGE...\n');
  
  const objectStorageService = new ObjectStorageService();
  let migrated = 0;
  let errors = 0;

  try {
    // Get all gallery images
    const galleryImages = await storage.getAllGalleryImages();
    console.log(`📋 Encontradas ${galleryImages.length} imágenes de galería\n`);

    for (const image of galleryImages) {
      try {
        // Skip if already in App Storage
        if (image.imageUrl.startsWith('/public-objects/')) {
          console.log(`✅ Ya migrada: ${image.title} (${image.imageUrl})`);
          continue;
        }

        // Skip if external URL
        if (image.imageUrl.startsWith('http')) {
          console.log(`⏭️  URL externa: ${image.title} (${image.imageUrl})`);
          continue;
        }

        // Check for local file
        let localPath = '';
        if (image.imageUrl.startsWith('/attached_assets/')) {
          localPath = image.imageUrl.replace('/attached_assets/', 'attached_assets/');
        } else if (image.imageUrl.startsWith('/uploads/')) {
          localPath = image.imageUrl.replace('/uploads/', 'uploads/');
        } else {
          console.log(`⚠️  URL no reconocida: ${image.imageUrl}`);
          errors++;
          continue;
        }
        
        if (!fs.existsSync(localPath)) {
          console.log(`❌ Archivo no encontrado: ${localPath}`);
          errors++;
          continue;
        }

        console.log(`🔄 Migrando: "${image.title}"`);
        console.log(`   Desde: ${image.imageUrl}`);
        
        // Upload to App Storage
        const uuid = crypto.randomUUID();
        const extension = path.extname(localPath);
        const newFileName = `${uuid}${extension}`;
        
        // Read file and upload to App Storage
        const fileBuffer = fs.readFileSync(localPath);
        const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
        
        // Extract object path from upload URL  
        const urlParts = uploadUrl.split('/uploads/')[1].split('?')[0];
        const finalUrl = `/public-objects/uploads/${urlParts}`;
        
        // Upload file
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: fileBuffer,
          headers: {
            'Content-Type': 'image/' + extension.replace('.', ''),
          },
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        console.log(`   Hacia: ${finalUrl}`);

        // Update database with new URL
        await storage.updateGalleryImage(image.id, {
          imageUrl: finalUrl
        });

        console.log(`✅ Migrada exitosamente: "${image.title}"\n`);
        migrated++;

      } catch (error) {
        console.error(`❌ Error migrando "${image.title}":`, error);
        errors++;
      }
    }

    console.log(`\n📊 RESUMEN DE MIGRACIÓN DE GALERÍA:`);
    console.log(`✅ Migradas: ${migrated}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📁 Total: ${galleryImages.length}`);
    
    return { success: migrated, errors, total: galleryImages.length };

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}