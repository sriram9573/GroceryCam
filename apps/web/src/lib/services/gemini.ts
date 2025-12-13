import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp', generationConfig: { responseMimeType: "application/json" } });

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
                await wait(1000 * Math.pow(2, i));
                continue;
            }
            return null;
        }
    }
};

export const contentToJSON = (text: string) => {
    try {
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Error:", e, "Text:", text);
        return null;
    }
}

export const analyzeIntent = generateContent;
