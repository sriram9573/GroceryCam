import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export const detectText = async (imageUrl: string) => {
    try {
        const imageResp = await fetch(imageUrl);
        const imageBuffer = await imageResp.arrayBuffer();

        const result = await model.generateContent([
            "List all grocery items in this image. If it's a receipt, extract the text line by line. If it's a real object (like fruit/veg), just name the object. Return plain text list.",
            {
                inlineData: {
                    data: Buffer.from(imageBuffer).toString('base64'),
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const rawText = result.response.text();
        if (!rawText) return { rawText: '', items: [] };

        return { rawText, fullResult: null };
    } catch (error) {
        console.error('Gemini OCR Error:', error);
        throw new Error('OCR Failed via Gemini');
    }
};
