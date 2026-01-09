// src/utils/formatters.js

/**
 * Formatea un código HTSUS al formato estándar XXXX.XX.XXXX
 * @param {string|number} htsus - Código HTSUS sin formatear
 * @returns {string} HTSUS formateado
 */
export const formatHTSUS = (htsus) => {
  if (!htsus) return "";
  
  // Limpiamos puntos y tomamos solo la parte entera
  let cleaned = String(htsus).replace(/\./g, "").split(".")[0];
  
  // Rellenamos con ceros hasta 10 dígitos
  cleaned = cleaned.padEnd(10, "0");
  
  // Cortamos a 10 dígitos máximo
  cleaned = cleaned.substring(0, 10);
  
  // Formateamos: XXXX.XX.XXXX
  return `${cleaned.substring(0, 4)}.${cleaned.substring(4, 6)}.${cleaned.substring(6, 10)}`;
};

/**
 * Formatea un número como moneda USD
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada como $X,XXX.XX
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${parseFloat(amount).toFixed(2)}`;
};

/**
 * Formatea un porcentaje con 2 decimales
 * @param {number} value - Valor a formatear
 * @returns {string} Porcentaje formateado como XX.XX%
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return "0.00%";
  return `${parseFloat(value).toFixed(2)}%`;
};

/**
 * Obtiene la fecha actual en formato MM/DD/YYYY
 * @returns {string} Fecha formateada
 */
export const getCurrentDate = () => {
  const today = new Date();
  return `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
};

/**
 * Valida si un país pertenece a USMCA
 * @param {string} country - Código de país
 * @returns {boolean} true si es país USMCA
 */
export const isUSMCACountry = (country) => {
  const usmcaCountries = ["MX", "US", "CA", "MEXICO", "USA", "CANADA"];
  return usmcaCountries.includes(String(country).trim().toUpperCase());
};