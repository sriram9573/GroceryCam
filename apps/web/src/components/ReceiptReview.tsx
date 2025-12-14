import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Plus, X } from 'lucide-react';
import { ItemNorm } from '@grocery-cam/shared';
// Types needed, usually imported but for standalone component
import ReceiptUploader from './ReceiptUploader';

interface ReceiptReviewProps {
    initialItems?: ItemNorm[];
    initialReceiptId?: string;
    onCancel?: () => void;
    onComplete?: () => void;
}

export default function ReceiptReview({ initialItems, initialReceiptId, onCancel, onComplete }: ReceiptReviewProps) {
    const router = useRouter();
    const [items, setItems] = useState<ItemNorm[]>(initialItems || []);
    const [receiptId, setReceiptId] = useState<string>(initialReceiptId || '');
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Initialize from LocalStorage if props are missing
    useEffect(() => {
        if (!initialItems && !initialReceiptId) {
            const data = localStorage.getItem('currentReceipt');
            if (data) {
                const parsed = JSON.parse(data);
                setItems(parsed.items);
                setReceiptId(parsed.receiptId);
            }
        }
    }, [initialItems, initialReceiptId]);

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

                // 2. Calculate Item Refs and Read
                const itemOps = items.map(item => {
                    const itemId = `${item.nameNorm}-${item.unit}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const itemRef = doc(userPantryRef, itemId);
                    return { item, ref: itemRef };
                });

                // READS MUST COME FIRST
                const snapshots = await Promise.all(itemOps.map(op => t.get(op.ref)));

                // 3. Write
                const now = new Date().toISOString();

                // Write Receipt (Moved to after reads)
                if (receiptId) {
                    const receiptRef = doc(db, 'receipts', receiptId);
                    t.set(receiptRef, {
                        userId: uid,
                        items: items,
                        updatedAt: now,
                        total: items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 1), 0)
                    }, { merge: true });
                }

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
                            priceHistory: history,
                            emoji: item.emoji || current.emoji,
                        });
                    } else {
                        t.set(ref, {
                            name: item.nameNorm,
                            category: item.category,
                            quantity: item.quantity,
                            unit: item.unit,
                            updatedAt: now,
                            priceHistory: priceEntry ? [priceEntry] : [],
                            emoji: item.emoji || '📦',
                        });
                    }
                });
            });

            localStorage.removeItem('currentReceipt');
            if (onComplete) {
                onComplete();
            } else {
                router.push('/dashboard');
            }
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

    const handleAddMoreSuccess = (data: { receiptId: string, items: ItemNorm[] }) => {
        // Append new items to existing list
        setItems(prev => [...prev, ...data.items]);
        // Ideally we might want to link multiple receipt IDs, but for MVP we just keep the session growing
        setShowAddModal(false);
    };

    if (!items.length && !receiptId) return (
        <div className="flex flex-col items-center justify-center p-8 text-neutral-500 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Loading receipt data...</p>
        </div>
    );

    if (!items.length && receiptId) return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">No Items Found</h2>
            <p className="mb-8 text-neutral-500 max-w-md">Our AI chef couldn't spot any items. Try scanning closer.</p>
            <button
                onClick={onCancel}
                className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold"
            >
                Try Again
            </button>
        </div>
    );

    return (
        <div className="bg-neutral-50 dark:bg-neutral-950 pb-32">
            {/* Ambient Background - LOCALIZED to this div if embedded */}
            <div className="absolute inset-x-0 top-0 h-[500px] overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-400/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="max-w-3xl mx-auto p-4 md:p-8 relative">
                <header className="mb-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-3xl font-display font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
                                Scan Results <span className="text-2xl">✨</span>
                            </h1>
                            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Review items before adding to pantry.</p>
                        </div>
                    </div>
                </header>

                <div className="space-y-3">
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className="group relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-emerald-500/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                {/* Emoji & Name */}
                                <div className="flex items-center flex-1 w-full md:w-auto gap-4">
                                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0">
                                        {item.emoji || '📦'}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            className="w-full bg-transparent text-lg font-bold text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1"
                                            value={item.nameNorm}
                                            onChange={(e) => updateItem(i, 'nameNorm', e.target.value)}
                                            placeholder="Item Name"
                                        />
                                        <input
                                            className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-transparent focus:outline-none w-full opacity-70 focus:opacity-100"
                                            value={item.category}
                                            onChange={(e) => updateItem(i, 'category', e.target.value)}
                                            placeholder="Category"
                                        />
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-xl">
                                    <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                        <input
                                            type="number"
                                            className="w-12 bg-transparent text-center font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none py-1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                                        />
                                        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700" />
                                        <select
                                            className="bg-transparent text-xs font-semibold text-neutral-500 dark:text-neutral-400 focus:outline-none px-2 py-1 appearance-none hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                                            value={item.unit}
                                            onChange={(e) => updateItem(i, 'unit', e.target.value)}
                                        >
                                            <option value="count">count</option>
                                            <option value="lb">lb</option>
                                            <option value="kg">kg</option>
                                            <option value="oz">oz</option>
                                            <option value="g">g</option>
                                            <option value="liter">L</option>
                                            <option value="gallon">gal</option>
                                        </select>
                                    </div>

                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                                        <input
                                            type="number"
                                            className="w-20 pl-6 pr-3 py-1.5 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            value={item.unitPrice || 0}
                                            onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Floating Action Bar */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-auto backdrop-blur-md bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 p-2 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-10 delay-300 z-50">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 rounded-xl font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all font-display text-sm md:text-base"
                    >
                        Retake
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 rounded-xl font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 font-display text-sm md:text-base"
                    >
                        <Plus className="w-5 h-5" />
                        Scan More
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap font-display text-sm md:text-base"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Confirm
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Scale-In Modal for Adding More */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
                            <h3 className="font-bold text-lg dark:text-white">Scan Additional Items</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors">
                                <X className="w-5 h-5 text-neutral-500" />
                            </button>
                        </div>
                        <div className="p-6">
                            <ReceiptUploader onSuccess={handleAddMoreSuccess} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
