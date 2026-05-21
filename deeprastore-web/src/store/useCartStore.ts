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
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQty: (id: string, qty: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    setIsOpen: (isOpen: boolean) => void;
    getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    isOpen: false,
    addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.id === item.id);
        if (existing) {
            return { items: state.items.map(i => i.id === item.id ? { ...i, qty: i.qty + item.qty } : i), isOpen: true };
        }
        return { items: [...state.items, item], isOpen: true };
    }),
    removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
    updateQty: (id, qty) => set((state) => ({
        items: state.items.map(i => i.id === id ? { ...i, qty } : i)
    })),
    clearCart: () => set({ items: [] }),
    toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    setIsOpen: (isOpen) => set({ isOpen }),
    getTotal: () => {
        const items = get().items;
        return items.reduce((total, item) => total + (item.price * item.qty), 0);
    }
}));
