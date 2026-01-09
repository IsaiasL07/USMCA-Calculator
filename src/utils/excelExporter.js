// src/utils/excelExporter.js
import * as XLSX from "xlsx";
import { getCurrentDate } from "./formatters";

/**
 * Genera un archivo Excel con los resultados del análisis USMCA
 */
export const generateUSMCAExcel = (partNumber, partDescription, htsusMain, results) => {
  const dateStr = getCurrentDate();

  // ============================================
  // HOJA 1: BOM WITH USMCA CALCULATION
  // ============================================
  
  const sheet1Data = [
    // Headers principales
    ["USMCA ANALYSIS - BOM"],
    [`Part Number: ${partNumber}`],
    [`Part Description: ${partDescription}`],
    [`HTS: ${htsusMain}`],
    [`Date: ${dateStr}`],
    [`Qualify: ${results.contentRVC}`],
    [], // Línea vacía
    
    // Encabezados de tabla
    ["Component", "Description", "HTSUS", "Country", "Quantity", "Unit", "Cost Unit.", "Cost Total", "Tariff Shift"],
    
    // Datos de componentes
    ...results.components.map(comp => [
      comp.componentNum || "-",
      comp.description || "-",
      comp.htsus || "-",
      comp.country || "-",
      comp.quantity || "-",
      comp.unit || "-",
      comp.costUnit || 0,
      comp.costTotal || 0,
      comp.tariffShift || "-"
    ])
  ];

  const worksheet1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Ajustar anchos de columnas
  worksheet1['!cols'] = [
    { wch: 15 },  // Component
    { wch: 40 },  // Description
    { wch: 15 },  // HTSUS
    { wch: 10 },  // Country
    { wch: 10 },  // Quantity
    { wch: 10 },  // Unit
    { wch: 12 },  // Cost Unit
    { wch: 12 },  // Cost Total
    { wch: 12 }   // Tariff Shift
  ];

  // ============================================
  // HOJA 2: QUALIFICATION RESULTS
  // ============================================
  
  const sheet2Data = [
    ["QUALIFICATION RESULTS"],
    [],
    ["PRODUCT INFORMATION"],
    ["Part Number:", partNumber],
    ["Product Name:", partDescription],
    ["End Item HTS:", htsusMain],
    ["Date Cost:", dateStr],
    ["Currency:", "USD"],
    ["Agreement:", "USMCA"],
    [],
    
    ["COST BREAKDOWN"],
    ["Total Material Cost:", `$${results.totalMaterials.toFixed(2)}`],
    ["Other (Labor Burden O/H):", `$${results.laborAndOthers.toFixed(2)}`],
    ["Net Cost:", `$${results.totalManufacturedCost.toFixed(2)}`],
    [],
    
    ["STATUS"],
    ["Qualify:", results.contentRVC],
    ["RVC:", results.contentRVC === "YES" ? "ACCOMPLISHED" : "INELIGIBLE"],
    ["Calculated RVC:", `${results.rvc.toFixed(2)}%`],
    [],
    
    ["MATERIAL COST BY COUNTRY"],
    ["Country", "Total Cost", "Percentage", "Status"],
    ...Object.entries(results.countryPercentages)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([country, data]) => [
        country,
        `$${data.total.toFixed(2)}`,
        `${data.percentage.toFixed(2)}%`,
        data.isUSMCA ? "USMCA" : "Non-USMCA"
      ])
  ];

  const worksheet2 = XLSX.utils.aoa_to_sheet(sheet2Data);

  // Ajustar anchos de columnas
  worksheet2['!cols'] = [
    { wch: 30 },  // Primera columna
    { wch: 20 },  // Segunda columna
    { wch: 15 },  // Tercera columna
    { wch: 15 }   // Cuarta columna
  ];

  // ============================================
  // CREAR WORKBOOK Y GUARDAR
  // ============================================
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet1, "BOM Analysis");
  XLSX.utils.book_append_sheet(workbook, worksheet2, "Qualification Results");

  // Generar y descargar archivo
  XLSX.writeFile(workbook, `USMCA_Analysis_${partNumber}_${dateStr.replace(/\//g, "-")}.xlsx`);
};