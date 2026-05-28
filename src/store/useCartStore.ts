import { create } from 'zustand';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    qty: number;
    img: string;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    currentUserId: string | null;
    addItem: (item: CartItem) => Promise<void>;
    removeItem: (id: string) => Promise<void>;
    updateQty: (id: string, qty: number) => Promise<void>;
    clearCart: () => Promise<void>;
    toggleCart: () => void;
    setIsOpen: (isOpen: boolean) => void;
    getTotal: () => number;
    setCurrentUser: (userId: string | null) => Promise<void>;
    loadCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => {
    // Helper to save cart to localStorage helper
    const saveToLocalStorage = (userId: string | null, items: CartItem[]) => {
        if (typeof window === 'undefined') return;
        const key = userId ? `cart-storage-${userId}` : 'cart-storage-guest';
        localStorage.setItem(key, JSON.stringify(items));
    };

    return {
        items: [],
        isOpen: false,
        currentUserId: null,
        addItem: async (item) => {
            const state = get();
            const existing = state.items.find(i => i.id === item.id);
            let newItems;
            if (existing) {
                newItems = state.items.map(i => i.id === item.id ? { ...i, qty: i.qty + item.qty } : i);
            } else {
                newItems = [...state.items, item];
            }
            saveToLocalStorage(state.currentUserId, newItems);
            set({ items: newItems, isOpen: true });

            if (state.currentUserId) {
                const { supabase } = await import('@/lib/supabase');
                if (existing) {
                    await supabase.from('carts').update({ qty: existing.qty + item.qty }).match({ customer_id: state.currentUserId, product_id: item.id });
                } else {
                    await supabase.from('carts').insert({
                        customer_id: state.currentUserId,
                        product_id: item.id,
                        product_name: item.name,
                        price: item.price,
                        qty: item.qty,
                        img_url: item.img
                    });
                }
            }
        },
        removeItem: async (id) => {
            const state = get();
            const newItems = state.items.filter(i => i.id !== id);
            saveToLocalStorage(state.currentUserId, newItems);
            set({ items: newItems });

            if (state.currentUserId) {
                const { supabase } = await import('@/lib/supabase');
                await supabase.from('carts').delete().match({ customer_id: state.currentUserId, product_id: id });
            }
        },
        updateQty: async (id, qty) => {
            const state = get();
            const newItems = state.items.map(i => i.id === id ? { ...i, qty } : i);
            saveToLocalStorage(state.currentUserId, newItems);
            set({ items: newItems });

            if (state.currentUserId) {
                const { supabase } = await import('@/lib/supabase');
                await supabase.from('carts').update({ qty }).match({ customer_id: state.currentUserId, product_id: id });
            }
        },
        clearCart: async () => {
            const state = get();
            saveToLocalStorage(state.currentUserId, []);
            set({ items: [] });

            if (state.currentUserId) {
                const { supabase } = await import('@/lib/supabase');
                await supabase.from('carts').delete().match({ customer_id: state.currentUserId });
            }
        },
        toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
        setIsOpen: (isOpen) => set({ isOpen }),
        getTotal: () => {
            const items = get().items;
            return items.reduce((total, item) => total + (item.price * item.qty), 0);
        },
        setCurrentUser: async (userId) => {
            if (typeof window === 'undefined') return;

            const oldUserId = get().currentUserId;
            const currentItems = get().items;

            // Save current items to previous owner's slot (if logging out)
            if (oldUserId) {
                const oldKey = `cart-storage-${oldUserId}`;
                localStorage.setItem(oldKey, JSON.stringify(currentItems));
            }

            if (!userId) {
                // Switching to guest
                set({ currentUserId: null, items: [] });
                return;
            }

            // --- User is logging in ---
            
            // 1. Get Guest Cart
            const guestKey = 'cart-storage-guest';
            const rawGuest = localStorage.getItem(guestKey);
            let guestItems: CartItem[] = [];
            if (rawGuest) {
                try {
                    guestItems = JSON.parse(rawGuest);
                } catch (e) {}
            }

            // 2. Fetch User's DB Cart
            const { supabase } = await import('@/lib/supabase');
            const { data: dbCart, error } = await supabase
                .from('carts')
                .select('*')
                .eq('customer_id', userId);

            let mergedItems: CartItem[] = [];
            
            if (!error && dbCart) {
                mergedItems = dbCart.map(row => ({
                    id: row.product_id,
                    name: row.product_name,
                    price: Number(row.price),
                    qty: row.qty,
                    img: row.img_url
                }));
            }

            // 3. Merge Guest Items into DB
            if (guestItems.length > 0) {
                for (const guestItem of guestItems) {
                    const existing = mergedItems.find(i => i.id === guestItem.id);
                    if (existing) {
                        existing.qty += guestItem.qty;
                        await supabase.from('carts').update({ qty: existing.qty }).eq('customer_id', userId).eq('product_id', guestItem.id);
                    } else {
                        mergedItems.push({ ...guestItem });
                        await supabase.from('carts').insert({
                            customer_id: userId,
                            product_id: guestItem.id,
                            product_name: guestItem.name,
                            price: guestItem.price,
                            qty: guestItem.qty,
                            img_url: guestItem.img
                        });
                    }
                }
                // Clear guest slot
                localStorage.setItem(guestKey, JSON.stringify([]));
            }

            set({ currentUserId: userId, items: mergedItems });
            localStorage.setItem(`cart-storage-${userId}`, JSON.stringify(mergedItems));
        },
        loadCart: () => {
            if (typeof window === 'undefined') return;
            const userId = get().currentUserId;
            const key = userId ? `cart-storage-${userId}` : 'cart-storage-guest';
            const raw = localStorage.getItem(key);
            if (raw) {
                try {
                    set({ items: JSON.parse(raw) });
                } catch (e) {
                    console.error('Failed to load cart storage:', e);
                }
            }
        }
    };
});
