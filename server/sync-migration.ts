import * as fs from 'fs';
import * as path from 'path';
import { storage } from './storage';

/**
 * Función para sincronizar automáticamente el archivo migrate-data.ts 
 * con las actividades actuales en la base de datos.
 * Se ejecuta cada vez que se crean, actualizan o eliminan actividades.
 */
export async function syncMigrationScript(): Promise<void> {
  try {
    console.log("[SYNC] Sincronizando script de migración con base de datos...");
    
    // Obtener todas las actividades actuales
    const activities = await storage.getAllActivities();
    
    // Leer el archivo actual de migración
    const migrationPath = path.join(__dirname, 'migrate-data.ts');
    let migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    
    // Generar el código de las actividades
    const activitiesCode = activities.map(activity => {
      const imagesValue = activity.images ? activity.images : '[]';
      
      return `    {
      id: ${activity.id},
      name: ${JSON.stringify(activity.name)},
      description: ${JSON.stringify(activity.description)},
      shortDescription: ${JSON.stringify(activity.shortDescription)},
      price: ${activity.price},
      duration: ${JSON.stringify(activity.duration)},
      location: ${JSON.stringify(activity.location)},
      includes: ${JSON.stringify(activity.includes)},
      iconType: ${JSON.stringify(activity.iconType)},
      images: ${JSON.stringify(imagesValue)},
      isActive: ${activity.isActive},
      createdAt: new Date(),
      updatedAt: new Date()
    }`;
    }).join(',\n');
    
    // Buscar la sección de actividades y reemplazarla
    const activitiesStart = migrationContent.indexOf('// Migrar actividades\n  await db.insert(activities).values([');
    const activitiesEnd = migrationContent.indexOf(']).onConflictDoNothing();\n\n  // Migrar carrusel de restaurante');
    
    if (activitiesStart !== -1 && activitiesEnd !== -1) {
      const beforeActivities = migrationContent.substring(0, activitiesStart);
      const afterActivities = migrationContent.substring(activitiesEnd);
      
      const newMigrationContent = `${beforeActivities}// Migrar actividades
  await db.insert(activities).values([
${activitiesCode}
  ${afterActivities}`;
      
      // Escribir el archivo actualizado
      fs.writeFileSync(migrationPath, newMigrationContent, 'utf-8');
      
      console.log(`[SYNC] Script de migración actualizado con ${activities.length} actividades`);
    } else {
      console.error("[SYNC] No se pudo encontrar la sección de actividades en migrate-data.ts");
    }
    
  } catch (error) {
    console.error("[SYNC] Error sincronizando script de migración:", error);
  }
}

/**
 * Hook para ejecutar después de operaciones CRUD de actividades
 */
export async function afterActivityChange(): Promise<void> {
  await syncMigrationScript();
}