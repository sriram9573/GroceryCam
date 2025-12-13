import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
import { UpdatePantryRequestSchema } from '@grocery-cam/shared';
import { auth } from 'firebase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parse = UpdatePantryRequestSchema.safeParse(body);
        if (!parse.success) return NextResponse.json({ error: parse.error }, { status: 400 });

        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth().verifyIdToken(token);
        const uid = decodedToken.uid;

        const { receiptId, items } = parse.data;

        await db.runTransaction(async (t) => {
            const pantryRef = db.collection('users').doc(uid).collection('pantry');
            const itemOps = items.map(item => {
                const itemId = `${item.nameNorm}-${item.unit}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
                return { item, ref: pantryRef.doc(itemId) };
            });

            const snapshots = await Promise.all(itemOps.map(op => t.get(op.ref)));
            const now = new Date().toISOString();

            // Update Receipt
            const receiptRef = db.collection('receipts').doc(receiptId);
            t.set(receiptRef, {
                userId: uid,
                items: items,
                updatedAt: now,
                total: items.reduce((sum, item) => sum + (item.lineTotal || 0), 0)
            }, { merge: true });

            // Update Pantry
            snapshots.forEach((doc, index) => {
                const { item, ref } = itemOps[index];
                const priceEntry = item.unitPrice ? { price: item.unitPrice, date: now } : null;

                if (doc.exists) {
                    const current = doc.data()!;
                    const newQty = (current.quantity || 0) + item.quantity;
                    const history = current.priceHistory || [];
                    if (priceEntry) history.push(priceEntry);

                    t.update(ref, { quantity: newQty, updatedAt: now, priceHistory: history });
                } else {
                    t.set(ref, {
                        name: item.nameNorm,
                        category: item.category,
                        quantity: item.quantity,
                        unit: item.unit,
                        updatedAt: now,
                        priceHistory: priceEntry ? [priceEntry] : []
                    });
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Pantry Update Error:", error);
        return NextResponse.json({ error: "Failed to update pantry" }, { status: 500 });
    }
}
