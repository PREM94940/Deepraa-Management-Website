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
    clearWishlist: () => void;
    currentUserId: string | null;
    setCurrentUser: (userId: string | null) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: async (item) => {
                const state = get();
                if (!state.items.find(i => i.id === item.id)) {
                    set({ items: [...state.items, item] });
                    if (state.currentUserId) {
                        const { supabase } = await import('@/lib/supabase');
                        await supabase.from('wishlists').insert({
                            customer_id: state.currentUserId,
                            product_id: item.id,
                            product_name: item.name,
                            price: item.price,
                            img_url: item.img
                        });
                    }
                }
            },
            removeItem: async (id) => {
                const state = get();
                set({ items: state.items.filter(i => i.id !== id) });
                if (state.currentUserId) {
                    const { supabase } = await import('@/lib/supabase');
                    await supabase.from('wishlists').delete().match({ customer_id: state.currentUserId, product_id: id });
                }
            },
            isInWishlist: (id) => get().items.some(i => i.id === id),
            clearWishlist: () => set({ items: [] }),
            currentUserId: null,
            setCurrentUser: async (userId) => {
                if (typeof window === 'undefined') return;

                const currentItems = get().items;
                const oldUserId = get().currentUserId;

                if (!userId) {
                    set({ currentUserId: null, items: [] });
                    return;
                }

                // If logging in
                const guestItems = [...currentItems];

                // Fetch DB wishlist
                const { supabase } = await import('@/lib/supabase');
                const { data: dbWishlist, error } = await supabase
                    .from('wishlists')
                    .select('*')
                    .eq('customer_id', userId);

                let mergedItems: WishlistItem[] = [];
                if (!error && dbWishlist) {
                    mergedItems = dbWishlist.map(row => ({
                        id: row.product_id,
                        name: row.product_name,
                        price: Number(row.price),
                        img: row.img_url
                    }));
                }

                if (guestItems.length > 0) {
                    for (const guestItem of guestItems) {
                        const existing = mergedItems.find(i => i.id === guestItem.id);
                        if (!existing) {
                            mergedItems.push(guestItem);
                            await supabase.from('wishlists').insert({
                                customer_id: userId,
                                product_id: guestItem.id,
                                product_name: guestItem.name,
                                price: guestItem.price,
                                img_url: guestItem.img
                            });
                        }
                    }
                }

                set({ currentUserId: userId, items: mergedItems });
            }
        }),
        {
            name: 'deeprastore-wishlist',
        }
    )
);
