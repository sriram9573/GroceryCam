import admin from 'firebase-admin';

// Check if we are running in the browser (Next.js Edge/Client) or Node (Server)
// Note: This file should only be imported on the server side
if (!admin.apps.length) {
    try {
        // 1. Format Private Key (Handle Vercel's formatting quirks)
        const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
        const privateKey = rawKey
            .replace(/^"|"$/g, '')       // Remove surrounding quotes if present
            .replace(/\\n/g, '\n');      // Replace literal \n with actual newlines

        const serviceAccount = {
            projectId: process.env.GOOGLE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
            privateKey: privateKey,
        };

        if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
            // Cloud / Production Mode
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('Firebase Admin initialized with Environment Variables.');
        } else {
            console.log('Firebase Admin: Missing detailed credentials, attempting App Default.');
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
        }
    } catch (error) {
        console.error('Firebase Admin init failed:', error);
    }
}

// Export Firestore (Safe Access)
export const db = admin.firestore();
