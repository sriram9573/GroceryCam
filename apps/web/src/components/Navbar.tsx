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
        <nav className="fixed bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:relative md:border-t-0 md:bg-transparent md:mb-8">
            <div className="max-w-5xl mx-auto px-4 md:py-4 flex justify-between items-center">
                <div className="hidden md:block font-bold text-xl text-green-600">GroceryCam</div>

                <div className="flex w-full md:w-auto justify-around md:gap-8 p-2 md:p-0">
                    {navs.map((n) => {
                        const Icon = n.icon;
                        const active = pathname === n.href;
                        return (
                            <Link key={n.name} href={n.href} className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 rounded-lg transition ${active ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}>
                                <Icon className="w-6 h-6" />
                                <span className="text-xs md:text-sm font-medium">{n.name}</span>
                            </Link>
                        );
                    })}
                    <Link href="/upload" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 text-green-600">
                        <PlusCircle className="w-6 h-6" />
                        <span className="text-xs md:text-sm font-medium">Upload</span>
                    </Link>

                    <button onClick={handleLogout} className="hidden md:flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <LogOut className="w-6 h-6" />
                        <span className="text-xs md:text-sm font-medium">Sign Out</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
