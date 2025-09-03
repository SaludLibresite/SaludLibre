/**
 * Validation utilities for the application
 */

/**
 * Validates Argentine phone numbers
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid Argentine phone number
 */
export const validateArgentinePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return true; // Empty is valid (optional field)
  }

  // Remove all non-numeric characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');

  // Check for Argentine phone patterns
  const argentineMobileRegex = /^(\+54|54)?((11|15|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39)\d{8})$/;
  const argentineLandlineRegex = /^(\+54|54)?((2[2-9]|3[2-9]|4[1-9]|5[1-9]|6[1-9]|7[1-9])\d{8})$/;

  // Check if it matches Argentine phone patterns
  if (cleanPhone.startsWith('+54') || cleanPhone.startsWith('54')) {
    const numberWithoutPrefix = cleanPhone.replace(/^(\+54|54)/, '');
    return (numberWithoutPrefix.length === 10 &&
            (argentineMobileRegex.test(cleanPhone) || argentineLandlineRegex.test(cleanPhone)));
  }

  // Allow international format without +54 prefix (10 digits)
  return cleanPhone.length === 10 && /^\d{10}$/.test(cleanPhone);
};

/**
 * Formats phone number to Argentine format
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatArgentinePhone = (phone) => {
  if (!phone) return '';

  const cleanPhone = phone.replace(/[^\d+]/g, '');

  // If already has +54 prefix
  if (cleanPhone.startsWith('+54')) {
    const number = cleanPhone.substring(3);
    if (number.length === 10) {
      return `+54 ${number.substring(0, 2)} ${number.substring(2, 6)}-${number.substring(6)}`;
    }
  }

  // If starts with 54
  if (cleanPhone.startsWith('54')) {
    const number = cleanPhone.substring(2);
    if (number.length === 10) {
      return `+54 ${number.substring(0, 2)} ${number.substring(2, 6)}-${number.substring(6)}`;
    }
  }

  // If just 10 digits
  if (cleanPhone.length === 10) {
    return `+54 ${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`;
  }

  return phone; // Return original if doesn't match patterns
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - {isValid: boolean, message: string}
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: "La contraseña es requerida" };
  }

  if (password.length < 6) {
    return { isValid: false, message: "La contraseña debe tener al menos 6 caracteres" };
  }

  if (password.length > 128) {
    return { isValid: false, message: "La contraseña no puede tener más de 128 caracteres" };
  }

  return { isValid: true, message: "" };
};

/**
 * Validates name (no numbers or special characters)
 * @param {string} name - Name to validate
 * @returns {boolean} - True if valid name
 */
export const validateName = (name) => {
  if (!name || !name.trim()) return false;
  // Allow letters, spaces, and common accented characters
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 2;
};
