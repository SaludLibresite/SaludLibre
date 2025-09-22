import { 
  getAllDoctors, 
  getDoctorById, 
  getDoctorBySlug 
} from './doctorsService';
import { getAllSpecialties } from './specialtiesService';
import { 
  extractBarrioFromAddress, 
  BARRIOS_MAPPING,
  filterDoctorsByBarrio 
} from './barriosUtils';

/**
 * Servicio de funciones del chatbot - VERSION SIMPLIFICADA CON UBICACIONES
 * Replica exactamente el comportamiento del FloatingSearch y agrega búsqueda por barrios
 */
export class ChatbotFunctionsService {
  
  /**
   * Busca doctores por ubicación usando sistema de barrios
   */
  async searchDoctorsByLocation(location, limitResults = 10) {
    try {
      console.log('🌍 CHATBOT: Buscando doctores por ubicación:', location);
      
      const allDoctors = await getAllDoctors();
      const verifiedDoctors = allDoctors.filter(doctor => doctor.verified === true);
      
      console.log(`📊 CHATBOT: Total doctores verificados: ${verifiedDoctors.length}`);
      
      // Normalizar la búsqueda de ubicación
      const searchLocation = location.toLowerCase().trim();
      
      // Buscar coincidencias exactas de barrio primero
      let targetBarrio = null;
      
      // Buscar en las claves de barrios
      for (const [barrio, aliases] of Object.entries(BARRIOS_MAPPING)) {
        if (barrio.toLowerCase().includes(searchLocation) || 
            searchLocation.includes(barrio.toLowerCase())) {
          targetBarrio = barrio;
          break;
        }
        
        // Buscar en los aliases/sinónimos
        const found = aliases.some(alias => 
          alias.toLowerCase().includes(searchLocation) || 
          searchLocation.includes(alias.toLowerCase())
        );
        
        if (found) {
          targetBarrio = barrio;
          break;
        }
      }
      
      console.log(`🎯 CHATBOT: Barrio objetivo identificado: ${targetBarrio}`);
      
      let doctorResults = [];
      
      if (targetBarrio) {
        // Filtrar por barrio específico
        doctorResults = filterDoctorsByBarrio(verifiedDoctors, targetBarrio);
        console.log(`🏘️ CHATBOT: Doctores en ${targetBarrio}: ${doctorResults.length}`);
      } else {
        // Búsqueda más amplia por direcciones que contengan el término
        doctorResults = verifiedDoctors.filter(doctor => {
          const address = doctor.formattedAddress || doctor.ubicacion || '';
          const neighborhood = doctor.neighborhood || '';
          const city = doctor.city || '';
          
          const addressMatch = address.toLowerCase().includes(searchLocation);
          const neighborhoodMatch = neighborhood.toLowerCase().includes(searchLocation);
          const cityMatch = city.toLowerCase().includes(searchLocation);
          
          return addressMatch || neighborhoodMatch || cityMatch;
        });
        
        console.log(`🔍 CHATBOT: Búsqueda amplia por ubicación: ${doctorResults.length} doctores`);
      }
      
      // Limitar resultados
      const limitedResults = doctorResults.slice(0, limitResults);
      
      // Formatear resultado
      const result = limitedResults.map(doctor => ({
        id: doctor.id,
        name: doctor.nombre,
        specialty: doctor.especialidad,
        address: doctor.formattedAddress || doctor.ubicacion,
        neighborhood: doctor.neighborhood,
        city: doctor.city,
        barrio: extractBarrioFromAddress(doctor.formattedAddress || doctor.ubicacion),
        rating: doctor.averageRating || 0,
        reviewCount: doctor.reviewCount || 0,
        consultationFee: doctor.consultationFee,
        phone: doctor.phone,
        slug: doctor.slug,
        verified: doctor.verified
      }));
      
      console.log(`📤 CHATBOT: Retornando ${result.length} doctores para ubicación: ${location}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ CHATBOT: Error buscando doctores por ubicación:', error);
      throw new Error('Error buscando doctores en esa ubicación');
    }
  }

  /**
   * Busca doctores por especialidad - REPLICA EXACTA DEL FLOATING SEARCH
   */
  async searchDoctorsBySpecialty(specialty, limitResults = 10) {
    try {
      console.log('🔍 CHATBOT: Buscando doctores de especialidad:', specialty);
      
      // Usar getAllDoctors igual que FloatingSearch
      const allDoctors = await getAllDoctors();
      console.log(`📊 CHATBOT: Total doctores obtenidos: ${allDoctors.length}`);

      // Filtrar solo doctores verificados igual que FloatingSearch
      const verifiedDoctors = allDoctors.filter(doctor => doctor.verified === true);
      console.log(`✅ CHATBOT: Doctores verificados: ${verifiedDoctors.length}`);

      // Buscar por especialidad usando la misma lógica que FloatingSearch
      const searchTerm = specialty.toLowerCase();
      console.log(`🎯 CHATBOT: Término de búsqueda: "${searchTerm}"`);

      // DEBUG: Mostrar las primeras especialidades para comparar
      console.log('🔬 CHATBOT: Primeras 5 especialidades encontradas:');
      verifiedDoctors.slice(0, 5).forEach((doctor, index) => {
        console.log(`${index + 1}. ${doctor.nombre} - "${doctor.especialidad}"`);
      });

      // Filtro exacto como FloatingSearch
      const doctorResults = verifiedDoctors.filter(doctor => {
        const especialidadMatch = doctor.especialidad?.toLowerCase().includes(searchTerm);
        const nombreMatch = doctor.nombre?.toLowerCase().includes(searchTerm);
        
        if (especialidadMatch || nombreMatch) {
          console.log(`✅ CHATBOT: Coincidencia - ${doctor.nombre} (${doctor.especialidad})`);
        }
        
        return especialidadMatch || nombreMatch;
      });

      console.log(`🎯 CHATBOT: Doctores filtrados: ${doctorResults.length}`);

      // Limitar resultados
      const limitedResults = doctorResults.slice(0, limitResults);

      // Formatear resultado manteniendo la estructura original
      const result = limitedResults.map(doctor => ({
        id: doctor.id,
        name: doctor.nombre,
        specialty: doctor.especialidad,
        address: doctor.formattedAddress || doctor.ubicacion,
        neighborhood: doctor.neighborhood,
        city: doctor.city,
        barrio: extractBarrioFromAddress(doctor.formattedAddress || doctor.ubicacion),
        rating: doctor.averageRating || 0,
        reviewCount: doctor.reviewCount || 0,
        consultationFee: doctor.consultationFee,
        phone: doctor.phone,
        slug: doctor.slug,
        verified: doctor.verified
      }));

      console.log(`📤 CHATBOT: Retornando ${result.length} doctores`);
      
      if (result.length > 0) {
        console.log('📋 CHATBOT: Lista final:', result.map(d => `${d.name} (${d.specialty})`));
      } else {
        console.log('❌ CHATBOT: No se encontraron doctores');
        // Mostrar todas las especialidades disponibles para debug
        const allSpecialties = [...new Set(verifiedDoctors.map(d => d.especialidad))];
        console.log('📋 CHATBOT: Especialidades disponibles:', allSpecialties);
      }

      return result;

    } catch (error) {
      console.error('❌ CHATBOT: Error buscando doctores:', error);
      throw new Error('Error buscando doctores de esa especialidad');
    }
  }

  /**
   * Busca doctores por especialidad Y ubicación combinadas
   */
  async searchDoctorsBySpecialtyAndLocation(specialty, location, limitResults = 10) {
    try {
      console.log('🔍🌍 CHATBOT: Búsqueda combinada - Especialidad:', specialty, 'Ubicación:', location);
      
      const allDoctors = await getAllDoctors();
      const verifiedDoctors = allDoctors.filter(doctor => doctor.verified === true);
      
      // Filtrar por especialidad primero
      const specialtyTerm = specialty.toLowerCase();
      let doctorsBySpecialty = verifiedDoctors.filter(doctor => {
        const especialidadMatch = doctor.especialidad?.toLowerCase().includes(specialtyTerm);
        const nombreMatch = doctor.nombre?.toLowerCase().includes(specialtyTerm);
        return especialidadMatch || nombreMatch;
      });
      
      console.log(`👨‍⚕️ CHATBOT: Doctores de ${specialty}: ${doctorsBySpecialty.length}`);
      
      if (doctorsBySpecialty.length === 0) {
        return [];
      }
      
      // Ahora filtrar por ubicación
      const searchLocation = location.toLowerCase().trim();
      let targetBarrio = null;
      
      // Buscar barrio objetivo
      for (const [barrio, aliases] of Object.entries(BARRIOS_MAPPING)) {
        if (barrio.toLowerCase().includes(searchLocation) || 
            searchLocation.includes(barrio.toLowerCase())) {
          targetBarrio = barrio;
          break;
        }
        
        const found = aliases.some(alias => 
          alias.toLowerCase().includes(searchLocation) || 
          searchLocation.includes(alias.toLowerCase())
        );
        
        if (found) {
          targetBarrio = barrio;
          break;
        }
      }
      
      let finalResults = [];
      
      if (targetBarrio) {
        // Filtrar por barrio específico
        finalResults = filterDoctorsByBarrio(doctorsBySpecialty, targetBarrio);
        console.log(`🏘️ CHATBOT: ${specialty} en ${targetBarrio}: ${finalResults.length}`);
      } else {
        // Búsqueda amplia por direcciones
        finalResults = doctorsBySpecialty.filter(doctor => {
          const address = doctor.formattedAddress || doctor.ubicacion || '';
          const neighborhood = doctor.neighborhood || '';
          const city = doctor.city || '';
          
          const addressMatch = address.toLowerCase().includes(searchLocation);
          const neighborhoodMatch = neighborhood.toLowerCase().includes(searchLocation);
          const cityMatch = city.toLowerCase().includes(searchLocation);
          
          return addressMatch || neighborhoodMatch || cityMatch;
        });
        
        console.log(`🔍 CHATBOT: ${specialty} en zona ${location}: ${finalResults.length}`);
      }
      
      // Limitar resultados
      const limitedResults = finalResults.slice(0, limitResults);
      
      // Formatear resultado
      const result = limitedResults.map(doctor => ({
        id: doctor.id,
        name: doctor.nombre,
        specialty: doctor.especialidad,
        address: doctor.formattedAddress || doctor.ubicacion,
        neighborhood: doctor.neighborhood,
        city: doctor.city,
        barrio: extractBarrioFromAddress(doctor.formattedAddress || doctor.ubicacion),
        rating: doctor.averageRating || 0,
        reviewCount: doctor.reviewCount || 0,
        consultationFee: doctor.consultationFee,
        phone: doctor.phone,
        slug: doctor.slug,
        verified: doctor.verified
      }));
      
      console.log(`📤 CHATBOT: Retornando ${result.length} ${specialty} en ${location}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ CHATBOT: Error en búsqueda combinada:', error);
      throw new Error('Error buscando doctores con esos criterios');
    }
  }

  /**
   * Obtiene información específica de un doctor
   */
  async getDoctorInfo(doctorName) {
    try {
      console.log('🔍 CHATBOT: Buscando información del doctor:', doctorName);
      
      const allDoctors = await getAllDoctors();
      const verifiedDoctors = allDoctors.filter(doctor => doctor.verified === true);
      const nameLower = doctorName.toLowerCase().trim();
      
      let doctor = null;
      
      for (const doc of verifiedDoctors) {
        const fullName = doc.nombre?.toLowerCase() || '';
        
        if (fullName.includes(nameLower) || nameLower.includes(fullName)) {
          doctor = doc;
          break;
        }
      }
      
      if (!doctor) {
        console.log('❌ CHATBOT: Doctor no encontrado:', doctorName);
        return { error: 'Doctor no encontrado' };
      }
      
      const result = {
        id: doctor.id,
        name: doctor.nombre,
        specialty: doctor.especialidad,
        address: doctor.formattedAddress || doctor.ubicacion,
        neighborhood: doctor.neighborhood,
        city: doctor.city,
        barrio: extractBarrioFromAddress(doctor.formattedAddress || doctor.ubicacion),
        rating: doctor.averageRating || 0,
        reviewCount: doctor.reviewCount || 0,
        consultationFee: doctor.consultationFee,
        phone: doctor.phone,
        description: doctor.description,
        slug: doctor.slug,
        verified: doctor.verified
      };
      
      console.log(`✅ CHATBOT: Información encontrada para: ${result.name}`);
      return result;
      
    } catch (error) {
      console.error('❌ CHATBOT: Error obteniendo información del doctor:', error);
      throw new Error('Error obteniendo información del doctor');
    }
  }

  /**
   * Obtiene doctores mejor calificados
   */
  async getTopRatedDoctors(limitResults = 5) {
    try {
      console.log('⭐ CHATBOT: Obteniendo doctores mejor calificados');
      
      const allDoctors = await getAllDoctors();
      const verifiedDoctors = allDoctors.filter(doctor => doctor.verified === true);
      
      // Filtrar doctores con rating y ordenar
      const topDoctors = verifiedDoctors
        .filter(doctor => (doctor.averageRating || 0) > 0)
        .sort((a, b) => {
          const ratingA = a.averageRating || 0;
          const ratingB = b.averageRating || 0;
          const reviewsA = a.reviewCount || 0;
          const reviewsB = b.reviewCount || 0;
          
          // Ordenar por rating, y en caso de empate por cantidad de reviews
          if (ratingB !== ratingA) {
            return ratingB - ratingA;
          }
          return reviewsB - reviewsA;
        })
        .slice(0, limitResults);
      
      const result = topDoctors.map(doctor => ({
        id: doctor.id,
        name: doctor.nombre,
        specialty: doctor.especialidad,
        address: doctor.formattedAddress || doctor.ubicacion,
        neighborhood: doctor.neighborhood,
        city: doctor.city,
        barrio: extractBarrioFromAddress(doctor.formattedAddress || doctor.ubicacion),
        rating: doctor.averageRating || 0,
        reviewCount: doctor.reviewCount || 0,
        consultationFee: doctor.consultationFee,
        phone: doctor.phone,
        slug: doctor.slug,
        verified: doctor.verified
      }));
      
      console.log(`📤 CHATBOT: Retornando ${result.length} doctores top-rated`);
      
      return result;
      
    } catch (error) {
      console.error('❌ CHATBOT: Error obteniendo top doctores:', error);
      throw new Error('Error obteniendo los doctores mejor calificados');
    }
  }

  /**
   * Obtiene todas las especialidades médicas disponibles
   */
  async getAvailableSpecialties() {
    try {
      console.log('🔬 CHATBOT: Obteniendo especialidades disponibles');
      
      const specialties = await getAllSpecialties();
      
      const result = specialties.map(specialty => ({
        id: specialty.id,
        title: specialty.title,
        description: specialty.description
      }));
      
      console.log(`📤 CHATBOT: Retornando ${result.length} especialidades`);
      
      return result;
      
    } catch (error) {
      console.error('❌ CHATBOT: Error obteniendo especialidades:', error);
      throw new Error('Error obteniendo las especialidades disponibles');
    }
  }

  /**
   * Obtiene la lista de barrios/zonas disponibles con cantidad de doctores
   */
  async getAvailableNeighborhoods() {
    try {
      console.log('🏘️ CHATBOT: Obteniendo barrios disponibles');
      
      const allDoctors = await getAllDoctors();
      const verifiedDoctors = allDoctors.filter(doctor => doctor.verified === true);
      
      // Agrupar doctores por barrio
      const barriosCount = {};
      
      verifiedDoctors.forEach(doctor => {
        const address = doctor.formattedAddress || doctor.ubicacion;
        const barrio = extractBarrioFromAddress(address);
        
        if (!barriosCount[barrio]) {
          barriosCount[barrio] = 0;
        }
        barriosCount[barrio]++;
      });
      
      // Convertir a array y ordenar por cantidad
      const result = Object.entries(barriosCount)
        .map(([barrio, count]) => ({
          name: barrio,
          count: count
        }))
        .sort((a, b) => b.count - a.count)
        .filter(item => item.name !== 'Otros'); // Filtrar "Otros" de la lista principal
      
      console.log(`📊 CHATBOT: ${result.length} barrios con doctores encontrados`);
      
      return result;
      
    } catch (error) {
      console.error('❌ CHATBOT: Error obteniendo barrios:', error);
      throw new Error('Error obteniendo las zonas disponibles');
    }
  }
}

// Crear instancia del servicio
const chatbotFunctions = new ChatbotFunctionsService();

// Funciones exportadas para el API
export async function searchDoctorsByLocation(location, limitResults = 10) {
  return await chatbotFunctions.searchDoctorsByLocation(location, limitResults);
}

export async function searchDoctorsBySpecialty(specialty, limitResults = 10) {
  return await chatbotFunctions.searchDoctorsBySpecialty(specialty, limitResults);
}

export async function searchDoctorsBySpecialtyAndLocation(specialty, location, limitResults = 10) {
  return await chatbotFunctions.searchDoctorsBySpecialtyAndLocation(specialty, location, limitResults);
}

export async function getDoctorInfo(doctorName) {
  return await chatbotFunctions.getDoctorInfo(doctorName);
}

export async function getTopRatedDoctors(limitResults = 5) {
  return await chatbotFunctions.getTopRatedDoctors(limitResults);
}

export async function getAvailableSpecialties() {
  return await chatbotFunctions.getAvailableSpecialties();
}

export async function getAvailableNeighborhoods() {
  return await chatbotFunctions.getAvailableNeighborhoods();
}