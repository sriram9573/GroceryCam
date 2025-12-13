import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth().verifyIdToken(token);
        const uid = decodedToken.uid;

        // 1. Fetch Receipts for monthly spend
        const receiptsSnap = await db.collection('receipts')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();

        // 2. Fetch Pantry for Price History
        const pantrySnap = await db.collection('users').doc(uid).collection('pantry').get();

        const monthlySpend: Record<string, number> = {};
        const categorySplit: Record<string, number> = {};
        const priceSparklines: Record<string, any[]> = {};

        receiptsSnap.forEach((doc: any) => {
            const data = doc.data();
            const dateStr = data.detectedAt || data.updatedAt || new Date().toISOString();
            const month = dateStr.substring(0, 7); // YYYY-MM
            monthlySpend[month] = (monthlySpend[month] || 0) + (data.total || 0);

            if (data.items && Array.isArray(data.items)) {
                data.items.forEach((item: any) => {
                    const cat = item.category || 'Other';
                    const cost = item.lineTotal || 0;
                    categorySplit[cat] = (categorySplit[cat] || 0) + cost;
                });
            }
        });

        pantrySnap.forEach((doc: any) => {
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

        return NextResponse.json(resp);
    } catch (error) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
