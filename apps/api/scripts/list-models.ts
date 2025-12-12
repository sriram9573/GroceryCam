import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function listModels() {
    try {
        console.log('Listing models...');
        // Note: listModels might not be exposed directly in all SDK versions comfortably, 
        // but let's try to just use a known "safe" model if this fails.
        // Actually, the SDK does NOT typically expose listModels easily in the simplified client.
        // We will try `gemini-1.5-pro` and `gemini-pro-vision` (legacy).

        // Let's just try to hit 'gemini-1.5-pro'
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent("Hello");
        console.log('gemini-1.5-pro works!');
    } catch (e: any) {
        console.log('gemini-1.5-pro failed:', e.message);
    }

    try {
        const model2 = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        // gemini-pro-vision requires image usually, text-only might fail but 404 is what we check for.
        // Actually let's just try to initialize it.
        console.log('Checking gemini-pro-vision...');
    } catch (e) {
        console.log(e);
    }
}

listModels();
