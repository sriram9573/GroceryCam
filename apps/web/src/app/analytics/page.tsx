'use client';

import Navbar from '@/components/Navbar';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
    // Warm Theme Colors
    const COLORS = ['#f97316', '#fbbf24', '#f87171', '#a8a29e', '#fb923c'];

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const { auth, db } = require('@/lib/firebase');
        const { collection, query, where, getDocs } = require('firebase/firestore');

        const fetchStats = async () => {
            if (!auth.currentUser) return;

            try {
                // Fetch receipts directly from client
                const q = query(collection(db, 'receipts'), where('userId', '==', auth.currentUser.uid));
                const snap = await getDocs(q);

                const monthlySpend: Record<string, number> = {};
                const categorySplit: Record<string, number> = {};

                snap.forEach((doc: any) => {
                    const data = doc.data();
                    const dateStr = data.updatedAt || new Date().toISOString();
                    const month = dateStr.substring(0, 7); // YYYY-MM

                    monthlySpend[month] = (monthlySpend[month] || 0) + (data.total || 0);

                    if (data.items && Array.isArray(data.items)) {
                        data.items.forEach((item: any) => {
                            const cat = item.category || 'Other';
                            // Calc line total if missing (price * quantity)
                            const cost = item.lineTotal || ((item.unitPrice || 0) * (item.quantity || 1));
                            categorySplit[cat] = (categorySplit[cat] || 0) + cost;
                        });
                    }
                });

                setData({
                    monthlySpend: Object.entries(monthlySpend).map(([month, total]) => ({ month, total: Number(total.toFixed(2)) })),
                    categorySplit: Object.entries(categorySplit).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
                });
            } catch (e) {
                console.error("Analytics load failed", e);
            } finally {
                setLoading(false);
            }
        };

        // Wait for auth to settle
        const unsub = auth.onAuthStateChanged((u: any) => {
            if (u) fetchStats();
        });
        return () => unsub();
    }, []);

    return (
        <div className="min-h-screen pb-24 md:pb-0">
            <Navbar />
            <main className="max-w-5xl mx-auto p-4 md:pt-12 animate-in fade-in duration-700">
                <header className="mb-8 md:mb-12">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-neutral-900">
                        Savings & <span className="text-gradient">Spend</span> 📈
                    </h1>
                    <p className="text-neutral-500 mt-2 text-lg">
                        Track your grocery budget and category breakdown.
                    </p>
                </header>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="glass-panel p-6 rounded-2xl flex flex-col">
                            <h3 className="font-bold text-xl mb-6 text-neutral-800">Monthly Spending</h3>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.monthlySpend || []}>
                                        <XAxis dataKey="month" fontSize={12} stroke="#a3a3a3" tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} stroke="#a3a3a3" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: '#fff7ed' }}
                                        />
                                        <Bar dataKey="total" fill="#f97316" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl flex flex-col">
                            <h3 className="font-bold text-xl mb-6 text-neutral-800">Spend by Category</h3>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data?.categorySplit || []}
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={4}
                                            dataKey="value"
                                            nameKey="name"
                                            stroke="none"
                                        >
                                            {(data?.categorySplit || []).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
