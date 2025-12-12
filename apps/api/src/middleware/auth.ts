import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            user?: admin.auth.DecodedIdToken;
        }
    }
}

export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
        // For development/demo without a frontend ready, we might want to bypass or mock
        // But for production-readiness, return 401.
        // We can allow a "Demo-User-Id" header for testing if needed, but let's stick to real auth or mock.
        if (process.env.NODE_ENV === 'test' || process.env.SKIP_AUTH === 'true') {
            req.user = { uid: 'test-user-id', email: 'test@example.com' } as any;
            return next();
        }
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth Error:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
