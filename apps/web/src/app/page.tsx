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
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex flex-col gap-8">
                <h1 className="text-4xl font-bold text-center">GroceryCam 🥦</h1>
                <p className="text-center text-lg opacity-80">
                    Snap receipts, track pantry, save money.
                </p>

                <button
                    onClick={handleLogin}
                    className="px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign in with Google'}
                </button>
            </div>
        </main>
    );
}
