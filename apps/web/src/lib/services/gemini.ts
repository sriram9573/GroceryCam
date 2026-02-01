
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';

// Fallback to fetch if SDK fails or for better version control
const generateWithFetch = async (prompt: string, modelName = 'gemini-2.0-flash') => {
    if (!API_KEY) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`Gemini Fetch Error (${response.status}):`, err);
            throw new Error(`Gemini API Error: ${response.statusText}`);
        }

        const data = await response.json();
        // Extract text from response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        return contentToJSON(text);

    } catch (error) {
        console.error("Gemini Fetch Exception:", error);
        return null;
    }
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateContent = async (prompt: string, retries = 3) => {
    // Try using the Fetch implementation directly with v1beta and gemini-2.0-flash
    // This bypasses SDK versioning issues
    return generateWithFetch(prompt);
};

export const contentToJSON = (text: string) => {
    try {
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Error:", e, "Text:", text);
        return null; // Return null to trigger fallback in the route
    }
}

export const analyzeIntent = generateContent;
