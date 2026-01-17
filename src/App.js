// App.js
import React, { useState } from "react";

// Importar utilidades
import { parseExcelForUSMCA, extractComponents } from "./utils/excelParser";
import { performUSMCAAnalysis } from "./utils/usmcaCalculations";
import { generateUSMCAPDF } from "./utils/pdfGenerator";
import { generateUSMCAExcel } from "./utils/excelExporter";

const App = () => {
  // Estados
  const [, setFile] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [availablePartNumbers, setAvailablePartNumbers] = useState([]);
  const [selectedPartNumber, setSelectedPartNumber] = useState("");
  const [bomData, setBomData] = useState(null);
  const [partNumber, setPartNumber] = useState("");
  const [partDescription, setPartDescription] = useState("");
  const [htsusMain, setHtsusMain] = useState("");
  const [totalManufacturedCost, setTotalManufacturedCost] = useState("");
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState(1);

  // ============================================
  // MANEJADORES DE EVENTOS
  // ============================================

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrors([]);

    try {
      const result = await parseExcelForUSMCA(uploadedFile);

      if (result.success) {
        setRawData({ jsonData: result.jsonData, colIndexes: result.colIndexes });
        setAvailablePartNumbers(result.partNumbers);
        setStep(1.5);
      } else {
        setErrors([result.error]);
      }
    } catch (error) {
      setErrors([`Error inesperado: ${error.message}`]);
    }
  };

  const processSelectedPartNumber = () => {
    if (!selectedPartNumber || !rawData) {
      setErrors(["Por favor selecciona un Part Number"]);
      return;
    }

    setErrors([]);

    try {
      const selectedInfo = availablePartNumbers.find(
        (pn) => pn.partNumber === selectedPartNumber
      );

      if (!selectedInfo) {
        setErrors(["Part Number seleccionado no encontrado"]);
        return;
      }

      const { components, errors: extractErrors } = extractComponents(
        rawData.jsonData,
        rawData.colIndexes,
        selectedPartNumber
      );

      if (extractErrors.length > 0) {
        setErrors(extractErrors);
      }

      setBomData({ components });
      setPartNumber(selectedInfo.partNumber);
      setPartDescription(selectedInfo.description);
      setHtsusMain(selectedInfo.htsus);
      setStep(2);
    } catch (error) {
      setErrors([`Error al procesar componentes: ${error.message}`]);
    }
  };

  const calculateAnalysis = () => {
    if (!bomData || !totalManufacturedCost) {
      setErrors(["Por favor ingresa el Total Manufactured Cost"]);
      return;
    }

    setErrors([]);
    const tmc = parseFloat(totalManufacturedCost);

    const result = performUSMCAAnalysis(bomData.components, tmc, htsusMain);

    if (result.success) {
      if (result.warnings && result.warnings.length > 0) {
        setErrors(result.warnings.map((w) => `⚠️ ${w}`));
      }
      setResults(result);
      setStep(3);
    } else {
      setErrors([result.error]);
    }
  };

  const handleGeneratePDF = () => {
    generateUSMCAPDF(partNumber, partDescription, htsusMain, results);
  };

  const handleGenerateExcel = () => {
    generateUSMCAExcel(partNumber, partDescription, htsusMain, results);
  }

  const resetAnalysis = () => {
    setFile(null);
    setRawData(null);
    setAvailablePartNumbers([]);
    setSelectedPartNumber("");
    setBomData(null);
    setPartNumber("");
    setPartDescription("");
    setHtsusMain("");
    setTotalManufacturedCost("");
    setResults(null);
    setErrors([]);
    setStep(1);
  };

  const resetToPartNumberSelection = () => {
  // Solo limpiamos los datos del análisis actual
  setSelectedPartNumber("");        // Limpia el PN seleccionado
  setBomData(null);                 // Limpia componentes
  setPartNumber("");                // Limpia info del PN
  setPartDescription("");           
  setHtsusMain("");                 
  setTotalManufacturedCost("");     // Limpia TMC
  setResults(null);                 // Limpia resultados
  setErrors([]);                    // Limpia errores
  setStep(1.5);                     // Regresa al Paso 1.5
  
  // NO tocamos: file, rawData, availablePartNumbers
  // Porque queremos mantener el Excel cargado
};

  // ============================================
  // RENDERIZADO
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold text-indigo-900 flex items-center gap-3">
            📊 USMCA Analysis Calculator
          </h1>
          <p className="text-white text-xs select-text">
            Developer Isaias Lares
          </p>
          </div>
          
          <p className="text-gray-600 mt-2">
            Calculadora de Análisis de Contenido Regional USMCA
          </p>
          </header>
        

        {/* Errores */}
        {errors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="font-bold text-red-800">Errores Detectados:</h3>
                {errors.map((error, idx) => (
                  <p key={idx} className="text-red-700 text-sm mt-1">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PASO 1: Subir archivo */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              📤 Paso 1: Sube tu archivo Excel (BOM)
            </h2>
            <div className="border-2 border-dashed border-indigo-300 rounded-lg p-12 text-center hover:border-indigo-500 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-lg text-gray-700 font-semibold mb-2">
                  Haz clic o arrastra tu archivo aquí
                </p>
                <p className="text-sm text-gray-500">
                  Formatos aceptados: .xlsx, .xls
                </p>
              </label>
            </div>
          </div>
        )}

        {/* PASO 1.5: Seleccionar Part Number */}
        {step === 1.5 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                ✅ Archivo Cargado Exitosamente
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  Part Numbers Detectados:
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {availablePartNumbers.length}
                </p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🔍 Selecciona el Part Number a Analizar
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Part Number:
              </label>
              <select
                value={selectedPartNumber}
                onChange={(e) => setSelectedPartNumber(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-lg"
              >
                <option value="">-- Selecciona un Part Number --</option>
                {availablePartNumbers.map((pn) => (
                  <option key={pn.partNumber} value={pn.partNumber}>
                    {pn.partNumber} - {pn.description}
                  </option>
                ))}
              </select>
            </div>

            {selectedPartNumber && (
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600">Seleccionado:</p>
                <p className="font-bold text-gray-800 text-lg">
                  {
                    availablePartNumbers.find(
                      (pn) => pn.partNumber === selectedPartNumber
                    )?.partNumber
                  }
                </p>
                <p className="text-gray-700">
                  {
                    availablePartNumbers.find(
                      (pn) => pn.partNumber === selectedPartNumber
                    )?.description
                  }
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  HTSUS:{" "}
                  <span className="font-mono">
                    {
                      availablePartNumbers.find(
                        (pn) => pn.partNumber === selectedPartNumber
                      )?.htsus
                    }
                  </span>
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={processSelectedPartNumber}
                disabled={!selectedPartNumber}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                  selectedPartNumber
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                ▶️ Continuar Análisis
              </button>
              <button
                onClick={resetAnalysis}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Ingresar Total Manufactured Cost */}
        {step === 2 && bomData && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                ✅ Datos Detectados Correctamente
              </h2>
              <div className="grid grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Part Number:</p>
                  <p className="font-bold text-gray-800">{partNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Descripción:</p>
                  <p className="font-bold text-gray-800">{partDescription}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">HTSUS Principal:</p>
                  <p className="font-bold text-gray-800">{htsusMain}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Componentes Encontrados:</p>
                  <p className="font-bold text-gray-800">
                    {bomData.components.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Países Detectados:</p>
                  <p className="font-bold text-gray-800">
                    {[...new Set(bomData.components.map((c) => c.country))].join(
                      ", "
                    )}
                  </p>
                </div>
              </div>
            </div>

            <hr className="my-6" />

            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📝 Paso 2: Ingresa Total Manufactured Cost
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Total Manufactured Cost (USD):
              </label>
              <input
                type="number"
                step="0.01"
                value={totalManufacturedCost}
                onChange={(e) => setTotalManufacturedCost(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-lg"
                placeholder="Ej: 10550.00"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={calculateAnalysis}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                🧮 Calcular Análisis
              </button>
              <button
                onClick={resetToPartNumberSelection}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Resultados */}
        {step === 3 && results && (
          <div className="space-y-6">
            {/* Resumen del Análisis */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                📈 Resumen del Análisis
              </h2>
              {/* Información del Part Number */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4 border-l-4 border-blue-950">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                <p className="text-sm text-gray-600 font-semibold">Part Number</p>
                  <p className="text-lg font-bold text-gray-800">{partNumber}</p>
                    </div>
                <div>
                <p className="text-sm text-gray-600 font-semibold">HTSUS Principal</p>
                <p className="text-lg font-bold text-blue-900">{htsusMain}</p>
                  </div>
                    <div>
                  <p className="text-sm text-gray-600 font-semibold">Descripción</p>
                    <p className="text-lg font-bold text-gray-800 break-words line-clamp-2" title={partDescription}>{partDescription}</p>
                      </div>
                    </div>
                    </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Materials</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${results.totalMaterials.toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Labor & Others</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ${results.laborAndOthers.toFixed(2)}
                  </p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Manufactured Cost</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    ${results.totalManufacturedCost.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg ${
                    results.contentRVC === "YES" ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <p className="text-sm text-gray-600">
                    Regional Value Content (RVC)
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      results.contentRVC === "YES"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {results.rvc.toFixed(2)}%
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    results.contentRVC === "YES" ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <p className="text-sm text-gray-600">Content RVC (≥60%)</p>
                  <p
                    className={`text-3xl font-bold ${
                      results.contentRVC === "YES"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {results.contentRVC}
                  </p>
                </div>
              </div>
            </div>

            {/* Breakdown por País */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                🌍 Breakdown por País
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left font-semibold">País</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Total Cost
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Porcentaje
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results.countryPercentages)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([country, data]) => (
                        <tr
                          key={country}
                          className={`border-b ${
                            !data.isUSMCA ? "bg-yellow-50" : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-semibold">{country}</td>
                          <td className="px-4 py-3 text-right">
                            ${data.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {data.percentage.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                data.isUSMCA
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {data.isUSMCA ? "✓ USMCA" : "✗ Non-USMCA"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detalle de Componentes */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                📋 Detalle de Componentes
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left font-semibold">
                        Componente
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Descripción
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        HTSUS
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        País
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Cantidad
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        Unidad
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Costo Unit.
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Costo Total
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        Tariff Shift
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.components.map((comp, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">{comp.componentNum}</td>
                        <td className="px-3 py-2">{comp.description}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs">
                          {comp.htsus}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              ["MX", "US", "CA"].includes(comp.country)
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {comp.country}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {comp.quantity || "-"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {comp.unit || "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          ${comp.costUnit ? comp.costUnit.toFixed(2) : "0.00"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          ${comp.costTotal.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              comp.tariffShift === "YES"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {comp.tariffShift}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-4">
              <button
                onClick={handleGeneratePDF}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-800 transition-colors flex items-center justify-center gap-2"
              >
                📄 Descargar PDF
              </button>
              <button
                onClick={handleGenerateExcel}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
              >
                💾 Descargar Excel
              </button>
              
              <button
              onClick ={resetToPartNumberSelection}
              className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-800 transition-colors flex items-center justify-center gap-2"
              >
                🔄 Analizar Otro PN
              </button>
              <button
                onClick={resetAnalysis}
                className="flex-1 bg-red-600 text-white  px-6 py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors flex items-center justify-center gap-2"
              >
                📁 Nuevo Archivo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;