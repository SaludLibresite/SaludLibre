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
    return false; // For registration, phone is required
  }

  // Remove all non-numeric characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');

  console.log('validateArgentinePhone:', { original: phone, cleaned: cleanPhone });

  // Check for Argentine phone patterns - be more flexible
  // Accept 10 digits (any area code format)
  if (cleanPhone.length === 10 && /^\d{10}$/.test(cleanPhone)) {
    console.log('Valid: 10 digits without prefix');
    return true;
  }

  // Accept with +54 prefix (total 13 chars: +54 + 10 digits)
  if (cleanPhone.startsWith('+54') && cleanPhone.length === 13) {
    console.log('Valid: with +54 prefix');
    return true;
  }

  // Accept with 54 prefix (total 12 digits: 54 + 10 digits)
  if (cleanPhone.startsWith('54') && !cleanPhone.startsWith('+') && cleanPhone.length === 12) {
    console.log('Valid: with 54 prefix');
    return true;
  }

  console.log('Invalid phone format');
  return false;
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
