import { getAllSpecialties, updateSpecialty } from './specialtiesService';

/**
 * Migra las URLs de imágenes del bucket antiguo al nuevo
 * De: doctore-eae95.firebasestorage.app
 * A: doctore-eae95.appspot.com
 */
export const migrateImageUrls = async () => {
  try {
    console.log('🔄 Iniciando migración de URLs de imágenes...');
    
    const specialties = await getAllSpecialties();
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const specialty of specialties) {
      if (specialty.imageUrl && specialty.imageUrl.includes('doctore-eae95.firebasestorage.app')) {
        try {
          // Convertir la URL del bucket antiguo al nuevo
          const newImageUrl = specialty.imageUrl.replace(
            'doctore-eae95.firebasestorage.app',
            'doctore-eae95.appspot.com'
          );
          
          // Actualizar la especialidad con la nueva URL
          await updateSpecialty(specialty.id, {
            ...specialty,
            imageUrl: newImageUrl
          });
          
          console.log(`✅ Migrada: ${specialty.title}`);
          console.log(`   Antes: ${specialty.imageUrl}`);
          console.log(`   Después: ${newImageUrl}`);
          
          migratedCount++;
        } catch (error) {
          console.error(`❌ Error migrando ${specialty.title}:`, error);
          errorCount++;
        }
      }
    }
    
    return {
      success: true,
      message: `Migración completada: ${migratedCount} URLs migradas, ${errorCount} errores`,
      migratedCount,
      errorCount
    };
  } catch (error) {
    console.error('Error en migración:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verifica qué especialidades tienen URLs del bucket antiguo
 */
export const checkOldUrls = async () => {
  try {
    const specialties = await getAllSpecialties();
    const oldUrls = specialties.filter(s => 
      s.imageUrl && s.imageUrl.includes('doctore-eae95.firebasestorage.app')
    );
    
    console.log(`🔍 Encontradas ${oldUrls.length} especialidades con URLs antiguas:`);
    oldUrls.forEach(s => {
      console.log(`- ${s.title}: ${s.imageUrl}`);
    });
    
    return {
      count: oldUrls.length,
      specialties: oldUrls
    };
  } catch (error) {
    console.error('Error verificando URLs:', error);
    return { count: 0, specialties: [] };
  }
};