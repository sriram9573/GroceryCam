import { create } from 'zustand';
import { User, Receipt, PantryItem } from '@grocery-cam/shared';

interface AppState {
    user: User | null;
    setUser: (user: User | null) => void;
    pantry: PantryItem[];
    setPantry: (items: PantryItem[]) => void;
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    pantry: [],
    setPantry: (pantry) => set({ pantry }),
    isLoading: true,
    setLoading: (isLoading) => set({ isLoading }),
}));
