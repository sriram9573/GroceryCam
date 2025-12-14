'use client';

import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function Home() {
    const router = useRouter();
    const setUser = useStore((state) => state.setUser);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || undefined,
                    createdAt: new Date().toISOString()
                });
                router.push('/dashboard');
            } else {
                setInitializing(false);
            }
        });
        return () => unsubscribe();
    }, [router, setUser]);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            // onAuthStateChanged will handle redirection
        } catch (error) {
            console.error("Login failed", error);
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/30 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-200/30 rounded-full blur-3xl animate-pulse delay-700" />
                </div>
                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-700">
                    <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    <p className="text-neutral-500 font-medium animate-pulse">Loading kitchen...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-200/30 rounded-full blur-3xl" />
            </div>

            <div className="z-10 max-w-lg w-full flex flex-col items-center gap-8 text-center">
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-4">
                    <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                        Grocery<span className="text-gradient">Cam</span>
                    </h1>
                    <p className="text-lg text-neutral-500 max-w-sm mx-auto leading-relaxed">
                        Your intelligent kitchen assistant. Scan receipts, track pantry, and cook smarter.
                    </p>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 w-full max-w-xs">
                    <button
                        onClick={handleLogin}
                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Connecting...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign in with Google</span>
                            </>
                        )}
                    </button>
                    <p className="mt-6 text-xs text-neutral-400">
                        Powered by Google Gemini & Vision AI
                    </p>
                </div>
            </div>
        </main>
    );
}
