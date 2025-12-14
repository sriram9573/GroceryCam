import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Use standard Flash model for speed and reliability
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: "application/json" } });

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateContent = async (prompt: string, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            return contentToJSON(text);
        } catch (e: any) {
            console.error(`Gemini attempt ${i + 1} failed:`, e.message);
            if (e.message.includes('403') || e.message.includes('503')) {
                if (i === retries - 1) throw e;
                await wait(1000 * Math.pow(2, i)); // Exponential backoff: 1s, 2s, 4s
                continue;
            }
            return null;
        }
    }
};

export const contentToJSON = (text: string) => {
    // Helper to extract JSON from markdown code blocks often returned by LLMs
    // Even with responseMimeType, safe parsing is good practice
    try {
        // Strip markdown code blocks if present
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Error:", e, "Text:", text);
        return null;
    }
};

