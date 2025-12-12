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

    return (
        <div className="min-h-screen pb-20 md:pb-0">
            <Navbar />
            <main className="max-w-5xl mx-auto p-4">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold">Hello, {user?.displayName || 'Chef'} 👋</h1>
                    <p className="text-gray-500">Here is what is in your pantry.</p>
                </header>

                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                ) : pantry.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold mb-2">Your pantry is empty</h3>
                        <p className="text-gray-500 mb-6">Scan your first receipt to get started.</p>
                        <Link href="/upload" className="bg-green-600 text-white px-6 py-2 rounded-full font-medium hover:bg-green-700">Scan Receipt</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pantry.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center group">
                                <div>
                                    <h4 className="font-semibold">{item.name}</h4>
                                    <p className="text-sm text-gray-500">{item.category}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-1">
                                        <button
                                            onClick={() => updateQuantity(item.id!, item.quantity, -1)}
                                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white dark:hover:bg-gray-800 rounded shadow-sm transition"
                                        >-</button>
                                        <span className="font-bold text-gray-700 dark:text-gray-200 w-8 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id!, item.quantity, 1)}
                                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-green-500 hover:bg-white dark:hover:bg-gray-800 rounded shadow-sm transition"
                                        >+</button>
                                    </div>
                                    <span className="text-xs text-gray-400 w-8">{item.unit}</span>
                                    <button
                                        onClick={() => deleteItem(item.id!)}
                                        className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
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
