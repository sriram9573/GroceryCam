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

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let progressInterval: NodeJS.Timeout;

        if (loading) {
            setProgress(0);

            // Simulate progress bar (fast start, slows down)
            progressInterval = setInterval(() => {
                setProgress(prev => {
                    // Logarithmic-ish behavior: fast at first, slows as it approaches 90%
                    const remaining = 95 - prev;
                    if (remaining <= 0) return prev;
                    // Slower decay: 1.5% of remaining per 100ms
                    const increment = Math.max(0.1, remaining * 0.015);
                    return Math.min(95, prev + increment);
                });
            }, 100);
        } else {
            setProgress(100);
        }

        return () => {
            clearInterval(progressInterval);
        };
    }, [loading]);

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
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-50">
                        Smart <span className="text-gradient">Recipes</span> 🍳
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-lg">
                        Chef-curated meals based on your pantry.
                    </p>
                </div>
            </header>

            {recipes.length === 0 && !loading && (
                <div className="text-center py-12">
                    <div className="bg-orange-50 dark:bg-orange-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ChefHat className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 dark:text-neutral-200">Ready to cook?</h3>
                    <p className="text-gray-500 dark:text-neutral-400 mb-6">We'll find budget-friendly meals using your pantry.</p>
                    <button
                        onClick={generateRecipes}
                        className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition shadow-lg hover:shadow-orange-500/20"
                    >
                        Generate Recipes
                    </button>
                </div>
            )}

            {loading && (
                <div className="text-center py-16 animate-in fade-in duration-500">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping"></div>
                        <div className="relative bg-white dark:bg-neutral-800 w-24 h-24 rounded-full flex items-center justify-center border-4 border-orange-100 dark:border-orange-900/30 shadow-xl">
                            <ChefHat className="w-10 h-10 text-orange-600 animate-bounce" />
                        </div>
                        <div className="absolute -right-2 -top-2 text-2xl animate-bounce delay-100">🥕</div>
                        <div className="absolute -left-2 -bottom-2 text-2xl animate-bounce delay-300">🥦</div>
                        <div className="absolute -right-2 -bottom-2 text-2xl animate-bounce delay-500">🍗</div>
                    </div>

                    <h3 className="text-2xl font-display font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                        Chef is cooking...
                    </h3>

                    <div className="h-6 overflow-hidden relative">
                        <p className="text-neutral-500 dark:text-neutral-400 animate-pulse">
                            Crafting personalized recipes from your pantry...
                        </p>
                    </div>

                    <div className="w-64 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full mx-auto mt-6 overflow-hidden relative">
                        <div
                            className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-100 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {recipes.map((r, i) => (
                    <div key={i} className="glass-panel dark:glass-panel p-6 rounded-2xl flex flex-col group hover:scale-[1.01] transition-all duration-300 relative z-10 hover:z-50">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-display text-2xl font-bold text-neutral-800 dark:text-neutral-100 leading-tight pr-8 relative">
                                {r.name}
                                {(() => {
                                    // Fallback to ensure icon always shows (simulated data if missing)
                                    const nutrition = r.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
                                    return (
                                        <span className="inline-block ml-2 align-middle transform -translate-y-1 relative group/info z-20">
                                            <div className="w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold ring-1 ring-orange-200 dark:ring-orange-800 cursor-help hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:scale-110 transition-all shadow-sm">
                                                i
                                            </div>
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 w-64 shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-300 transform group-hover/info:translate-y-0 text-left font-sans font-normal">
                                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-neutral-800 border-t border-l border-neutral-200 dark:border-neutral-700 rotate-45"></div>
                                                <div className="flex items-center justify-between mb-3 border-b border-neutral-100 dark:border-neutral-700 pb-2 relative z-10">
                                                    <span className="font-display font-bold text-neutral-800 dark:text-neutral-100 text-sm">Nutrition Facts</span>
                                                    <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">Per Serv</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 relative z-10">
                                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-xl p-2.5 flex flex-col items-center border border-neutral-100 dark:border-neutral-700 transition-colors">
                                                        <span className="text-neutral-900 dark:text-neutral-50 font-bold text-lg leading-none mb-0.5">{nutrition.calories}</span>
                                                        <span className="text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-tight">Calories</span>
                                                    </div>
                                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-xl p-2.5 flex flex-col items-center border border-neutral-100 dark:border-neutral-700 transition-colors">
                                                        <span className="text-neutral-900 dark:text-neutral-50 font-bold text-lg leading-none mb-0.5">{nutrition.protein}g</span>
                                                        <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-tight">Protein</span>
                                                    </div>
                                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-xl p-2.5 flex flex-col items-center border border-neutral-100 dark:border-neutral-700 transition-colors">
                                                        <span className="text-neutral-900 dark:text-neutral-50 font-bold text-lg leading-none mb-0.5">{nutrition.carbs}g</span>
                                                        <span className="text-[10px] font-bold text-green-500 dark:text-green-400 uppercase tracking-tight">Carbs</span>
                                                    </div>
                                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-xl p-2.5 flex flex-col items-center border border-neutral-100 dark:border-neutral-700 transition-colors">
                                                        <span className="text-neutral-900 dark:text-neutral-50 font-bold text-lg leading-none mb-0.5">{nutrition.fat}g</span>
                                                        <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-tight">Fats</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </span>
                                    );
                                })()}
                            </h3>
                            <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg shrink-0 mt-1 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatCookTime(r.cookTimeMin)}</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex flex-wrap gap-2">
                                {r.ingredients.map((ing, j) => (
                                    <span key={j} className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border shadow-sm transition-all hover:shadow-md cursor-default"
                                        style={{
                                            background: ing.inStock ? 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)' : 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)',
                                            borderColor: ing.inStock ? '#10b981' : '#f43f5e',
                                            color: ing.inStock ? '#047857' : '#be123c',
                                        }}>
                                        {ing.name} <span className="opacity-80 font-medium" style={{ color: 'inherit' }}>({ing.qty} {ing.unit})</span>
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

                        <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-neutral-800">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">Instructions</h4>
                            <ol className="list-decimal list-outside ml-4 space-y-2">
                                {r.steps.map((step, k) => (
                                    <li key={k} className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed pl-1">{step}</li>
                                ))}
                            </ol>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}

// Helper to format minutes into "Xhr Ymin" or "Z min"
const formatCookTime = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}hr ${remainingMins} min` : `${hours}hr`;
};

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
