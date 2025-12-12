'use client';

import Navbar from '@/components/Navbar';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
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
                    categorySplit: Object.entries(categorySplit).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) })) // Recharts pie uses name/value calls
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
        <div className="min-h-screen pb-20 md:pb-0">
            <Navbar />
            <main className="max-w-5xl mx-auto p-4">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold">Savings & Spend 📈</h1>
                </header>

                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold mb-6">Monthly Spending</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.monthlySpend || []}>
                                        <XAxis dataKey="month" fontSize={12} />
                                        <YAxis fontSize={12} />
                                        <Tooltip />
                                        <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold mb-6">Spend by Category</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data?.categorySplit || []}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {(data?.categorySplit || []).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
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
