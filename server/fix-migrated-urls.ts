import { storage } from './storage.js';

async function fixMigratedUrls(): Promise<void> {
  console.log('🔧 CORRIGIENDO URLs MIGRADAS...\n');
  
  try {
    // Get all banners
    const banners = await storage.getAllHeroBanners();
    let fixed = 0;
    
    for (const banner of banners) {
      if (banner.imageUrl && banner.imageUrl.includes('/replit-objstore-')) {
        // Current URL: /public-objects/replit-objstore-<id>/.private/uploads/<uuid>
        // Target URL: /public-objects/.private/uploads/<uuid>
        
        const match = banner.imageUrl.match(/\/public-objects\/replit-objstore-[^\/]+\/(.+)/);
        if (match) {
          const objectName = match[1]; // ".private/uploads/<uuid>"
          const correctedUrl = `/public-objects/${objectName}`;
          
          await storage.updateHeroBanner(banner.id, { imageUrl: correctedUrl });
          console.log(`✅ Banner ${banner.id}: ${banner.imageUrl}`);
          console.log(`   → ${correctedUrl}`);
          fixed++;
        }
      }
    }
    
    console.log(`\n🎉 ¡${fixed} URLs corregidas exitosamente!`);
    
  } catch (error) {
    console.error('❌ Error corrigiendo URLs:', error);
    throw error;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixMigratedUrls().catch(console.error);
}