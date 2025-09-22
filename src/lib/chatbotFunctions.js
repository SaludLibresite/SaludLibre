import { 
  getAllDoctors, 
  getDoctorById, 
  getDoctorBySlug 
} from './doctorsService';
import { getAllSpecialties } from './specialtiesService';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Servicio de funciones del chatbot para consultas específicas
 */
export class ChatbotFunctionsService {
  
    /**
   * Función deshabilitada - búsqueda por ubicación no disponible
   * @param {string} location - Ubicación 
   * @param {number} limitResults - Límite de resultados
   * @returns {Object} Mensaje de función no disponible
   */
  async searchDoctorsByLocation(location, limitResults = 10) {
    return {
      error: 'La búsqueda por ubicación no está disponible actualmente. Te recomiendo buscar por especialidad médica.',
      suggestion: 'Prueba preguntando por una especialidad específica como "cardiólogos", "dermatólogos", "pediatras", etc.'
    };
  }

    /**
   * Busca doctores por especialidad
   * @param {string} specialty - Especialidad médica
   * @param {number} limitResults - Límite de resultados (default: 10)
   * @returns {Array} Lista de doctores de la especialidad
   */
  async searchDoctorsBySpecialty(specialty, limitResults = 10) {
    try {
      console.log('🔍 Buscando doctores de especialidad:', specialty);
      
      const doctorsRef = collection(db, 'doctors');
      
      // Obtener todos los doctores activos
      const q = query(
        doctorsRef,
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      let allDoctors = [];
      
      querySnapshot.forEach((doc) => {
        const doctorData = doc.data();
        allDoctors.push({
          id: doc.id,
          ...doctorData
        });
      });

      console.log(`📊 Total de doctores activos encontrados: ${allDoctors.length}`);

      // Normalizar la búsqueda - mapear términos comunes
      const specialtyMap = {
        'dermatología': ['dermatología', 'dermatólogo', 'dermatológico', 'piel'],
        'cardiología': ['cardiología', 'cardiólogo', 'cardiológico', 'corazón'],
        'pediatría': ['pediatría', 'pediatra', 'pediátrico', 'niños'],
        'ginecología': ['ginecología', 'ginecólogo', 'ginecológico'],
        'traumatología': ['traumatología', 'traumatólogo', 'traumatológico'],
        'neurología': ['neurología', 'neurólogo', 'neurológico'],
        'psiquiatría': ['psiquiatría', 'psiquiatra', 'psiquiátrico'],
        'psicología': ['psicología', 'psicólogo', 'psicóloga'],
        'oftalmología': ['oftalmología', 'oftalmólogo', 'ojos'],
        'urología': ['urología', 'urólogo'],
        'endocrinología': ['endocrinología', 'endocrinólogo'],
        'gastroenterología': ['gastroenterología', 'gastroenterólogo'],
        'neumología': ['neumología', 'neumólogo'],
        'otorrinolaringología': ['otorrinolaringología', 'otorrinolaringólogo', 'otorrino']
      };

      const specialtyLower = specialty.toLowerCase().trim();
      console.log(`🎯 Buscando especialidad normalizada: "${specialtyLower}"`);

      // Buscar la especialidad normalizada
      let targetSpecialty = specialtyLower;
      for (const [mainSpecialty, variations] of Object.entries(specialtyMap)) {
        if (variations.some(variation => specialtyLower.includes(variation) || variation.includes(specialtyLower))) {
          targetSpecialty = mainSpecialty;
          console.log(`✅ Especialidad mapeada de "${specialtyLower}" a "${targetSpecialty}"`);
          break;
        }
      }

      // Filtrar doctores por especialidad - usar los mismos campos que FloatingSearch
      let doctors = allDoctors.filter(doctor => {
        // Intentar con ambos campos posibles de especialidad
        const doctorSpecialty1 = doctor.especialidad?.toLowerCase() || '';
        const doctorSpecialty2 = doctor.specialty?.toLowerCase() || '';
        
        console.log(`🔬 Comparando doctor: ${doctor.nombre || doctor.firstName} - especialidades: "${doctorSpecialty1}" / "${doctorSpecialty2}" vs búsqueda: "${targetSpecialty}"`);
        
        // Múltiples tipos de coincidencia para ambos campos
        const exactMatch1 = doctorSpecialty1 === targetSpecialty;
        const exactMatch2 = doctorSpecialty2 === targetSpecialty;
        const contains1 = doctorSpecialty1.includes(targetSpecialty) || targetSpecialty.includes(doctorSpecialty1);
        const contains2 = doctorSpecialty2.includes(targetSpecialty) || targetSpecialty.includes(doctorSpecialty2);
        
        // Verificar también contra las variaciones del mapa
        let mapMatch1 = false, mapMatch2 = false;
        if (specialtyMap[targetSpecialty]) {
          mapMatch1 = specialtyMap[targetSpecialty].some(variation => 
            doctorSpecialty1.includes(variation.toLowerCase()) || 
            variation.toLowerCase().includes(doctorSpecialty1)
          );
          mapMatch2 = specialtyMap[targetSpecialty].some(variation => 
            doctorSpecialty2.includes(variation.toLowerCase()) || 
            variation.toLowerCase().includes(doctorSpecialty2)
          );
        }
        
        const matches = exactMatch1 || exactMatch2 || contains1 || contains2 || mapMatch1 || mapMatch2;
        if (matches) {
          console.log(`✅ Doctor coincide: ${doctor.nombre || doctor.firstName} ${doctor.lastName || ''} - ${doctorSpecialty1 || doctorSpecialty2}`);
        }
        
        return matches;
      });

      console.log(`🎯 Doctores filtrados por especialidad: ${doctors.length}`);

      // Si no encontramos coincidencias exactas, intentar búsqueda más amplia
      if (doctors.length === 0) {
        console.log('🔄 Intentando búsqueda más amplia...');
        doctors = allDoctors.filter(doctor => {
          const doctorSpecialty1 = doctor.especialidad?.toLowerCase() || '';
          const doctorSpecialty2 = doctor.specialty?.toLowerCase() || '';
          const firstName = doctor.firstName?.toLowerCase() || '';
          const lastName = doctor.lastName?.toLowerCase() || '';
          const nombre = doctor.nombre?.toLowerCase() || '';
          
          return doctorSpecialty1.includes(specialtyLower) || 
                 doctorSpecialty2.includes(specialtyLower) || 
                 firstName.includes(specialtyLower) || 
                 lastName.includes(specialtyLower) ||
                 nombre.includes(specialtyLower);
        });
        console.log(`🔍 Búsqueda amplia encontró: ${doctors.length} resultados`);
      }

      // Ordenar por calificación
      doctors.sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return ratingB - ratingA;
      });

      // Limitar resultados
      doctors = doctors.slice(0, limitResults);

      // Log de todas las especialidades únicas en la base de datos para debug
      const allSpecialties1 = [...new Set(allDoctors.map(d => d.especialidad).filter(Boolean))];
      const allSpecialties2 = [...new Set(allDoctors.map(d => d.specialty).filter(Boolean))];
      console.log('📋 Especialidades únicas (campo "especialidad"):', allSpecialties1);
      console.log('📋 Especialidades únicas (campo "specialty"):', allSpecialties2);

      // Formatear resultado - usar los mismos campos que FloatingSearch
      const result = doctors.map(doctor => ({
        id: doctor.id,
        name: doctor.nombre || `${doctor.firstName} ${doctor.lastName}`,
        specialty: doctor.especialidad || doctor.specialty,
        address: doctor.address,
        neighborhood: doctor.neighborhood,
        city: doctor.city,
        rating: doctor.averageRating || 0,
        reviewCount: doctor.reviewCount || 0,
        consultationFee: doctor.consultationFee,
        phone: doctor.phone,
        experience: doctor.experience,
        education: doctor.education,
        slug: doctor.slug,
        // Campos adicionales del modelo de datos
        nombre: doctor.nombre,
        especialidad: doctor.especialidad
      }));

      console.log(`📤 Retornando ${result.length} doctores`);
      return result;

    } catch (error) {
      console.error('❌ Error buscando doctores por especialidad:', error);
      throw new Error('Error buscando doctores de esa especialidad');
    }
  }

  /**
   * Obtiene información específica de un doctor
   * @param {string} doctorName - Nombre del doctor o ID
   * @returns {Object} Información detallada del doctor
   */
  async getDoctorInfo(doctorName) {
    try {
      console.log('Buscando información del doctor:', doctorName);
      
      const doctorsRef = collection(db, 'doctors');
      const nameLower = doctorName.toLowerCase().trim();
      
      // Buscar por nombre
      const q = query(doctorsRef, where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      
      let doctor = null;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const fullName = `${data.firstName} ${data.lastName}`.toLowerCase();
        const firstName = data.firstName?.toLowerCase() || '';
        const lastName = data.lastName?.toLowerCase() || '';
        
        if (fullName.includes(nameLower) || 
            firstName.includes(nameLower) || 
            lastName.includes(nameLower) ||
            nameLower.includes(firstName) ||
            nameLower.includes(lastName)) {
          doctor = {
            id: doc.id,
            ...data
          };
        }
      });

      if (!doctor) {
        return { error: 'Doctor no encontrado' };
      }

      // Formatear información completa
      return {
        id: doctor.id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        specialty: doctor.specialty,
        address: doctor.address,
        neighborhood: doctor.neighborhood,
        city: doctor.city,
        phone: doctor.phone,
        email: doctor.email,
        rating: doctor.averageRating || 0,
        reviewCount: doctor.reviewCount || 0,
        consultationFee: doctor.consultationFee,
        experience: doctor.experience,
        education: doctor.education,
        description: doctor.description,
        services: doctor.services || [],
        availability: doctor.availability || {},
        slug: doctor.slug,
        languages: doctor.languages || [],
        awards: doctor.awards || []
      };

    } catch (error) {
      console.error('Error obteniendo información del doctor:', error);
      throw new Error('Error obteniendo información del doctor');
    }
  }

  /**
   * Obtiene todas las especialidades disponibles
   * @returns {Array} Lista de especialidades
   */
  async getAvailableSpecialties() {
    try {
      const specialties = await getAllSpecialties();
      return specialties.map(specialty => ({
        id: specialty.id,
        title: specialty.title,
        description: specialty.description
      }));
    } catch (error) {
      console.error('Error obteniendo especialidades:', error);
      throw new Error('Error obteniendo especialidades disponibles');
    }
  }

  /**
   * Busca doctores mejor calificados
   * @param {number} limitResults - Límite de resultados (default: 5)
   * @returns {Array} Lista de doctores mejor calificados
   */
  async getTopRatedDoctors(limitResults = 5) {
    try {
      const doctorsRef = collection(db, 'doctors');
      const q = query(
        doctorsRef,
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      const allDoctors = [];
      
      querySnapshot.forEach((doc) => {
        allDoctors.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Ordenar por calificación en memoria
      allDoctors.sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        
        // Si tienen la misma calificación, ordenar por número de reseñas
        const reviewsA = a.reviewCount || 0;
        const reviewsB = b.reviewCount || 0;
        return reviewsB - reviewsA;
      });

      // Tomar los mejores calificados
      const topDoctors = allDoctors.slice(0, limitResults);

      return topDoctors.map(doctor => ({
        id: doctor.id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        specialty: doctor.specialty,
        rating: doctor.averageRating || 0,
        reviewCount: doctor.reviewCount || 0,
        consultationFee: doctor.consultationFee,
        slug: doctor.slug
      }));

    } catch (error) {
      console.error('Error obteniendo doctores mejor calificados:', error);
      throw new Error('Error obteniendo doctores mejor calificados');
    }
  }

  /**
   * Obtiene definición de funciones disponibles para Gemini
   * @returns {Array} Definiciones de funciones
   */
  getFunctionDefinitions() {
    return [
      {
        name: 'searchDoctorsBySpecialty',
        description: 'Busca doctores por especialidad médica',
        parameters: {
          type: 'object',
          properties: {
            specialty: {
              type: 'string',
              description: 'Especialidad médica (ej: Cardiología, Dermatología, Pediatría, Ginecología, etc.)'
            },
            limitResults: {
              type: 'number',
              description: 'Número máximo de resultados (default: 10)'
            }
          },
          required: ['specialty']
        }
      },
      {
        name: 'getDoctorInfo',
        description: 'Obtiene información detallada de un doctor específico',
        parameters: {
          type: 'object',
          properties: {
            doctorName: {
              type: 'string',
              description: 'Nombre del doctor o ID'
            }
          },
          required: ['doctorName']
        }
      },
      {
        name: 'getAvailableSpecialties',
        description: 'Obtiene todas las especialidades médicas disponibles',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'getTopRatedDoctors',
        description: 'Obtiene los doctores mejor calificados',
        parameters: {
          type: 'object',
          properties: {
            limitResults: {
              type: 'number',
              description: 'Número máximo de resultados (default: 5)'
            }
          }
        }
      }
    ];
  }
}

export const chatbotFunctions = new ChatbotFunctionsService();