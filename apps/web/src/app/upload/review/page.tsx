'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Loader2, Plus, Save } from 'lucide-react';
import { ItemNorm } from '@grocery-cam/shared';

export default function ReviewPage() {
    const router = useRouter();
    const [items, setItems] = useState<ItemNorm[]>([]);
    const [receiptId, setReceiptId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const data = localStorage.getItem('currentReceipt');
        if (data) {
            const parsed = JSON.parse(data);
            setItems(parsed.items);
            setReceiptId(parsed.receiptId);
        } else {
            router.push('/upload');
        }
    }, [router]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Client-side transaction to bypass backend auth issues
            const { db, auth } = await import('@/lib/firebase');
            const { runTransaction, doc, collection } = await import('firebase/firestore');

            if (!auth.currentUser) throw new Error('User not authenticated');
            const uid = auth.currentUser.uid;

            await runTransaction(db, async (t) => {
                // 1. Prepare Refs
                const userPantryRef = collection(db, 'users', uid, 'pantry');
                const receiptRef = doc(db, 'receipts', receiptId);

                // 2. Calculate Item Refs and Read
                const itemOps = items.map(item => {
                    const itemId = `${item.nameNorm}-${item.unit}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const itemRef = doc(userPantryRef, itemId);
                    return { item, ref: itemRef };
                });

                const snapshots = await Promise.all(itemOps.map(op => t.get(op.ref)));

                // 3. Write
                const now = new Date().toISOString();

                // Update Receipt
                t.set(receiptRef, {
                    userId: uid,
                    items: items,
                    updatedAt: now,
                    total: items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 1), 0)
                }, { merge: true });

                // Update Pantry
                snapshots.forEach((snap, i) => {
                    const { item, ref } = itemOps[i];
                    const priceEntry = item.unitPrice ? { price: item.unitPrice, date: now } : null;

                    if (snap.exists()) {
                        const current = snap.data();
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

            localStorage.removeItem('currentReceipt');
            router.push('/dashboard');
        } catch (error: any) {
            console.error(error);
            alert('Failed to save to pantry: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateItem = (index: number, field: keyof ItemNorm, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    if (!items.length && !receiptId) return <div className="p-8"><Loader2 className="animate-spin" /> Loading review data...</div>;

    if (!items.length && receiptId) return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">No Items Found</h2>
            <p className="mb-4">The AI couldn't find any items in that receipt.</p>
            <button onClick={() => router.push('/upload')} className="bg-blue-600 text-white px-4 py-2 rounded">Try Again</button>
        </div>
    );

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Review Items</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                        <tr>
                            <th className="p-4">Item Name</th>
                            <th className="p-4 w-24">Qty</th>
                            <th className="p-4 w-24">Unit</th>
                            <th className="p-4 w-32">Price</th>
                            <th className="p-4 w-32">Category</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-black dark:text-white">
                        {items.map((item, i) => (
                            <tr key={i}>
                                <td className="p-2">
                                    <input
                                        className="w-full bg-transparent border-b border-transparent focus:border-green-500 outline-none"
                                        value={item.nameNorm}
                                        onChange={(e) => updateItem(i, 'nameNorm', e.target.value)}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        className="w-16 bg-transparent border border-gray-200 dark:border-gray-700 rounded px-2"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                                    />
                                </td>
                                <td className="p-2">
                                    <select
                                        className="bg-transparent"
                                        value={item.unit}
                                        onChange={(e) => updateItem(i, 'unit', e.target.value)}
                                    >
                                        <option value="count">count</option>
                                        <option value="g">g</option>
                                        <option value="ml">ml</option>
                                        <option value="lb">lb</option>
                                        <option value="oz">oz</option>
                                    </select>
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        className="w-20 bg-transparent"
                                        value={item.unitPrice || 0}
                                        onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className="w-full bg-transparent text-gray-500"
                                        value={item.category}
                                        onChange={(e) => updateItem(i, 'category', e.target.value)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-end gap-4">
                <button
                    onClick={() => router.push('/upload')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Confirm & Save to Pantry
                </button>
            </div>
        </div>
    );
}
