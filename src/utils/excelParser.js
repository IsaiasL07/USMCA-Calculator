// src/utils/excelParser.js
import * as XLSX from "xlsx";
import { formatHTSUS } from "./formatters";

/**
 * Define las columnas requeridas del Excel y cómo buscarlas
 */
const COLUMN_MAPPINGS = {
  partNumber: "NUMPRODTERMINADO",
  htsusMain: "FRACCION_PT",
  descriptionPT: "DESCESPANOL_PT",
  componentNum: "NUMCOMPONENTE",
  description: "DESCESPANOL",
  quantity: "CANTIDADCONSUMO",
  htsusComponent: "FRACCION",
  unit: "UNI_MED_SALDOS",
  costUnit: "COSTO_UNITARIO",
  costTotal: "COSTO_TOTAL",
  country: "PAISORIGEN",
};

/**
 * Lee un archivo Excel y lo convierte a JSON
 * @param {File} file - Archivo Excel a procesar
 * @returns {Promise<Object>} Promesa con los datos procesados
 */
export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Error al leer el archivo: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error al cargar el archivo"));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Encuentra los índices de las columnas en el Excel
 * @param {Array} headers - Fila de encabezados del Excel
 * @returns {Object} Objeto con los índices de cada columna
 */
export const findColumnIndexes = (headers) => {
  const indexes = {};

  // Buscar cada columna según el mapping
  Object.keys(COLUMN_MAPPINGS).forEach((key) => {
    const searchTerm = COLUMN_MAPPINGS[key];
    indexes[key] = headers.findIndex((h) => 
      h && String(h).trim()=== searchTerm
    );
  });

  return indexes;
};

/**
 * Valida que todas las columnas requeridas existan
 * @param {Object} colIndexes - Índices de columnas encontrados
 * @returns {Array} Array de nombres de columnas faltantes
 */
export const validateRequiredColumns = (colIndexes) => {
  const missingCols = [];
  const requiredColumns = [
    { key: "partNumber", name: "Part Number" },
    { key: "htsusMain", name: "HTSUS Principal" },
    { key: "costTotal", name: "Costo Total" },
    { key: "country", name: "País Origen" },
  ];

  requiredColumns.forEach(({ key, name }) => {
    if (colIndexes[key] === -1) {
      missingCols.push(name);
    }
  });

  return missingCols;
};

/**
 * Extrae todos los Part Numbers únicos del Excel
 * @param {Array} jsonData - Datos del Excel en formato JSON
 * @param {Object} colIndexes - Índices de las columnas
 * @returns {Array} Array de objetos con Part Number, descripción y HTSUS
 */
export const extractPartNumbers = (jsonData, colIndexes) => {
  const partNumbersMap = new Map();

  // Empezamos en 1 para saltar los headers
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const pn = row[colIndexes.partNumber];
    const desc = row[colIndexes.descriptionPT];
    const hts = row[colIndexes.htsusMain];

    // Solo agregamos si no existe ya y si tiene Part Number
    if (pn && !partNumbersMap.has(pn)) {
      partNumbersMap.set(pn, {
        partNumber: pn,
        description: desc || "Sin descripción",
        htsus: formatHTSUS(hts),
      });
    }
  }

  return Array.from(partNumbersMap.values());
};

/**
 * Extrae todos los componentes de un Part Number específico
 * @param {Array} jsonData - Datos del Excel en formato JSON
 * @param {Object} colIndexes - Índices de las columnas
 * @param {string} selectedPartNumber - Part Number a filtrar
 * @returns {Object} Objeto con componentes y errores encontrados
 */
export const extractComponents = (jsonData, colIndexes, selectedPartNumber) => {
  const components = [];
  const errors = [];

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const rowPartNumber = row[colIndexes.partNumber];
    
    // Solo procesamos filas del Part Number seleccionado
    if (rowPartNumber !== selectedPartNumber) continue;

    // Extraer y parsear datos
    const costUnit = parseFloat(row[colIndexes.costUnit]) || 0;
    const costTotal = parseFloat(row[colIndexes.costTotal]) || 0;
    const country = String(row[colIndexes.country] || "").trim().toUpperCase();
    const htsusComp = formatHTSUS(row[colIndexes.htsusComponent]);

    // Validaciones
    if (costTotal === 0) {
      errors.push(`Fila ${i + 1}: Costo es 0 o inválido`);
    }
    if (!country) {
      errors.push(`Fila ${i + 1}: País no especificado`);
    }

    // Agregar componente
    components.push({
      componentNum: row[colIndexes.componentNum],
      description: row[colIndexes.description],
      quantity: row[colIndexes.quantity],
      htsus: htsusComp,
      unit: row[colIndexes.unit],
      costUnit: costUnit,
      costTotal: costTotal,
      country: country,
    });
  }

  return { components, errors };
};

/**
 * Procesa completamente un archivo Excel para análisis USMCA
 * @param {File} file - Archivo Excel a procesar
 * @returns {Promise<Object>} Promesa con datos procesados o error
 */
export const parseExcelForUSMCA = async (file) => {
  try {

    // 1. Leer archivo
    const jsonData = await readExcelFile(file);

    // 2. Encontrar columnas
    const headers = jsonData[0];
    const colIndexes = findColumnIndexes(headers);

    // 3. Validar columnas requeridas
    const missingCols = validateRequiredColumns(colIndexes);
    if (missingCols.length > 0) {
      throw new Error(`Columnas faltantes: ${missingCols.join(", ")}`);
    }

    // 4. Extraer Part Numbers
    const partNumbers = extractPartNumbers(jsonData, colIndexes);

    return {
      success: true,
      jsonData,
      colIndexes,
      partNumbers,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};