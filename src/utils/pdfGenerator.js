// src/utils/pdfGenerator.js
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getCurrentDate } from "./formatters";

/**
 * Genera el PDF completo del análisis USMCA
 */
export const generateUSMCAPDF = (partNumber, partDescription, htsusMain, results) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const dateStr = getCurrentDate();

  // ============================================
  // PRIMERA PÁGINA - BOM WITH USMCA CALCULATION
  // ============================================
  
  /* Header - Nombre Empresa
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("[NOMBRE EMPRESA]", doc.internal.pageSize.width / 2, 8, { align: "center" });*/

  // Título
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BOM WITH USMCA CALCULATION", doc.internal.pageSize.width / 2, 8, { align: "center" });

  // Info del producto
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(`Part Number: ${partNumber}`, doc.internal.pageSize.width / 2, 11.5, { align: "center" });
  doc.text(`Part Description: ${partDescription}`, doc.internal.pageSize.width / 2, 14, { align: "center" });

  doc.setFontSize(6);
  doc.text(`Date Cost: ${dateStr}                    Reference Currency: USD`, doc.internal.pageSize.width / 2, 16, { align: "center" });
  doc.text(`Qualify: ${results.contentRVC}                    HTS: ${htsusMain}`, doc.internal.pageSize.width / 2, 18.5, { align: "center" });

  // Tabla de componentes
  const tableData = results.components.map(comp => [
    comp.componentNum || "-",
    comp.description || "-",
    comp.htsus || "-",
    comp.country || "-",
    comp.quantity || "-",
    comp.unit || "-",
    `$${comp.costUnit ? comp.costUnit.toFixed(2) : "0.00"}`,
    `$${comp.costTotal.toFixed(2)}`,
    comp.tariffShift || "-"
  ]);

  doc.autoTable({
    startY: 23,
    head: [["Component", "Description", "HTSUS", "Country", "Quantity", "Unit", "Cost Unit.", "Cost Total", "Tariff Shift"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: "bold",
      halign: "center"
    },
    styles: {
      fontSize: 7,
      cellPadding: 1
    },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "left" },
      2: { halign: "center", fontStyle: "normal", font: "courier" },
      3: { halign: "center" },
      4: { halign: "right" },
      5: { halign: "center" },
      6: { halign: "right" },
      7: { halign: "right" },
      8: { halign: "center" }
    }
  });

  // ============================================
  // SEGUNDA PÁGINA - QUALIFICATION RESULTS
  // ============================================
  doc.addPage();

  // Header
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("BOM WITH USMCA CALCULATION", doc.internal.pageSize.width / 2, 13, { align: "center" });

  doc.setFontSize(12);
  doc.text("QUALIFICATION RESULTS", doc.internal.pageSize.width / 2, 20, { align: "center" });

  // Sección 1: Part Number Info
  let yPos = 30;
  doc.setFillColor(220, 220, 220);
  doc.rect(10, yPos, 115, 35, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(10, yPos, 115, 35);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`PART NUMBER:`, 12, yPos + 5);
  doc.text(`PRODUCT NAME:`, 12, yPos + 10);
  doc.text(`END ITEM HTS:`, 12, yPos + 15);
  doc.text(`DATE COST:`, 12, yPos + 20);
  doc.text(`CURRENCY:`, 12, yPos + 25);

  doc.setFont("helvetica", "normal");
  doc.text(`${partNumber}`, 40, yPos + 5);
  doc.text(`${partDescription}`, 40, yPos + 10);
  doc.text(`${htsusMain}`, 40, yPos + 15);
  doc.text(`${dateStr}`, 40, yPos + 20);
  doc.text(`USD`, 40, yPos + 25);

  doc.setFont("helvetica", "bold");
  doc.text(`AGREEMENT:`, 12, yPos + 30);
  doc.setFont("helvetica", "normal");
  doc.text(`USMCA`, 40, yPos + 30);

  // Sección 2: Costos
  yPos = 70;
  doc.rect(10, yPos, 115, 18);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL MATERIAL COST:`, 12, yPos + 5);
  doc.text(`OTHER (LABOR BURDEN O/H):`, 12, yPos + 10);
  doc.text(`NET COST:`, 12, yPos + 15);

  doc.setFont("helvetica", "normal");
  doc.text(`$${results.totalMaterials.toFixed(2)}`, 70, yPos + 5);
  doc.text(`$${results.laborAndOthers.toFixed(2)}`, 70, yPos + 10);
  doc.text(`$${results.totalManufacturedCost.toFixed(2)}`, 70, yPos + 15);

  // Sección 3: Status
  yPos = 93;
  doc.rect(10, yPos, 115, 18);
  doc.setFont("helvetica", "bold");
  doc.text(`STATUS:`, 12, yPos + 5);
  doc.setFont("helvetica", "normal");
  doc.text(results.contentRVC, 28, yPos + 5);

  if (results.contentRVC === "YES") {
    doc.text(`RVC ACCOMPLISHED`, 12, yPos + 10);
    doc.text(`ACCOMPLISHED`, 12, yPos + 15);
  } else {
    doc.text(`INELIGIBLE`, 12, yPos + 10);
    doc.text(`NOT ACCOMPLISHED`, 12, yPos + 15);
  }

  // Sección 4: Breakdown
  yPos = 115;
  const nonOrigPct = (results.totalMaterials / results.totalManufacturedCost * 100);
  const laborPct = (results.laborAndOthers / results.totalManufacturedCost * 100);

  doc.rect(10, yPos, 115, 18);
  doc.setFont("helvetica", "bold");
  doc.text(`NON REGIONAL MATERIAL:`, 12, yPos + 5);
  doc.text(`OTHER (LABOR BURDEN O/H):`, 12, yPos + 10);
  doc.text(`CALCULATED RVC:`, 12, yPos + 15);

  doc.setFont("helvetica", "normal");
  doc.text(`$${results.totalMaterials.toFixed(2)}`, 70, yPos + 5);
  doc.text(`${nonOrigPct.toFixed(2)}%`, 90, yPos + 5);
  doc.text(`$${results.laborAndOthers.toFixed(2)}`, 70, yPos + 10);
  doc.text(`${laborPct.toFixed(2)}%`, 90, yPos + 10);
  doc.text(`${results.rvc.toFixed(2)}%`, 70, yPos + 15);

  // Sección 5: Material Cost por País
  yPos = 140;
  doc.setFont("helvetica", "bold");
  doc.text(`MATERIAL COST/COUNTRY:`, 12, yPos);

  yPos += 5;
  doc.setFont("helvetica", "normal");
  const sortedCountries = Object.entries(results.countryPercentages)
    .sort((a, b) => b[1].total - a[1].total);

  sortedCountries.forEach(([country, data]) => {
    doc.text(`MATERIAL COST/COUNTRY ${country}:`, 12, yPos);
    doc.text(`${data.percentage.toFixed(2)}%`, 65, yPos);
    yPos += 5;
  });

  // Guardar PDF
  doc.save(`USMCA_Analysis_${partNumber}_${dateStr.replace(/\//g, "-")}.pdf`);
};