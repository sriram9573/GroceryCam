import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export const detectText = async (imageUrl: string) => {
    try {
        const imageResp = await fetch(imageUrl);
        const imageBuffer = await imageResp.arrayBuffer();

        const result = await model.generateContent([
            `Analyze this image and list all grocery items you see.

IMPORTANT INSTRUCTIONS:
1. If you see MULTIPLE identical items (e.g., 3 apples, 2 water bottles), COUNT them accurately
2. For each unique item, specify the QUANTITY you see
3. If it's a receipt, extract text line by line
4. If it's real objects (fruits, vegetables, packaged goods), identify and count each item
5. Be precise with quantities - if you see 3 carrots, say "3 carrots" not just "carrots"

Return a plain text list in this format:
[quantity] [item name]

Examples:
- "3 apples"
- "1 milk carton"  
- "2 water bottles"
- "5 bananas"

If quantity is unclear or it's a receipt line item, default to 1.`,
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
