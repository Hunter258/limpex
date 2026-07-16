import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
};

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('limpex_cart')) || [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('limpex_cart', JSON.stringify(items));
    }, [items]);

    const addItem = useCallback((product, quantity = 1) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                const maxQty = product.stock_quantity || 999;
                const newQty = Math.min(existing.quantity + quantity, maxQty);
                return prev.map(i => i.id === product.id ? { ...i, quantity: newQty } : i);
            }
            return [...prev, {
                id: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit || 'kg',
                image_url: product.image_url,
                quantity,
                stock_quantity: product.stock_quantity
            }];
        });
    }, []);

    const removeItem = useCallback((productId) => {
        setItems(prev => prev.filter(i => i.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId, quantity) => {
        if (quantity <= 0) {
            setItems(prev => prev.filter(i => i.id !== productId));
            return;
        }
        setItems(prev => prev.map(i => {
            if (i.id === productId) {
                const maxQty = i.stock_quantity || 999;
                return { ...i, quantity: Math.min(quantity, maxQty) };
            }
            return i;
        }));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
    const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

    return (
        <CartContext.Provider value={{
            items, addItem, removeItem, updateQuantity, clearCart,
            getTotal: () => total,
            getItemCount: () => itemCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
