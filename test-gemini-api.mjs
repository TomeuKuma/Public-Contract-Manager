// Test simple de la API de Gemini
// Ejecutar con: node test-gemini-api.mjs

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyBLory9BhYkQJDytjXzXdXSSCOQ4BhFlFc'; // Tu API key
const genAI = new GoogleGenerativeAI(API_KEY);

async function testGeminiAPI() {
    try {
        console.log('🔍 Probando conexión con Gemini API...\n');

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent('Di "Hola" en una palabra');
        const response = result.response.text();

        console.log('✅ API funcionando correctamente!');
        console.log('📝 Respuesta:', response);
        console.log('\n💡 Puedes usar la funcionalidad de extracción de PDF ahora.');

    } catch (error) {
        console.error('❌ Error al conectar con Gemini API:');
        console.error(error.message);

        if (error.message.includes('quota')) {
            console.log('\n⏰ Límite de API excedido. Espera 1-2 minutos.');
        } else if (error.message.includes('API key')) {
            console.log('\n🔑 API key inválida o no habilitada para Gemini.');
        }
    }
}

testGeminiAPI();
