import admin from 'firebase-admin';

// Check if we are running in the browser (Next.js Edge/Client) or Node (Server)
// Note: This file should only be imported on the server side
if (!admin.apps.length) {
    try {
        const serviceAccount = {
            projectId: process.env.GOOGLE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
            privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
            // Cloud / Production Mode
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('Firebase Admin initialized with Environment Variables.');
        } else {
            // Fallback for local dev if user hasn't set env vars yet but has files (less likely in this Vercel flow)
            console.log('Firebase Admin: Missing detailed credentials, attempting default (might fail in Vercel if Env Vars not set).');
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
        }
    } catch (error) {
        console.error('Firebase Admin init failed. Check Env Vars.', error);
    }
}

export const db = admin.firestore();
