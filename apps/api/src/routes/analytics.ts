import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { verifyAuth } from '../middleware/auth.js';

export const analyticsRouter = Router();

analyticsRouter.get('/savings', verifyAuth, async (req: Request, res: Response) => {
    const uid = req.user!.uid;

    try {
        // 1. Fetch Receipts for monthly spend
        const receiptsSnap = await db.collection('receipts')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc') // Assuming we add createdAt or use detectedAt
            .get();

        // 2. Fetch Pantry for Price History
        const pantrySnap = await db.collection('users').doc(uid).collection('pantry').get();

        const monthlySpend: Record<string, number> = {};
        const categorySplit: Record<string, number> = {};
        const priceSparklines: Record<string, any[]> = {};

        receiptsSnap.forEach(doc => {
            const data = doc.data();
            // Fallback date
            const dateStr = data.detectedAt || data.updatedAt || new Date().toISOString();
            const month = dateStr.substring(0, 7); // YYYY-MM

            monthlySpend[month] = (monthlySpend[month] || 0) + (data.total || 0);

            // Category logic requires parsing items again or storing aggregated category stats
            // Let's iterate items if they exist
            if (data.items && Array.isArray(data.items)) {
                data.items.forEach((item: any) => {
                    const cat = item.category || 'Other';
                    const cost = item.lineTotal || 0;
                    categorySplit[cat] = (categorySplit[cat] || 0) + cost;
                });
            }
        });

        pantrySnap.forEach(doc => {
            const data = doc.data();
            if (data.priceHistory && data.priceHistory.length > 0) {
                priceSparklines[data.name] = data.priceHistory;
            }
        });

        const resp = {
            monthlySpend: Object.entries(monthlySpend).map(([month, total]) => ({ month, total })),
            categorySplit: Object.entries(categorySplit).map(([category, total]) => ({ category, total })),
            priceSparklines
        };

        res.json(resp);
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});

