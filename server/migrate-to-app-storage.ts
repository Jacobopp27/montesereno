import fs from 'fs';
import path from 'path';
import { ObjectStorageService } from './objectStorage.js';
import { storage } from './storage.js';

const objectStorageService = new ObjectStorageService();

interface MigrationResult {
  success: boolean;
  oldUrl: string;
  newUrl: string;
  error?: string;
}

async function uploadToAppStorage(filePath: string, originalFileName: string): Promise<string> {
  try {
    // Get upload URL from App Storage
    const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload to App Storage
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
    
    // Convert to our public object URL format (without bucket)
    const publicUrl = `/public-objects/${objectName}`;
    console.log(`✅ Uploaded ${originalFileName} -> ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error(`❌ Error uploading ${originalFileName}:`, error);
    throw error;
  }
}

function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

async function migrateBanners(): Promise<MigrationResult[]> {
  console.log('\n🚀 Migrando banners de /uploads/ a App Storage...');
  const results: MigrationResult[] = [];
  
  try {
    // Get all banners with /uploads/ URLs
    const banners = await storage.getAllHeroBanners();
    
    for (const banner of banners) {
      if (banner.imageUrl && banner.imageUrl.startsWith('/uploads/')) {
        try {
          const fileName = path.basename(banner.imageUrl);
          const localPath = path.join('uploads', fileName);
          
          // Check if file exists locally
          if (!fs.existsSync(localPath)) {
            console.log(`⚠️  File not found locally: ${localPath}`);
            results.push({
              success: false,
              oldUrl: banner.imageUrl,
              newUrl: '',
              error: 'File not found locally'
            });
            continue;
          }
          
          // Upload to App Storage
          const newUrl = await uploadToAppStorage(localPath, fileName);
          
          // Update database
          await storage.updateHeroBanner(banner.id, { imageUrl: newUrl });
          
          results.push({
            success: true,
            oldUrl: banner.imageUrl,
            newUrl: newUrl
          });
          
          console.log(`✅ Banner ${banner.id}: ${banner.imageUrl} -> ${newUrl}`);
          
        } catch (error) {
          console.error(`❌ Error migrating banner ${banner.id}:`, error);
          results.push({
            success: false,
            oldUrl: banner.imageUrl,
            newUrl: '',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in banner migration:', error);
  }
  
  return results;
}

async function migrateActivities(): Promise<MigrationResult[]> {
  console.log('\n🚀 Migrando actividades de /uploads/ a App Storage...');
  const results: MigrationResult[] = [];
  
  try {
    // Get all activities
    const activities = await storage.getAllActivities();
    
    for (const activity of activities) {
      if (activity.images && Array.isArray(activity.images)) {
        const newImages: string[] = [];
        let hasChanges = false;
        
        for (const imageUrl of activity.images) {
          if (typeof imageUrl === 'string' && imageUrl.startsWith('/uploads/')) {
            try {
              const fileName = path.basename(imageUrl);
              const localPath = path.join('uploads', fileName);
              
              // Check if file exists locally
              if (!fs.existsSync(localPath)) {
                console.log(`⚠️  File not found locally: ${localPath}`);
                newImages.push(imageUrl); // Keep original if file not found
                results.push({
                  success: false,
                  oldUrl: imageUrl,
                  newUrl: '',
                  error: 'File not found locally'
                });
                continue;
              }
              
              // Upload to App Storage
              const newUrl = await uploadToAppStorage(localPath, fileName);
              newImages.push(newUrl);
              hasChanges = true;
              
              results.push({
                success: true,
                oldUrl: imageUrl,
                newUrl: newUrl
              });
              
              console.log(`✅ Activity ${activity.id}: ${imageUrl} -> ${newUrl}`);
              
            } catch (error) {
              console.error(`❌ Error migrating activity image:`, error);
              newImages.push(imageUrl); // Keep original on error
              results.push({
                success: false,
                oldUrl: imageUrl,
                newUrl: '',
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          } else {
            newImages.push(imageUrl); // Keep non-/uploads/ URLs as-is
          }
        }
        
        // Update activity if there were changes
        if (hasChanges) {
          await storage.updateActivity(activity.id, { images: JSON.stringify(newImages) });
          console.log(`✅ Updated activity ${activity.id} with new image URLs`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in activity migration:', error);
  }
  
  return results;
}

export async function runMigration(): Promise<void> {
  console.log('🚀 INICIANDO MIGRACIÓN A APP STORAGE PERSISTENTE\n');
  
  try {
    // Migrate banners
    const bannerResults = await migrateBanners();
    
    // Migrate activities
    const activityResults = await migrateActivities();
    
    // Summary
    const allResults = [...bannerResults, ...activityResults];
    const successful = allResults.filter(r => r.success).length;
    const failed = allResults.filter(r => !r.success).length;
    
    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log(`✅ Exitosas: ${successful}`);
    console.log(`❌ Fallidas: ${failed}`);
    console.log(`📁 Total: ${allResults.length}`);
    
    if (failed > 0) {
      console.log('\n❌ Archivos fallidos:');
      allResults.filter(r => !r.success).forEach(r => {
        console.log(`   ${r.oldUrl}: ${r.error}`);
      });
    }
    
    console.log('\n🎉 ¡Migración completada!');
    
  } catch (error) {
    console.error('❌ Error crítico en migración:', error);
    throw error;
  }
}

// Execute migration if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().catch(console.error);
}