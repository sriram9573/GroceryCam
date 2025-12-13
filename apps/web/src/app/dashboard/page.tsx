'use client';

import Navbar from '@/components/Navbar';
import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { PantryItem } from '@grocery-cam/shared';
import { Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import VoiceAssistant from '@/components/VoiceAssistant';

export default function Dashboard() {
    const user = useStore(s => s.user);
    const [pantry, setPantry] = useState<PantryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubAuth = auth.onAuthStateChanged((u) => {
            if (!u) {
                // Not logged in
                setLoading(false);
                return;
            }
            // User is logged in, subscribe to pantry
            const unsubData = onSnapshot(collection(db, 'users', u.uid, 'pantry'),
                (snap) => {
                    const items = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
                    setPantry(items as PantryItem[]);
                    setLoading(false);
                },
                (error) => {
                    console.error("Dashboard Snapshot Error:", error);
                    setLoading(false);
                }
            );
            return () => unsubData();
        });

        return () => unsubAuth();
    }, []);

    const updateQuantity = async (id: string, current: number, delta: number) => {
        if (!auth.currentUser) return;
        const { doc, updateDoc, deleteDoc } = await import('firebase/firestore');
        const ref = doc(db, 'users', auth.currentUser.uid, 'pantry', id);
        const newQty = Math.max(0, current + delta);

        if (newQty === 0) {
            if (confirm('Remove this item from pantry?')) {
                await deleteDoc(ref);
            }
        } else {
            await updateDoc(ref, { quantity: newQty });
        }
    };

    const deleteItem = async (id: string) => {
        if (!auth.currentUser || !confirm('Are you sure you want to delete this item?')) return;
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'pantry', id));
    };

    const getCategoryEmoji = (name: string, category: string) => {
        const n = name.toLowerCase();
        const c = category.toLowerCase();

        // Specific item overrides
        if (n.includes('carrot')) return '🥕';
        if (n.includes('egg')) return '🥚';
        if (n.includes('milk')) return '🥛';
        if (n.includes('butter')) return '🧈';
        if (n.includes('cheese')) return '🧀';
        if (n.includes('chicken')) return '🍗';
        if (n.includes('beef') || n.includes('steak')) return '🥩';
        if (n.includes('apple')) return '🍎';
        if (n.includes('banana')) return '🍌';
        if (n.includes('bread')) return '🍞';
        if (n.includes('rice')) return '🍚';
        if (n.includes('pasta') || n.includes('noodle')) return '🍝';
        if (n.includes('onion')) return '🧅';
        if (n.includes('garlic')) return '🧄';
        if (n.includes('tomato')) return '🍅';
        if (n.includes('potato')) return '🥔';
        if (n.includes('water')) return '💧';
        if (n.includes('soda') || n.includes('coke')) return '🥤';
        if (n.includes('coffee')) return '☕';
        if (n.includes('tea')) return '🍵';
        if (n.includes('fish') || n.includes('salmon')) return '🐟';
        if (n.includes('oil')) return '🫗';
        if (n.includes('salt')) return '🧂';
        if (n.includes('cookie')) return '🍪';
        if (n.includes('chocolate')) return '🍫';
        if (n.includes('cream')) return '🥛';
        if (n.includes('lime') || n.includes('lemon')) return '🍋';
        if (n.includes('ivy gourd')) return '🥒'; // Close approximation
        if (n.includes('mango')) return '🥭';
        if (n.includes('orange') || n.includes('tangerine')) return '🍊';
        if (n.includes('grape')) return '🍇';
        if (n.includes('strawberry')) return '🍓';
        if (n.includes('pineapple')) return '🍍';
        if (n.includes('coconut')) return '🥥';
        if (n.includes('watermelon')) return '🍉';
        if (n.includes('peach')) return '🍑';
        if (n.includes('pear')) return '🍐';

        // Category fallbacks
        if (c.includes('veg') || c.includes('produce')) return '🥬';
        if (c.includes('fruit')) return '🍎';
        if (c.includes('dairy')) return '🥛';
        if (c.includes('meat')) return '🥩';
        if (c.includes('grain') || c.includes('bread')) return '🍞';
        if (c.includes('snack')) return '🍿';
        if (c.includes('drink') || c.includes('beverage')) return '🥤';
        if (c.includes('condiment') || c.includes('spice')) return '🧂';
        if (c.includes('frozen')) return '🧊';

        return '📦'; // Default package
    };

    return (
        <div className="min-h-screen pb-24 md:pb-0">
            <Navbar />
            <main className="max-w-5xl mx-auto p-4 md:pt-12 animate-in fade-in duration-700">
                <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-neutral-900">
                            Hello, <span className="text-gradient">{user?.displayName?.split(' ')[0] || 'Chef'}</span> 👋
                        </h1>
                        <p className="text-neutral-500 mt-2 text-lg">
                            Your kitchen is looking great today.
                        </p>
                    </div>
                    {/* Simple Stats Placeholder or Action */}
                    <div className="hidden md:flex gap-4">
                        <div className="glass-panel px-6 py-3 rounded-2xl flex flex-col items-center">
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Items</span>
                            <span className="text-2xl font-display font-bold text-primary-600">{pantry.length}</span>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                ) : pantry.length === 0 ? (
                    <div className="glass-panel p-12 rounded-3xl text-center border-2 border-dashed border-orange-100 flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-2">
                            <img src="https://em-content.zobj.net/source/apple/391/basket_1f9fa.png" alt="Empty Basket" className="w-10 h-10" />
                        </div>
                        <h3 className="font-display text-2xl font-bold text-neutral-900">Your pantry is empty</h3>
                        <p className="text-neutral-500 max-w-sm">
                            It looks like you haven't added anything yet. Scan your first receipt to fill it up!
                        </p>
                        <Link href="/upload" className="mt-4 px-8 py-3 bg-neutral-900 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg">
                            Scan Receipt
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pantry.map((item) => (
                            <div key={item.id} className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:scale-[1.01] transition-all duration-300 border border-orange-50 hover:border-orange-200 hover:shadow-2xl">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-4xl">
                                        {getCategoryEmoji(item.name, item.category)}
                                    </div>
                                    <div>
                                        <h4 className="font-display font-bold text-neutral-800 text-xl capitalize mb-1">{item.name}</h4>
                                        <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-xs font-bold uppercase tracking-wider text-orange-600 border border-orange-100">
                                            {item.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto p-4 sm:p-0 bg-orange-50/30 sm:bg-transparent rounded-2xl">
                                    <div className="flex items-center bg-white border border-neutral-100 rounded-2xl p-1.5 shadow-sm">
                                        <button
                                            onClick={() => updateQuantity(item.id!, item.quantity, -1)}
                                            className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                                        >
                                            <span className="text-xl font-bold mb-0.5">−</span>
                                        </button>
                                        <div className="flex flex-col items-center justify-center w-16 px-1">
                                            <span className="font-display font-bold text-neutral-900 text-lg tabular-nums leading-none">{item.quantity}</span>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{item.unit}</span>
                                        </div>
                                        <button
                                            onClick={() => updateQuantity(item.id!, item.quantity, 1)}
                                            className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all active:scale-95"
                                        >
                                            <span className="text-xl font-bold mb-0.5">+</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => deleteItem(item.id!)}
                                        className="w-10 h-10 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm border border-transparent hover:shadow-red-200"
                                        title="Delete Item"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <VoiceAssistant />
        </div>
    );
}
