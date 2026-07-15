import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('limpex_cart', JSON.stringify(items));
    }, [items]);

    const addItem = (product, quantity = 1) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
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
        setIsCartOpen(true);
    };

    const removeItem = (productId) => {
        setItems(prev => prev.filter(i => i.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        setItems(prev => prev.map(i => i.id === productId ? { ...i, quantity } : i));
    };

    const clearCart = () => setItems([]);

    const getTotal = () => items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const getItemCount = () => items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items, addItem, removeItem, updateQuantity, clearCart,
            getTotal, getItemCount, isCartOpen, setIsCartOpen
        }}>
            {children}
        </CartContext.Provider>
    );
};
