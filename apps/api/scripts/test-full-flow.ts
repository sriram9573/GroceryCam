import dotenv from 'dotenv';
import path from 'path';
import { detectText } from '../src/services/ocr';
import { generateContent } from '../src/services/gemini';

// Manual config since we are running via tsx
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testFullFlow() {
    console.log('--- Testing Full Flow (OCR + Normalization) ---');

    // 1. OCR
    console.log('Step 1: Testing OCR (detectText)...');
    try {
        const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/ReceiptSwiss.jpg';
        const { rawText } = await detectText(imageUrl);
        console.log('✅ OCR Success! Length:', rawText.length);
        console.log('Preview:', rawText.substring(0, 50));

        // 2. Normalization
        console.log('\nStep 2: Testing Normalization (generateContent)...');
        const prompt = `Convert this receipt text to JSON: \n${rawText}`;
        const result = await generateContent(prompt);

        if (result) {
            console.log('✅ Normalization Success!');
            console.log('Result:', JSON.stringify(result, null, 2));
        } else {
            console.error('❌ Normalization returned NULL (check server logs/console)');
        }

    } catch (error: any) {
        console.error('❌ Critical Failure:', error.message);
        console.error(error);
    }
}

testFullFlow();
