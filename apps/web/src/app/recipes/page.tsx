'use client';

import Navbar from '@/components/Navbar';
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { Recipe } from '@grocery-cam/shared';
import { Loader2, ChefHat, Clock, DollarSign } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function RecipesPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const autoGenerate = searchParams.get('auto');

    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current && autoGenerate === 'true' && recipes.length === 0 && !loading) {
            initialized.current = true;
            generateRecipes();
        }
    }, [autoGenerate]);

    const generateRecipes = async () => {
        setLoading(true);
        try {
            // Fetch pantry items locally first
            const { db, auth } = await import('@/lib/firebase');
            const { collection, getDocs } = await import('firebase/firestore');

            if (!auth.currentUser) return;

            const snap = await getDocs(collection(db, 'users', auth.currentUser.uid, 'pantry'));
            const items = snap.docs.map(d => ({ name: d.data().name, qty: d.data().quantity, unit: d.data().unit }));

            const res = await apiClient('/recipes', {
                method: 'POST',
                body: JSON.stringify({ items, query: searchParams.get('query') })
            });
            setRecipes(res.recipes);
        } catch (error) {
            console.error(error);
            // alert('Failed to generate recipes'); // Removed annoying alert
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pb-20 md:pb-0">
            <Navbar />
            <main className="max-w-5xl mx-auto p-4">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Smart Recipes 🍳</h1>
                        <p className="text-gray-500">Based on what you have in stock.</p>
                    </div>
                </header>

                {recipes.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <div className="bg-orange-50 dark:bg-orange-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ChefHat className="w-8 h-8 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Ready to cook?</h3>
                        <p className="text-gray-500 mb-6">We'll find budget-friendly meals using your pantry.</p>
                        <button
                            onClick={generateRecipes}
                            className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition"
                        >
                            Generate Recipes
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-12 text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
                        Creating menu...
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recipes.map((r, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition">
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-2">{r.name}</h3>
                                <div className="flex gap-4 text-sm text-gray-500 mb-4">
                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {r.cookTimeMin}m</span>
                                    <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> ~${r.estCost}</span>
                                </div>
                                <div className="mb-4">
                                    <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400 mb-2">Ingredients</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {r.ingredients.map((ing, j) => (
                                            <span key={j} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${ing.inStock ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                {!ing.inStock && <span className="font-bold">!</span>}
                                                {ing.name} ({ing.qty}{ing.unit})
                                            </span>
                                        ))}
                                    </div>

                                    {r.ingredients.some(i => !i.inStock) && (
                                        <div className="mt-3">
                                            <a
                                                href={`https://www.google.com/maps/search/grocery+store+near+me`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                <DollarSign className="w-3 h-3" />
                                                Buy missing ingredients nearby
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400 mb-2">Instructions</h4>
                                    <ol className="list-decimal list-inside text-sm space-y-1">
                                        {r.steps.map((step, k) => (
                                            <li key={k} className="text-gray-600 dark:text-gray-300">{step}</li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
