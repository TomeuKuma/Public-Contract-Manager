import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.VITE_GOOGLE_GEMINI_KEY;

if (!apiKey) {
    console.error('Error: VITE_GOOGLE_GEMINI_KEY is not set in .env');
    process.exit(1);
}

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', data.error);
            return;
        }

        if (!data.models) {
            console.log('No models found or unexpected format:', data);
            return;
        }

        console.log('Available Models:');
        data.models.forEach((m: any) => {
            if (m.supportedGenerationMethods?.includes('generateContent')) {
                console.log(`- ${m.name} (${m.displayName})`);
            }
        });

    } catch (error: any) {
        console.error('Network Error:', error.message);
    }
}

listModels();
