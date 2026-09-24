import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/services/supabase";
import { useToast } from "@/components/ui/use-toast";

interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Product, quantity: number) => void;
    removeFromCart: (id: number) => void;
    updateQuantity: (id: number, delta: number) => void;
    subtotal: number;
    total: number;
    itemCount: number;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem("lorean-cart");
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load cart", e);
            return [];
        }
    });

    const { toast } = useToast();

    useEffect(() => {
        localStorage.setItem("lorean-cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product: Product, quantity: number) => {
        if (product.stock !== undefined && product.stock !== null && product.stock <= 0) {
            toast({
                title: "Out of Stock",
                description: `${product.name} is currently out of stock.`,
                variant: "destructive"
            });
            return;
        }

        const isComingSoon = product.tag?.toLowerCase() === "coming soon" || product.tag?.toLowerCase() === "comming soon";
        if (isComingSoon) {
            toast({
                title: "Coming Soon",
                description: `${product.name} is arriving soon and cannot be purchased yet.`,
            });
            return;
        }

        const existingItem = cartItems.find((item) => item.id === product.id);
        const currentQtyInCart = existingItem ? existingItem.quantity : 0;
        if (product.stock !== undefined && product.stock !== null && (currentQtyInCart + quantity) > product.stock) {
            toast({
                title: "Stock Limit Reached",
                description: `Only ${product.stock} units available in stock (${currentQtyInCart} already in your bag).`,
                variant: "destructive"
            });
            return;
        }

        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { ...product, quantity }];
        });

        toast({
            title: "Added to Cart",
            description: `${quantity} x ${product.name} added to your bag.`,
        });
    };

    const removeFromCart = (id: number) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    };

    const updateQuantity = (id: number, delta: number) => {
        setCartItems((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const nextQty = item.quantity + delta;
                    if (nextQty < 1) return item;
                    if (delta > 0 && item.stock !== undefined && item.stock !== null && nextQty > item.stock) {
                        toast({
                            title: "Stock Limit",
                            description: `Only ${item.stock} units available in stock.`,
                            variant: "destructive"
                        });
                        return item;
                    }
                    return { ...item, quantity: nextQty };
                }
                return item;
            })
        );
    };

    const clearCart = () => setCartItems([]);

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    const total = subtotal; // Shipping handled at checkout
    const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

    return (
        <CartContext.Provider value={{
            cartItems, addToCart, removeFromCart, updateQuantity,
            subtotal, total, itemCount, clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within CartProvider");
    return context;
};
