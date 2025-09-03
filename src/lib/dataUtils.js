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
 * Gets the proper doctor title based on gender
 * @param {string} gender - The doctor's gender
 * @returns {string} - Doctor title ("Dr." or "Dra.")
 */
export function getDoctorTitle(gender) {
  if (!gender) return "Dr.";

  // Normalize gender to lowercase for comparison
  const normalizedGender = gender.toLowerCase().trim();

  switch (normalizedGender) {
    case "femenino":
    case "female":
    case "f":
    case "mujer":
    case "woman":
    case "w":
      return "Dra.";
    case "masculino":
    case "male":
    case "m":
    case "hombre":
    case "man":
      return "Dr.";
    default:
      // If gender is not clearly identified, default to "Dr."
      return "Dr.";
  }
}

/**
 * Formats a doctor's name with proper title
 * @param {string} name - The doctor's name (without title)
 * @param {string} gender - The doctor's gender
 * @returns {string} - Formatted name with title
 */
export function formatDoctorName(name, gender) {
  if (!name) return "Nombre no disponible";

  const title = getDoctorTitle(gender);
  return `${title} ${name}`;
}

/**
 * Removes doctor title from a name if present
 * @param {string} name - The name that might contain a title
 * @returns {string} - Name without title
 */
export function removeDoctorTitle(name) {
  if (!name) return "";

  // Remove common title patterns
  return name
    .replace(/^Dr\.?\s+/i, "") // Remove "Dr." or "Dr "
    .replace(/^Dra\.?\s+/i, "") // Remove "Dra." or "Dra "
    .trim();
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
