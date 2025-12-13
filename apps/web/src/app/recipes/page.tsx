'use client';

import Navbar from '@/components/Navbar';
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { Recipe } from '@grocery-cam/shared';
import { Loader2, ChefHat, Clock, DollarSign } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function RecipesContent() {
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
        <main className="max-w-5xl mx-auto p-4">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-neutral-900">
                        Smart <span className="text-gradient">Recipes</span> 🍳
                    </h1>
                    <p className="text-neutral-500 mt-2 text-lg">
                        Chef-curated meals based on your pantry.
                    </p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {recipes.map((r, i) => (
                    <div key={i} className="glass-panel p-6 rounded-2xl flex flex-col group hover:scale-[1.01] transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-display text-2xl font-bold text-neutral-800 leading-tight">{r.name}</h3>
                            <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.cookTimeMin}m</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex flex-wrap gap-2">
                                {r.ingredients.map((ing, j) => (
                                    <span key={j} className={`text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1 border ${ing.inStock
                                        ? 'bg-green-50 text-green-700 border-green-100'
                                        : 'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                        {!ing.inStock && <span className="font-bold text-red-600">!</span>}
                                        {ing.name} ({ing.qty} {ing.unit})
                                    </span>
                                ))}
                            </div>

                            {r.ingredients.some(i => !i.inStock) && (
                                <div className="mt-3">
                                    <a
                                        href={`https://www.google.com/maps/search/grocery+store+near+me`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
                                    >
                                        <DollarSign className="w-3 h-3" />
                                        Buy missing (~${r.estCost})
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-6 border-t border-neutral-100">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-400 mb-3">Instructions</h4>
                            <ol className="list-decimal list-outside ml-4 space-y-2">
                                {r.steps.map((step, k) => (
                                    <li key={k} className="text-neutral-600 text-sm leading-relaxed pl-1">{step}</li>
                                ))}
                            </ol>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}

export default function RecipesPage() {
    return (
        <div className="min-h-screen pb-20 md:pb-0">
            <Navbar />
            <Suspense fallback={
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                </div>
            }>
                <RecipesContent />
            </Suspense>
        </div>
    );
}
