import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker de PDF.js desde node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_KEY;

if (!apiKey) {
    console.error('VITE_GOOGLE_GEMINI_KEY is missing in environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY'); // Evitar error de inicialización inmediato, fallará al llamar a la API si es dummy

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
        if (!apiKey) {
            throw new Error('API key no encontrada. Asegúrate de tener VITE_GOOGLE_GEMINI_KEY en tu archivo .env y reinicia el servidor de desarrollo.');
        }

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

        const prompt = `
            Actúa como un experto en contratación pública. Analiza el siguiente texto extraído de un pliego de contratación o documento de adjudicación y extrae los datos estructurados.
            
            IMPORTANTE:
            - Devuelve SOLO un objeto JSON válido. Sin markdown, sin explicaciones.
            - Si un campo no se encuentra, usa null (o false para booleanos).
            - Para fechas, usa formato ISO YYYY-MM-DD. Si no hay fecha exacta, null.
            - Para importes, usa números (sin símbolos de moneda).
            
            Estructura JSON requerida:
            {
                "contract": {
                    "expedient": "Número de expediente",
                    "internal_reference": "Referencia interna o código adicional si existe",
                    "title": "Título del contrato",
                    "contract_type": "Tipo de contrato (Servicios, Suministros, Obras, Privado, Patrimonial, Concesión de servicios)",
                    "award_procedure": "Procedimiento (Abierto, Menor, Basado en acuerdo marco, Negociado sin publicidad, Negociado con publicidad, Abierto simplificado, Abierto supersimplificado, Derivado de sistema dinámico de adquisición, Licitación con negociación, Diálogo competitivo, Asociación para la innovación, Concurso de proyectos, Restringido)",
                    "award_date": "YYYY-MM-DD (Fecha de adjudicación)",
                    "contact_responsible": "Nombre de la persona de contacto o responsable si aparece",
                    "areas": ["Nombre del área solicitante"],
                    "centers": ["Nombre del centro de coste"],
                    "is_extendable": boolean (true si se menciona prórroga),
                    "is_modifiable": boolean (true si se menciona modificación prevista)
                },
                "lots": [
                    {
                        "name": "Nombre del lote (o 'Lote Único' si no hay lotes)",
                        "cpv_description": "Código CPV completo (ej: 45233200-1)",
                        "supplier_name": "Nombre del adjudicatario",
                        "supplier_cif": "CIF/NIF del adjudicatario",
                        "formalization_date": "YYYY-MM-DD",
                        "start_date": "YYYY-MM-DD",
                        "end_date": "YYYY-MM-DD"
                    }
                ]
            }

            TEXTO DEL CONTRATO:
            ${pdfText.substring(0, 30000)} // Limitamos a 30k caracteres para no exceder tokens
        `;

        const result = await generateContentWithRetry(model, prompt);
        const response = await result.response;
        const text = response.text();

        // Limpiar el texto para obtener solo el JSON
        const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();

        const extractedData = JSON.parse(jsonString);

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
            // Incluimos el mensaje original para depuración
            throw new Error(`Error de configuración: API key de Gemini inválida. Detalles: ${error.message}`);
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
