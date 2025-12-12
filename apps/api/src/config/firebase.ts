import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    } catch (error) {
        console.error('Firebase Admin init failed. Check GOOGLE_APPLICATION_CREDENTIALS.', error);
    }
}

export const db = admin.firestore();
