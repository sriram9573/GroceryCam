import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.GEMINI_API_KEY;

async function fetchModels() {
    if (!API_KEY) {
        console.error('No API Key found!');
        return;
    }

    console.log('Fetching models with key:', API_KEY.substring(0, 5) + '...');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', data.error);
        } else if (data.models) {
            console.log('--- AVAILABLE MODELS ---');
            data.models.forEach((m: any) => {
                // Filter for vision models
                const methods = m.supportedGenerationMethods || [];
                const isVision = methods.includes('generateContent');
                // Note: older models separate 'generateMessage' vs 'generateContent'.
                // 'gemini-pro-vision' supports 'generateContent'.
                console.log(`Model: ${m.name} | Supported: ${methods.join(', ')}`);
            });
        } else {
            console.log('No models returned?', data);
        }
    } catch (e: any) {
        console.error('Fetch failed:', e.message);
    }
}

fetchModels();
