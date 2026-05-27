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
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQty: (id: string, qty: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    setIsOpen: (isOpen: boolean) => void;
    getTotal: () => number;
    setCurrentUser: (userId: string | null) => void;
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
        addItem: (item) => set((state) => {
            const existing = state.items.find(i => i.id === item.id);
            let newItems;
            if (existing) {
                newItems = state.items.map(i => i.id === item.id ? { ...i, qty: i.qty + item.qty } : i);
            } else {
                newItems = [...state.items, item];
            }
            saveToLocalStorage(state.currentUserId, newItems);
            return { items: newItems, isOpen: true };
        }),
        removeItem: (id) => set((state) => {
            const newItems = state.items.filter(i => i.id !== id);
            saveToLocalStorage(state.currentUserId, newItems);
            return { items: newItems };
        }),
        updateQty: (id, qty) => set((state) => {
            const newItems = state.items.map(i => i.id === id ? { ...i, qty } : i);
            saveToLocalStorage(state.currentUserId, newItems);
            return { items: newItems };
        }),
        clearCart: () => set((state) => {
            saveToLocalStorage(state.currentUserId, []);
            return { items: [] };
        }),
        toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
        setIsOpen: (isOpen) => set({ isOpen }),
        getTotal: () => {
            const items = get().items;
            return items.reduce((total, item) => total + (item.price * item.qty), 0);
        },
        setCurrentUser: (userId) => {
            if (typeof window === 'undefined') return;

            const oldUserId = get().currentUserId;
            const currentItems = get().items;

            // Save current items to previous owner's slot
            const oldKey = oldUserId ? `cart-storage-${oldUserId}` : 'cart-storage-guest';
            localStorage.setItem(oldKey, JSON.stringify(currentItems));

            // Load new user's items
            const newKey = userId ? `cart-storage-${userId}` : 'cart-storage-guest';
            const raw = localStorage.getItem(newKey);
            let loadedItems: CartItem[] = [];
            if (raw) {
                try {
                    loadedItems = JSON.parse(raw);
                } catch (e) {
                    console.error('Failed to parse cart storage:', e);
                }
            }

            // Merging: If logging in (guest -> logged in user) and guest has items
            if (userId && !oldUserId && currentItems.length > 0) {
                const merged = [...loadedItems];
                currentItems.forEach(guestItem => {
                    const existing = merged.find(i => i.id === guestItem.id);
                    if (existing) {
                        existing.qty += guestItem.qty;
                    } else {
                        merged.push({ ...guestItem });
                    }
                });
                loadedItems = merged;
                
                // Clear guest slot so next guest starts fresh
                localStorage.setItem('cart-storage-guest', JSON.stringify([]));
            }

            set({ currentUserId: userId, items: loadedItems });
            localStorage.setItem(newKey, JSON.stringify(loadedItems));
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
