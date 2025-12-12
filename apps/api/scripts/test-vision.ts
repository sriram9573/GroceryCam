import dotenv from 'dotenv';
import path from 'path';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import fs from 'fs';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const keyPath = '/Users/sriramreddy/Desktop/grocery-cam/apps/api/service-account.json';
const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

console.log('--- Vision API Explicit Auth Test ---');
console.log('Using Key for Email:', keyFile.client_email);
console.log('Project ID:', keyFile.project_id);

async function test() {
    try {
        // Explicitly pass credentials
        const client = new ImageAnnotatorClient({
            credentials: {
                client_email: keyFile.client_email,
                private_key: keyFile.private_key,
            },
            projectId: keyFile.project_id
        });
        console.log('Client initialized with explicit creds.');

        const [result] = await client.annotateImage({
            image: { source: { imageUri: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/ReceiptSwiss.jpg' } },
            features: [{ type: 'TEXT_DETECTION' }]
        });

        console.log('✅ SUCCESS! Text found:', result.fullTextAnnotation?.text?.substring(0, 50));

    } catch (error: any) {
        console.error('❌ FAILURE:', error.message);
        if (error.details) console.error('Details:', error.details);
        if (error.code === 7) console.error('Hint: PERMISSION_DENIED usually means the API is not enabled or Billing is off.');
        if (error.code === 16) console.error('Hint: UNAUTHENTICATED means the Key itself is rejected.');
    }
}

test();
