import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/services/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useProducts } from "@/context/ProductsContext";

interface WishlistContextType {
    wishlistItems: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (id: number) => void;
    isInWishlist: (id: number) => boolean;
    itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState<Product[]>(() => {
        try {
            const saved = localStorage.getItem("lorean-wishlist");
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load wishlist", e);
            return [];
        }
    });

    const { toast } = useToast();
    const { products, loading } = useProducts();

    useEffect(() => {
        localStorage.setItem("lorean-wishlist", JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    // Clean up wishlist items that no longer exist in the products database
    useEffect(() => {
        if (!loading && products.length > 0 && wishlistItems.length > 0) {
            const productIds = new Set(products.map(p => p.id));
            const validItems = wishlistItems.filter(item => productIds.has(item.id));
            if (validItems.length !== wishlistItems.length) {
                setWishlistItems(validItems);
            }
        }
    }, [loading, products]);

    const addToWishlist = (product: Product) => {
        if (wishlistItems.find((item) => item.id === product.id)) {
            setWishlistItems((prev) => prev.filter((item) => item.id !== product.id));
            toast({
                title: "Removed from Wishlist",
                description: `${product.name} has been removed from your selection.`,
            });
            return;
        }

        setWishlistItems((prev) => [...prev, product]);
        toast({
            title: "Saved to Wishlist",
            description: `${product.name} has been saved to your collection.`,
        });
    };

    const removeFromWishlist = (id: number) => {
        setWishlistItems((prev) => prev.filter((item) => item.id !== id));
    };

    const isInWishlist = (id: number) => {
        return !!wishlistItems.find((item) => item.id === id);
    };

    const itemCount = wishlistItems.length;

    return (
        <WishlistContext.Provider value={{
            wishlistItems, addToWishlist, removeFromWishlist, isInWishlist, itemCount
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) throw new Error("useWishlist must be used within WishlistProvider");
    return context;
};
