/**
 * Utility functions for data normalization and cleaning
 */

/**
 * Normalizes gender values to avoid duplicates
 * @param {string} genero - The gender value to normalize
 * @returns {string} - Normalized gender value
 */
export function normalizeGenero(genero) {
  if (!genero || typeof genero !== 'string') {
    return '';
  }
  
  const trimmed = genero.trim();
  if (trimmed === '') {
    return '';
  }
  
  // Capitalize first letter and lowercase the rest
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Normalizes an array of gender values and removes duplicates
 * @param {Array} generos - Array of gender values
 * @returns {Array} - Array of normalized unique gender values
 */
export function normalizeGenderArray(generos) {
  return [...new Set(
    generos
      .filter(genero => genero) // Remove null/undefined values
      .map(genero => normalizeGenero(genero))
      .filter(genero => genero !== '') // Remove empty strings
  )].sort();
}

/**
 * Normalizes a doctor object by cleaning up text fields
 * @param {Object} doctor - Doctor object to normalize
 * @returns {Object} - Normalized doctor object
 */
export function normalizeDoctor(doctor) {
  return {
    ...doctor,
    genero: normalizeGenero(doctor.genero),
    // Add other field normalizations as needed
    especialidad: doctor.especialidad?.trim(),
    ubicacion: doctor.ubicacion?.trim(),
    nombre: doctor.nombre?.trim(),
  };
}
