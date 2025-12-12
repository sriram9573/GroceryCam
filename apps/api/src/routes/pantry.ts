import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { verifyAuth } from '../middleware/auth.js';
import { UpdatePantryRequestSchema } from '@grocery-cam/shared';
import { FieldValue } from 'firebase-admin/firestore';

export const pantryRouter = Router();

// POST /api/update-pantry
pantryRouter.post('/update-pantry', verifyAuth, async (req: Request, res: Response) => {
    const uid = req.user!.uid;
    const parse = UpdatePantryRequestSchema.safeParse(req.body);

    if (!parse.success) {
        return res.status(400).json({ error: parse.error });
    }

    const { receiptId, items } = parse.data;

    try {
        await db.runTransaction(async (t) => {
            // 1. PREPARE READS
            const pantryRef = db.collection('users').doc(uid).collection('pantry');
            const itemOps = items.map(item => {
                const itemId = `${item.nameNorm}-${item.unit}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
                return { item, ref: pantryRef.doc(itemId) };
            });

            // Read all pantry items first
            const snapshots = await Promise.all(itemOps.map(op => t.get(op.ref)));

            // 2. EXECUTING WRITES
            const now = new Date().toISOString();

            // A. Update Receipt
            const receiptRef = db.collection('receipts').doc(receiptId);
            t.set(receiptRef, {
                userId: uid,
                items: items,
                updatedAt: now,
                total: items.reduce((sum, item) => sum + (item.lineTotal || 0), 0)
            }, { merge: true });

            // B. Update/Create Pantry Items
            snapshots.forEach((doc, index) => {
                const { item, ref } = itemOps[index];
                const priceEntry = item.unitPrice ? { price: item.unitPrice, date: now } : null;

                if (doc.exists) {
                    const current = doc.data()!;
                    const newQty = (current.quantity || 0) + item.quantity;
                    const history = current.priceHistory || [];
                    if (priceEntry) history.push(priceEntry);

                    t.update(ref, {
                        quantity: newQty,
                        updatedAt: now,
                        priceHistory: history
                    });
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

        res.json({ success: true });
    } catch (error) {
        console.error("Pantry Update Error:", error);
        res.status(500).json({ error: "Failed to update pantry" });
    }
});

