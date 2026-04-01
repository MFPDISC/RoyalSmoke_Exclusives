import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);

    const applyPromoCode = (code) => {
        if (code.toUpperCase() === 'ROYAL150') {
            setPromoCode('ROYAL150');
            setPromoDiscount(150);
            return true;
        }
        return false;
    };

    // Calculate cart totals
    const cartSubtotal = cartItems.reduce((sum, item) => {
        const price = item.price_zar || 0;
        const qty = item.quantity || 1;
        return sum + (price * qty);
    }, 0);

    // R2500+ gets 20% bulk discount (non-members)
    const bulkDiscountThreshold = 2500;
    const bulkDiscountApplies = cartSubtotal >= bulkDiscountThreshold;
    const bulkDiscountAmount = bulkDiscountApplies ? cartSubtotal * 0.20 : 0;
    
    const cartTotal = Math.max(0, cartSubtotal - bulkDiscountAmount - promoDiscount);

    // Load cart from local storage on init
    useEffect(() => {
        const savedCart = localStorage.getItem('royal_cart');
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }
    }, []);

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('royal_cart', JSON.stringify(cartItems));

        // Sync cart state for abandonment tracking if there are items and a contact is known
        const customer = JSON.parse(localStorage.getItem('royal_customer') || 'null');
        if (cartItems.length > 0 && customer?.ghl_contact_id) {
            const timer = setTimeout(async () => {
                try {
                    const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                    await axios.post(`${API}/ghl/cart-abandonment`, {
                        contactId: customer.ghl_contact_id,
                        cartItems: cartItems.map(i => ({ id: i.id, name: i.name, qty: i.quantity })),
                        cartTotal: cartTotal
                    });
                } catch (err) {
                    console.error('Failed to sync abandonment data:', err);
                }
            }, 60000); // Wait 1 minute of inactivity to sync

            return () => clearTimeout(timer);
        }
    }, [cartItems, cartTotal]);

    const addToCart = (product) => {
        setCartItems(prev => {
            const isMembership = String(product.id).startsWith('membership-') || product.category === 'Membership';
            const existing = prev.find(item => item.id === product.id);

            if (existing) {
                // Prevent duplicate memberships
                if (isMembership) return prev;

                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }

            // If adding membership, remove any existing membership first (only one tier allowed)
            if (isMembership) {
                const filteredCart = prev.filter(item => !String(item.id).startsWith('membership-') && item.category !== 'Membership');
                return [...filteredCart, { ...product, quantity: 1 }];
            }

            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const clearCart = () => setCartItems([]);

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount,
            cartSubtotal,
            cartTotal,
            promoCode,
            promoDiscount,
            applyPromoCode,
            bulkDiscountApplies,
            bulkDiscountAmount,
            bulkDiscountThreshold
        }}>
            {children}
        </CartContext.Provider>
    );
};
