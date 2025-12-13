'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChefHat, LineChart, PlusCircle, LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/');
    };

    const navs = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Recipes', href: '/recipes', icon: ChefHat },
        { name: 'Analytics', href: '/analytics', icon: LineChart },
    ];

    return (
        <>
            {/* Desktop / floating navbar container */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:top-6 md:bottom-auto w-[90%] md:w-auto z-50">
                <nav className="glass-panel rounded-full px-6 py-3 flex items-center justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ring-1 ring-orange-100">

                    {/* Logo */}
                    <div className="hidden md:block font-display font-bold text-xl text-gradient pr-4 border-r border-orange-100">
                        GroceryCam
                    </div>

                    <div className="flex items-center gap-2 md:gap-6 w-full justify-between md:justify-start">
                        {navs.map((n) => {
                            const Icon = n.icon;
                            const active = pathname === n.href;
                            return (
                                <Link
                                    key={n.name}
                                    href={n.href}
                                    className={`relative group flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${active ? 'text-primary-600 scale-110' : 'text-neutral-400 hover:text-neutral-800 hover:bg-orange-50'}`}
                                >
                                    <Icon className={`w-6 h-6 ${active ? 'fill-current opacity-20' : ''}`} strokeWidth={active ? 2.5 : 2} />
                                    <span className="sr-only md:not-sr-only md:text-[10px] font-bold mt-1 tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 md:static md:bottom-auto text-primary-600">
                                        {n.name}
                                    </span>
                                    {active && (
                                        <span className="absolute -bottom-1 md:-bottom-2 w-1 h-1 bg-primary-500 rounded-full" />
                                    )}
                                </Link>
                            );
                        })}

                        {/* Divider */}
                        <div className="w-px h-6 bg-orange-100 mx-2" />

                        <Link
                            href="/upload"
                            className="bg-neutral-900 text-white rounded-full p-3 md:px-5 md:py-2 flex items-center gap-2 shadow-lg hover:bg-neutral-800 hover:scale-105 transition-all active:scale-95"
                        >
                            <PlusCircle className="w-6 h-6 md:w-5 md:h-5" />
                            <span className="hidden md:inline font-bold text-sm">Upload</span>
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="text-neutral-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </nav>
            </div>

            {/* Spacer for content to not be hidden behind fixed nav */}
            <div className="h-24 md:h-28" />
        </>
    );
}
