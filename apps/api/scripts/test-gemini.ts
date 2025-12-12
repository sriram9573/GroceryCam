import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('--- Gemini Vision Test ---');
console.log('Key available:', !!process.env.GEMINI_API_KEY);

async function test() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log('Fetching test image...');
        const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/ReceiptSwiss.jpg';
        const imageResp = await fetch(imageUrl);
        const imageBuffer = await imageResp.arrayBuffer();

        console.log('Sending to Gemini...');
        const result = await model.generateContent([
            "List the items in this receipt with their prices. output strict text.",
            {
                inlineData: {
                    data: Buffer.from(imageBuffer).toString('base64'),
                    mimeType: "image/jpeg",
                },
            },
        ]);

        console.log('✅ SUCCESS! Gemini response:');
        console.log(result.response.text().substring(0, 100));

    } catch (error: any) {
        console.error('❌ FAILURE:', error.message);
    }
}

test();
