import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
    id: string;
    name: string;
    price: number;
    img: string;
}

interface WishlistState {
    items: WishlistItem[];
    addItem: (item: WishlistItem) => void;
    removeItem: (id: string) => void;
    isInWishlist: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => set((state) => {
                if (!state.items.find(i => i.id === item.id)) {
                    return { items: [...state.items, item] };
                }
                return state;
            }),
            removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
            isInWishlist: (id) => get().items.some(i => i.id === id),
        }),
        {
            name: 'deeprastore-wishlist',
        }
    )
);
