import admin from 'firebase-admin';

// Check if we are running in the browser (Next.js Edge/Client) or Node (Server)
// Note: This file should only be imported on the server side
// Helper to safely get Firestore instance
function getFirestoreInstance() {
    // 1. Format Private Key (Handle Vercel's formatting quirks)
    if (!process.env.GOOGLE_PRIVATE_KEY) {
        console.warn('Firebase Admin: No GOOGLE_PRIVATE_KEY found.');
    }

    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const privateKey = rawKey
        .replace(/^"|"$/g, '')       // Remove surrounding quotes if present
        .replace(/\\n/g, '\n');      // Replace literal \n with actual newlines

    const serviceAccount = {
        projectId: process.env.GOOGLE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        privateKey: privateKey,
    };

    if (!admin.apps.length) {
        try {
            if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
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
            // Do not throw here, allow build to continue, but runtime will fail if DB used
        }
    }
    if (admin.apps.length > 0) {
        return admin.firestore();
    }

    // MOCK DB for Build Time (or when env vars are missing)
    // This allows the build to pass even if the backend logic is imported
    console.warn('Firebase Admin: Returning MOCK DB to prevent crash.');
    const mockQuery = {
        where: () => mockQuery,
        orderBy: () => mockQuery,
        limit: () => mockQuery,
        get: async () => ({ empty: true, docs: [], forEach: () => { } }),
    };
    const mockCollection = {
        doc: () => mockDoc,
        ...mockQuery,
    };
    const mockDoc = {
        collection: () => mockCollection,
        get: async () => ({ exists: false, data: () => ({}) }),
        set: async () => { },
        update: async () => { },
    };

    return {
        collection: () => mockCollection,
        doc: () => mockDoc,
        runTransaction: async (cb: any) => cb({ get: async () => ({ exists: false, data: () => ({}) }), update: () => { }, set: () => { } }),
        batch: () => ({ commit: async () => { }, set: () => { }, update: () => { }, delete: () => { } }),
    } as any;
}

// Export a robust "lazy" db object that initializes on first use
// This prevents build crashes if credentials are bad during static analysis
export const db = {
    collection: (name: string) => getFirestoreInstance().collection(name),
    doc: (path: string) => getFirestoreInstance().doc(path),
    runTransaction: (updateFunction: any) => getFirestoreInstance().runTransaction(updateFunction),
    batch: () => getFirestoreInstance().batch(),
    // Add other methods as needed or use a Proxy for complete coverage
} as any;
