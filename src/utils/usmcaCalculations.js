// src/utils/usmcaCalculations.js
import { isUSMCACountry } from "./formatters";

/**
 * Calcula el contenido de materiales por país
 * @param {Array} components - Lista de componentes
 * @returns {Object} Objeto con totales por país
 */
export const calculateCountryBreakdown = (components) => {
  const byCountry = {};

  components.forEach((comp) => {
    const country = comp.country;
    const isUSMCA = isUSMCACountry(country);

    if (!byCountry[country]) {
      byCountry[country] = {
        total: 0,
        isUSMCA: isUSMCA,
      };
    }

    byCountry[country].total += comp.costTotal;
  });

  return byCountry;
};

/**
 * Calcula el total de materiales no originarios (fuera de USMCA)
 * @param {Array} components - Lista de componentes
 * @returns {number} Total de materiales no originarios
 */
export const calculateNonOriginatingTotal = (components) => {
  let nonOriginatingTotal = 0;

  components.forEach((comp) => {
    const isUSMCA = isUSMCACountry(comp.country);
    if (!isUSMCA) {
      nonOriginatingTotal += comp.costTotal;
    }
  });

  return nonOriginatingTotal;
};

/**
 * Calcula el total de materiales
 * @param {Array} components - Lista de componentes
 * @returns {number} Total de materiales
 */
export const calculateTotalMaterials = (components) => {
  return components.reduce((sum, comp) => sum + comp.costTotal, 0);
};

/**
 * Calcula el Regional Value Content (RVC)
 * @param {number} totalManufacturedCost - Costo total de manufactura
 * @param {number} nonOriginatingTotal - Total de materiales no originarios
 * @returns {number} Porcentaje RVC
 */
export const calculateRVC = (totalManufacturedCost, nonOriginatingTotal) => {
  if (totalManufacturedCost <= 0) return 0;
  return ((totalManufacturedCost - nonOriginatingTotal) / totalManufacturedCost) * 100;
};

/**
 * Determina si un producto cumple con USMCA (RVC >= 60%)
 * @param {number} rvc - Porcentaje RVC calculado
 * @returns {string} "YES" o "NO"
 */
export const determineUSMCACompliance = (rvc) => {
  return rvc >= 60 ? "YES" : "NO";
};

/**
 * Calcula porcentajes por país basado en TMC
 * @param {Object} byCountry - Breakdown por país
 * @param {number} laborAndOthers - Costos de mano de obra y otros
 * @param {number} totalManufacturedCost - Costo total de manufactura
 * @returns {Object} Objeto con porcentajes calculados
 */
export const calculateCountryPercentages = (byCountry, laborAndOthers, totalManufacturedCost) => {
  const countryPercentages = {};

  // Calcular porcentajes para materiales
  Object.keys(byCountry).forEach((country) => {
    const percentage = (byCountry[country].total / totalManufacturedCost) * 100;
    countryPercentages[country] = {
      total: byCountry[country].total,
      percentage: percentage,
      isUSMCA: byCountry[country].isUSMCA,
    };
  });

  // Agregar Labor & Others a México
  if (countryPercentages["MX"]) {
    countryPercentages["MX"].total += laborAndOthers;
    countryPercentages["MX"].percentage = (countryPercentages["MX"].total / totalManufacturedCost) * 100;
  } else {
    countryPercentages["MX"] = {
      total: laborAndOthers,
      percentage: (laborAndOthers / totalManufacturedCost) * 100,
      isUSMCA: true,
    };
  }

  return countryPercentages;
};

/**
 * Calcula Tariff Shift comparando HTSUS
 * @param {string} mainHTSUS - HTSUS del producto terminado
 * @param {string} componentHTSUS - HTSUS del componente
 * @returns {string} "YES", "NO", o "NA"
 */
export const calculateTariffShift = (mainHTSUS, componentHTSUS) => {
  if (!mainHTSUS || !componentHTSUS) return "NA";

  // Extraer primeros 4 dígitos (capítulo arancelario)
  const mainFirst4 = mainHTSUS.replace(/\./g, "").substring(0, 4);
  const compFirst4 = componentHTSUS.replace(/\./g, "").substring(0, 4);

  // Si son diferentes, hay Tariff Shift
  return mainFirst4 === compFirst4 ? "NA" : "YES";
};

/**
 * Agrega Tariff Shift a cada componente
 * @param {Array} components - Lista de componentes
 * @param {string} mainHTSUS - HTSUS del producto terminado
 * @returns {Array} Componentes con Tariff Shift calculado
 */
export const addTariffShiftToComponents = (components, mainHTSUS) => {
  return components.map((comp) => ({
    ...comp,
    tariffShift: calculateTariffShift(mainHTSUS, comp.htsus),
  }));
};

/**
 * Valida que el Total Manufactured Cost sea válido
 * @param {number} totalManufacturedCost - TMC a validar
 * @param {number} totalMaterials - Total de materiales
 * @returns {Object} { isValid, error }
 */
export const validateTotalManufacturedCost = (totalManufacturedCost, totalMaterials) => {
  if (!totalManufacturedCost || totalManufacturedCost <= 0) {
    return {
      isValid: false,
      error: "Total Manufactured Cost debe ser mayor a 0",
    };
  }

  if (totalManufacturedCost < totalMaterials) {
    return {
      isValid: false,
      error: "Total Manufactured Cost no puede ser menor que Total Materials",
    };
  }

  return { isValid: true, error: null };
};

/**
 * Realiza el análisis completo de USMCA
 * @param {Array} components - Lista de componentes
 * @param {number} totalManufacturedCost - Costo total de manufactura
 * @param {string} htsusMain - HTSUS del producto terminado
 * @returns {Object} Resultados completos del análisis
 */
export const performUSMCAAnalysis = (components, totalManufacturedCost, htsusMain) => {
  // 1. Validar TMC
  const totalMaterials = calculateTotalMaterials(components);
  const validation = validateTotalManufacturedCost(totalManufacturedCost, totalMaterials);

  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  // 2. Calcular Labor & Others
  const laborAndOthers = totalManufacturedCost - totalMaterials;

  // 3. Calcular materiales no originarios
  const nonOriginatingTotal = calculateNonOriginatingTotal(components);

  // 4. Calcular RVC
  const rvc = calculateRVC(totalManufacturedCost, nonOriginatingTotal);

  // 5. Determinar cumplimiento
  const contentRVC = determineUSMCACompliance(rvc);

  // 6. Breakdown por país
  const byCountry = calculateCountryBreakdown(components);
  const countryPercentages = calculateCountryPercentages(
    byCountry,
    laborAndOthers,
    totalManufacturedCost
  );

  // 7. Agregar Tariff Shift a componentes
  const componentsWithTS = addTariffShiftToComponents(components, htsusMain);

  // 8. Validar que porcentajes sumen 100%
  const totalPercentage = Object.values(countryPercentages).reduce(
    (sum, c) => sum + c.percentage,
    0
  );

  const warnings = [];
  if (Math.abs(totalPercentage - 100) > 0.1) {
    warnings.push(`Los porcentajes suman ${totalPercentage.toFixed(2)}% en lugar de 100%`);
  }

  // 9. Retornar resultados completos
  return {
    success: true,
    totalMaterials,
    totalManufacturedCost,
    laborAndOthers,
    nonOriginatingTotal,
    rvc,
    contentRVC,
    countryPercentages,
    components: componentsWithTS,
    warnings,
  };
};