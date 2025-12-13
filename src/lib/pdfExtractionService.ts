/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PDF Extraction Service
 * 
 * Uses 'any' for PDF.js text content items and Gemini AI model interactions.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker de PDF.js desde node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_GEMINI_KEY);

export interface ExtractedContractData {
    contract: {
        expedient: string;
        internal_reference: string;
        title: string;
        contract_type: string;
        award_procedure: string;
        award_date: string; // ISO format: YYYY-MM-DD
        contact_responsible: string;
        areas: string[];
        centers: string[];
        is_extendable: boolean;
        is_modifiable: boolean;
    };
    lots: Array<{
        name: string;
        cpv_description: string;
        supplier_name: string;
        supplier_cif: string;
        formalization_date: string; // ISO
        start_date: string; // ISO
        end_date: string; // ISO
    }>;
}

/**
 * Extrae texto del PDF usando pdfjs-dist (compatible con navegador)
 */
async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();

    // Cargar el PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';

    // Extraer texto de cada página
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}

/**
 * Envía el texto del PDF a Gemini para extracción estructurada de datos
 */
async function generateContentWithRetry(model: any, prompt: string, maxRetries = 3): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await model.generateContent(prompt);
        } catch (error: any) {
            const isLastAttempt = i === maxRetries - 1;

            // Si es error de cuota (429) y no es el último intento, esperar y reintentar
            if ((error.message?.includes('429') || error.message?.includes('quota')) && !isLastAttempt) {
                const waitTime = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s...
                console.warn(`Límite de API detectado. Reintentando en ${waitTime}ms... (Intento ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            throw error;
        }
    }
}

/**
 * Envía el texto del PDF a Gemini para extracción estructurada de datos
 */
export async function extractContractDataFromPDF(
    file: File
): Promise<ExtractedContractData> {
    try {
        // 1. Extraer texto del PDF
        const pdfText = await extractTextFromPDF(file);

        if (!pdfText || pdfText.trim().length < 100) {
            throw new Error('El PDF no contiene texto extraíble. Asegúrate de que no es un PDF escaneado.');
        }

        // 2. Enviar a Gemini con prompt estructurado
        // Usamos gemini-2.0-flash que es la versión estable disponible
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.1, // Baja temperatura para respuestas más deterministas
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 2048,
            },
        });

        const prompt = `Eres un experto en contratación pública del IMAS (Institut Mallorquí d'Afers Socials). 

A continuación te proporciono el texto completo de una resolución de adjudicación de un contracte público.

Tu tarea es extraer la información estructurada siguiendo EXACTAMENTE este formato JSON:

{
  "contract": {
    "expedient": "string (número de expediente de SEGEX,formato: NNNNNNX o NNNNNNNX, ej: 904335X o 1392360J, la numeración siempre empieza por 7,8,9,o 1)",
    "internal_reference": "string (referencia interna del contracte, formato: YYYY/NNN/XXXX, ej: 2022/143/CSER)",
    "title": "string (objeto/descripción del contracte)",
    "contract_type": "string (Obra | Servei | Subministrament | Concessió)",
    "award_procedure": "string (Contracte obert | Contracte menor AD| Contracte menor ADO)",
    "award_date": "string (formato ISO: YYYY-MM-DD)",
    "contact_responsible": "string (nombre del responsable de contrato)",
    "areas": ["array de strings con nombres de áreas mencionadas, entre las siguientes posibilidades: "Atenció Comunitaria i Promoció de la Autonomia Personal", "Atenció Sociosanitària"],
    "centers": ["array de strings con nombres completos de centros mencionados, entre las siguientes posibilidades: "Centre de dia Can Clar", "Centre de dia Reina Sofia", "Centre de dia Son Perxana", "CPAP Can Real (Petra)", "CPAP Llar d'Avinguda Argentina", "CPAP Llar de Felanitx", "CPAP Llar de Llucmajor", "CPAP Llar de Manacor", "CPAP Llar Reina Sofia", "CPAP Son Bru (Puigpunyent)", "Oficina d'habitatge (Inca)", "Residència Bartomeu Quetglas", "Residència Huialfàs", "Residència La Bonanova", "Residència Llar dels Ancians", "Residència Miquel Mir", "Residència Oms-Sant Miquel", "Residència Sant Josep", "Residència Son Caulelles", "Servei d'Ajuda Integral a Domicili", "Servei d'Atenció Sociosanitària"],
    "is_extendable": boolean (true si menciona que puede haber prórroga),
    "is_modifiable": boolean (true si menciona que puede haber modificación)
  },
  "lots": [
    {
      "name": "string (nombre del lot o 'Sense lots' si no hay lots explícitos)",
      "cpv_description": "string (formato 45100000-5 o 45100000)",
      "supplier_name": "string (nombre de la empresa adjudicataria)",
      "supplier_cif": "string (CIF/NIF sin espacios ni guiones)",
      "formalization_date": "string (fecha adjudicación ISO: YYYY-MM-DD)",
      "start_date": "string (fecha inicio del servei ISO: YYYY-MM-DD)",
      "end_date": "string (fecha fin del servei ISO: YYYY-MM-DD)",
    }
  ]
}

INSTRUCCIONES CRÍTICAS:
1. Si NO hay lots explícitos, crea un único lot con name="Sense lots"
2. Las fechas SIEMPRE en formato ISO (YYYY-MM-DD), convierte del formato catalán/español (dd/mm/yyyy)
3. Extrae TODOS los lots mencionados si hay múltiples
4. Para contract_type, identifica si es "Obra", "Servei","Subministrament" o "Concessió" del contexto
5. Limpia el CIF eliminando espacios, guiones y puntos
6. Si no encuentras un campo, usa cadena vacía "" o array vacío []
7. NO inventes datos, solo extrae lo que existe en el documento
8. Para areas y centers, busca menciones de residencias, centros de día, servicios sociales, etc.
9. Responde ÚNICAMENTE con JSON válido, sin markdown ni explicaciones adicionales

TEXTO DEL PDF:
${pdfText}`;

        const result = await generateContentWithRetry(model, prompt);
        const responseText = result.response.text();

        console.log('Gemini response:', responseText);

        // Limpiar respuesta (por si viene con ```json)
        const cleanJson = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const extractedData: ExtractedContractData = JSON.parse(cleanJson);

        // Validación básica
        if (!extractedData.contract || !extractedData.lots) {
            throw new Error('Estructura de datos inválida en la respuesta de IA');
        }

        if (extractedData.lots.length === 0) {
            throw new Error('No se detectaron lots en el documento');
        }

        // Validar fechas ISO
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (extractedData.contract.award_date && !dateRegex.test(extractedData.contract.award_date)) {
            console.warn('Fecha de adjudicación no está en formato ISO:', extractedData.contract.award_date);
        }

        return extractedData;

    } catch (error: any) {
        console.error('Error en extractContractDataFromPDF:', error);

        // Mensajes de error más específicos
        if (error.message?.includes('API key')) {
            throw new Error('Error de configuración: API key de Gemini inválida');
        }
        if (error.message?.includes('quota') || error.message?.includes('429')) {
            throw new Error('Límite de API excedido. Espera 1-2 minutos antes de volver a intentarlo.');
        }
        if (error instanceof SyntaxError) {
            throw new Error('Error al procesar la respuesta de IA. El formato del PDF puede ser inusual.');
        }

        throw new Error(`Error al extraer datos del PDF: ${error.message}`);
    }
}
